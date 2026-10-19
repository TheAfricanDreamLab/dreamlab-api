import { HttpException, HttpStatus } from '@nestjs/common';

/** SCIM 2.0 (RFC 7643 / 7644) constants and helpers, the subset identity providers use. */
export const SCIM = {
  user: 'urn:ietf:params:scim:schemas:core:2.0:User',
  group: 'urn:ietf:params:scim:schemas:core:2.0:Group',
  list: 'urn:ietf:params:scim:api:messages:2.0:ListResponse',
  patch: 'urn:ietf:params:scim:api:messages:2.0:PatchOp',
  error: 'urn:ietf:params:scim:api:messages:2.0:Error',
  spConfig: 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig',
  resourceType: 'urn:ietf:params:scim:schemas:core:2.0:ResourceType',
  schema: 'urn:ietf:params:scim:schemas:core:2.0:Schema',
} as const;

export const SCIM_CONTENT_TYPE = 'application/scim+json; charset=utf-8';

export type ScimErrorType = 'invalidFilter' | 'invalidValue' | 'invalidSyntax' | 'invalidPath' | 'uniqueness' | 'mutability' | 'noTarget';

export class ScimError extends HttpException {
  constructor(status: number, detail: string, scimType?: ScimErrorType) {
    super({ schemas: [SCIM.error], status: String(status), ...(scimType ? { scimType } : {}), detail }, status);
  }
}

export const scimBadRequest = (detail: string, scimType: ScimErrorType = 'invalidValue') => new ScimError(HttpStatus.BAD_REQUEST, detail, scimType);
export const scimNotFound = (detail = 'Resource not found') => new ScimError(HttpStatus.NOT_FOUND, detail);
export const scimConflict = (detail: string) => new ScimError(HttpStatus.CONFLICT, detail, 'uniqueness');

/** `attribute eq "value"`: the only filter identity providers send for provisioning. */
export function parseEqFilter(filter: string | undefined, allowed: readonly string[]): { attribute: string; value: string } | null {
  if (!filter) return null;
  const m = /^\s*([A-Za-z][\w.]*)\s+eq\s+"((?:[^"\\]|\\.)*)"\s*$/i.exec(filter);
  if (!m) throw scimBadRequest('Only filters of the form attribute eq "value" are supported', 'invalidFilter');
  const attribute = m[1]!;
  const match = allowed.find((a) => a.toLowerCase() === attribute.toLowerCase());
  if (!match) throw scimBadRequest(`Filtering on ${attribute} is not supported`, 'invalidFilter');
  return { attribute: match, value: m[2]!.replace(/\\(.)/g, '$1') };
}

export function paging(query: { startIndex?: string; count?: string }): { offset: number; limit: number; startIndex: number } {
  const startIndex = Math.max(1, Number.parseInt(query.startIndex ?? '1', 10) || 1);
  const limit = Math.min(200, Math.max(0, Number.parseInt(query.count ?? '100', 10) || 100));
  return { offset: startIndex - 1, limit, startIndex };
}

export function listResponse<T>(resources: T[], total: number, startIndex: number) {
  return { schemas: [SCIM.list], totalResults: total, startIndex, itemsPerPage: resources.length, Resources: resources };
}

/** SCIM booleans arrive as true, "True" or "false" depending on the identity provider. */
export function scimBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  throw scimBadRequest('Expected a boolean');
}

export interface PatchOperation {
  op: string;
  path?: string;
  value?: unknown;
}

export function patchOperations(body: unknown): PatchOperation[] {
  const ops = (body as { Operations?: unknown })?.Operations;
  if (!Array.isArray(ops) || ops.length === 0) throw scimBadRequest('PATCH needs Operations', 'invalidSyntax');
  return ops.map((o) => {
    const op = String((o as PatchOperation).op ?? '').toLowerCase();
    if (!['add', 'replace', 'remove'].includes(op)) throw scimBadRequest(`Unknown op ${op}`, 'invalidSyntax');
    return { op, path: (o as PatchOperation).path, value: (o as PatchOperation).value };
  });
}
