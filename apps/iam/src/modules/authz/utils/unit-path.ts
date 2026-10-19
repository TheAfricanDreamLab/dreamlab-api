import { idToLabel } from '@lib/database';

export function isAncestorOrSelf(ancestor: string, path: string): boolean {
  return path === ancestor || path.startsWith(`${ancestor}.`);
}

export const unitLabel = idToLabel;
