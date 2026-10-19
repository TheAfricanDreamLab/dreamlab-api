/** Cursor pagination over UUIDv7 ids (time-ordered). */
export function pageResult<T extends { id: string }>(rows: T[], limit: number) {
  const items = rows.slice(0, limit);
  return { items, nextCursor: rows.length > limit ? items[items.length - 1]!.id : null };
}
