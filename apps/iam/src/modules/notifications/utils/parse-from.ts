/** "Dream Lab <no-reply@x.com>" → { name, address } */
export function parseFrom(from: string): { name: string | null; address: string } {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);
  return match ? { name: match[1] || null, address: match[2]! } : { name: null, address: from.trim() };
}
