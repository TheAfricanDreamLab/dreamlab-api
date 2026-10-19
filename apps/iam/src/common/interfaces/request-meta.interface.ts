export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  /** Organisation the request's subdomain resolved to (set by the gateway). */
  tenantOrgId: string | null;
}
