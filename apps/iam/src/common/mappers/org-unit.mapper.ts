import { labelToId } from '@lib/database';
import type { orgUnits } from '../../modules/org-structure/entities/org-unit.entity';

type UnitRow = typeof orgUnits.$inferSelect;

export const toUnit = (u: UnitRow) => ({
  id: u.id,
  orgId: u.orgId,
  parentUnitId: u.parentUnitId,
  name: u.name,
  path: u.path.split('.').map(labelToId),
  createdAt: u.createdAt.toISOString(),
});
