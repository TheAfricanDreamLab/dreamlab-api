import { toVtt, type CaptionCue, type VideoManifest } from '@dreamlab/contracts';
import type { BlobStorage } from '@lib/storage';

/*
 * Where a library video's files are (CAT-6). The original is private; everything learners need is
 * public under videos/<id>/, read through the site's /media path.
 */

export const sourcePath = (id: string): string => `videos/${id}/source`;
export const folderOf = (id: string): string => `videos/${id}/`;
export const versionFolder = (id: string, version: number): string => `videos/${id}/v${version}/`;
export const manifestPath = (id: string): string => `videos/${id}/manifest.json`;
export const captionPath = (id: string, lang: string): string => `videos/${id}/captions/${lang}.vtt`;
export const mediaUrl = (path: string): string => `/media/${path}`;

/** Streams and pictures never change once written (each processing writes a new version folder). */
export const IMMUTABLE = 'public, max-age=31536000, immutable';
/** The manifest and captions change in place: a short cache. */
export const SHORT = 'public, max-age=30';

export interface ManifestInput {
  id: string;
  version: number;
  durationS: number;
  width: number;
  height: number;
  captions: { lang: string; label: string; source: string; updatedAt: Date }[];
}

export function manifestOf(v: ManifestInput): VideoManifest {
  return {
    id: v.id,
    durationS: v.durationS,
    width: v.width,
    height: v.height,
    hls: `v${v.version}/master.m3u8`,
    poster: `v${v.version}/poster.jpg`,
    thumbnail: `v${v.version}/thumb.jpg`,
    captions: v.captions.map((c) => ({ lang: c.lang, label: c.label, src: `captions/${c.lang}.vtt?v=${c.updatedAt.getTime()}`, auto: c.source === 'auto' })),
  };
}

export async function writeManifest(storage: BlobStorage, v: ManifestInput): Promise<void> {
  await storage.put('public', manifestPath(v.id), { data: JSON.stringify(manifestOf(v)) }, 'application/json', SHORT);
}

export async function writeCaptions(storage: BlobStorage, id: string, lang: string, cues: CaptionCue[]): Promise<void> {
  await storage.put('public', captionPath(id, lang), { data: toVtt(cues) }, 'text/vtt; charset=utf-8', SHORT);
}

/** "blk-000012" (base64) → 12, or null for a block id we didn't hand out. */
export function blockIndex(name: string): number | null {
  const raw = Buffer.from(name, 'base64').toString('utf8');
  const m = /^blk-(\d{6})$/.exec(raw);
  return m ? Number(m[1]) : null;
}
