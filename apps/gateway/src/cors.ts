/** `https://*.example.com` matches exactly one subdomain label. */
export function originMatcher(patterns: string[]): (origin: string) => boolean {
  const regexes = patterns.map(
    (p) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*|\*/g, '[a-z0-9-]+')}$`, 'i'),
  );
  return (origin) => regexes.some((re) => re.test(origin));
}
