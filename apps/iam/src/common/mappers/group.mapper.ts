import type { groups } from '../../modules/org-structure/entities/group.entity';

type GroupRow = typeof groups.$inferSelect;

export const toGroup = (g: GroupRow, memberCount: number) => ({
  id: g.id,
  orgId: g.orgId,
  name: g.name,
  kind: g.kind,
  memberCount,
  createdAt: g.createdAt.toISOString(),
});
