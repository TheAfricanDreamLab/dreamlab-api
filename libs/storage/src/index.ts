import { HttpStatus, Logger } from '@nestjs/common';
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  RestError,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { AppException } from '@lib/common';
import { z } from 'zod';

/*
 * File storage on Azure Blob (MEDIA-1); Azurite in development. Browsers upload straight to storage
 * with a short-lived, write-only SAS URL, so files never pass through the services. Public course
 * media is read through the site's /media path; private files only through a short-lived read link
 * the owning service issues after checking access.
 */

export const storageConfigShape = {
  /** Account connection string (account key). Without it, uploads are unavailable. */
  STORAGE_CONNECTION_STRING: z.string().min(20).optional(),
  /** Container read anonymously through /media (course images and videos). */
  STORAGE_PUBLIC_CONTAINER: z.string().default('media'),
  /** Container only reachable with a SAS link (learners' files). */
  STORAGE_PRIVATE_CONTAINER: z.string().default('private'),
};

export interface StorageConfig {
  STORAGE_CONNECTION_STRING?: string;
  STORAGE_PUBLIC_CONTAINER: string;
  STORAGE_PRIVATE_CONTAINER: string;
}

export type Visibility = 'public' | 'private';

export interface UploadTicket {
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface StoredBlob {
  size: number;
  contentType: string | null;
}

const UPLOAD_MINUTES = 30;
const READ_MINUTES = 10;

export class BlobStorage {
  private readonly logger = new Logger('Storage');
  private readonly service: BlobServiceClient | null;
  private readonly credential: StorageSharedKeyCredential | null;

  constructor(private readonly config: StorageConfig) {
    if (!config.STORAGE_CONNECTION_STRING) {
      this.service = null;
      this.credential = null;
      return;
    }
    this.service = BlobServiceClient.fromConnectionString(config.STORAGE_CONNECTION_STRING);
    this.credential = this.service.credential instanceof StorageSharedKeyCredential ? this.service.credential : null;
    if (!this.credential) throw new Error('STORAGE_CONNECTION_STRING must carry an account key (it signs upload links)');
  }

  get enabled(): boolean {
    return this.service !== null;
  }

  /** Development (Azurite): create the containers and let the local web app upload from the browser. */
  async prepareForDevelopment(): Promise<void> {
    if (!this.service) return;
    await this.service.getContainerClient(this.config.STORAGE_PUBLIC_CONTAINER).createIfNotExists({ access: 'blob' });
    await this.service.getContainerClient(this.config.STORAGE_PRIVATE_CONTAINER).createIfNotExists();
    await this.service.setProperties({
      cors: [{ allowedOrigins: '*', allowedMethods: 'PUT,GET,HEAD', allowedHeaders: '*', exposedHeaders: 'etag', maxAgeInSeconds: 3600 }],
    });
  }

  /** A write-only link for one blob, valid for half an hour. */
  uploadTicket(visibility: Visibility, path: string, contentType: string): UploadTicket {
    const { service, credential } = this.require();
    const container = this.container(visibility);
    const expiresOn = new Date(Date.now() + UPLOAD_MINUTES * 60_000);
    const sas = generateBlobSASQueryParameters(
      { containerName: container, blobName: path, permissions: BlobSASPermissions.parse('cw'), startsOn: new Date(Date.now() - 60_000), expiresOn, contentType },
      credential,
    );
    const url = service.getContainerClient(container).getBlockBlobClient(path).url;
    return {
      uploadUrl: `${url}?${sas.toString()}`,
      headers: { 'x-ms-blob-type': 'BlockBlob', 'content-type': contentType },
      expiresAt: expiresOn.toISOString(),
    };
  }

  /** A read-only link to a private blob, opened as a download with its original name. */
  readLink(path: string, fileName: string): { url: string; expiresAt: string } {
    const { service, credential } = this.require();
    const container = this.container('private');
    const expiresOn = new Date(Date.now() + READ_MINUTES * 60_000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName: path,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(Date.now() - 60_000),
        expiresOn,
        contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
      credential,
    );
    return { url: `${service.getContainerClient(container).getBlobClient(path).url}?${sas.toString()}`, expiresAt: expiresOn.toISOString() };
  }

  /** The uploaded blob, or null when nothing was uploaded there. */
  async stat(visibility: Visibility, path: string): Promise<StoredBlob | null> {
    const { service } = this.require();
    try {
      const props = await service.getContainerClient(this.container(visibility)).getBlobClient(path).getProperties();
      return { size: props.contentLength ?? 0, contentType: props.contentType ?? null };
    } catch (err) {
      if (err instanceof RestError && err.statusCode === 404) return null;
      this.logger.error(`Could not read ${visibility}/${path}: ${err instanceof Error ? err.message : String(err)}`);
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'storage_unavailable', 'File storage is not available right now. Please try again shortly.');
    }
  }

  async remove(visibility: Visibility, path: string): Promise<void> {
    const { service } = this.require();
    await service.getContainerClient(this.container(visibility)).getBlobClient(path).deleteIfExists();
  }

  private container(visibility: Visibility): string {
    return visibility === 'public' ? this.config.STORAGE_PUBLIC_CONTAINER : this.config.STORAGE_PRIVATE_CONTAINER;
  }

  private require(): { service: BlobServiceClient; credential: StorageSharedKeyCredential } {
    if (!this.service || !this.credential) {
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'uploads_unavailable', 'Uploading files is not available yet.');
    }
    return { service: this.service, credential: this.credential };
  }
}

/** Keeps a file name safe for a blob path: letters, digits, dot, dash and underscore. */
export function safeFileName(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^[^A-Za-z0-9]+/, '')
    .slice(-120);
  return cleaned || 'file';
}
