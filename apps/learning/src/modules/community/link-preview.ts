import type { LinkPreview } from '@dreamlab/contracts';
import { publicAddresses } from '@lib/common';

/** Links previewed per post, how long previews may take in all, and how much of a page is read. */
const MAX_LINKS = 3;
const BUDGET_MS = 4000;
const MAX_BYTES = 256 * 1024;

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"')\]]+/gi;

/** The distinct links in a post, in order, at most MAX_LINKS. */
export function linksIn(body: string): string[] {
  const seen = new Set<string>();
  for (const raw of body.match(URL_PATTERN) ?? []) {
    const trimmed = raw.replace(/[.,;:!?]+$/, '');
    try {
      const url = new URL(trimmed);
      if (url.protocol === 'http:' || url.protocol === 'https:') seen.add(url.toString());
    } catch {
      // not a URL after all
    }
    if (seen.size >= MAX_LINKS) break;
  }
  return [...seen];
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };
const decode = (s: string) =>
  s
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e: string) => {
      if (e.startsWith('#x')) return String.fromCodePoint(Number.parseInt(e.slice(2), 16));
      if (e.startsWith('#')) return String.fromCodePoint(Number(e.slice(1)));
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();

const clip = (s: string | null, n: number) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** The page's own description of itself: Open Graph tags first, then its title and description. */
export function readPreview(html: string): Omit<LinkPreview, 'url'> {
  const meta = (key: string) => {
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
      const name = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
      if (name !== key) continue;
      const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
      if (content) return decode(content);
    }
    return null;
  };
  const title = meta('og:title') ?? (/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ? decode(/<title[^>]*>([^<]*)<\/title>/i.exec(html)![1]!) : null);
  return {
    title: clip(title || null, 200),
    description: clip(meta('og:description') ?? meta('description'), 300),
    siteName: clip(meta('og:site_name'), 80),
  };
}

/**
 * Reads a link's title and description for its preview, safely: https on the standard port only,
 * public addresses only, certificates checked (so a name pointed at an internal machine cannot be
 * read), no redirects, 256 KB at most, HTML only. Anything else gives a preview with only the link.
 */
async function previewOne(raw: string, signal: AbortSignal): Promise<LinkPreview> {
  const bare: LinkPreview = { url: raw, title: null, description: null, siteName: null };
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password) return bare;
    if (!(await publicAddresses(url.hostname))) return bare;
    const res = await fetch(url, { redirect: 'manual', signal, headers: { accept: 'text/html', 'user-agent': 'DreamLabLinkPreview/1.0' } });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('text/html') || !res.body) return bare;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let read = 0;
    while (read < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      read += value.byteLength;
    }
    await reader.cancel().catch(() => undefined);
    const html = Buffer.concat(chunks).subarray(0, MAX_BYTES).toString('utf8');
    return { url: raw, ...readPreview(html) };
  } catch {
    return bare;
  }
}

/** Previews for a post's links, all within BUDGET_MS. */
export async function previewLinks(body: string): Promise<LinkPreview[]> {
  const urls = linksIn(body);
  if (urls.length === 0) return [];
  const signal = AbortSignal.timeout(BUDGET_MS);
  return Promise.all(urls.map((u) => previewOne(u, signal)));
}
