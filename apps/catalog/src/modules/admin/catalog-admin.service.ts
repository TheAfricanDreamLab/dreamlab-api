import { Injectable } from '@nestjs/common';
import type { Principal } from '@lib/auth';
import { newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { CatalogDatabase, schema } from '../../database';
import { CatalogEvents } from '../../events';

const { courses, courseVersions, catalogListings } = schema;

/** Platform administration of the catalog (PLT-1): what is listed and what is featured. */
@Injectable()
export class CatalogAdminService {
  constructor(
    @InjectDatabase() private readonly db: CatalogDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
  ) {}

  async list() {
    const rows = await this.db.sys.select().from(courses).orderBy(asc(courses.title));
    return { items: await this.toAdmin(rows.map((r) => r.id)) };
  }

  async update(principal: Principal, courseId: string, patch: { listed?: boolean; featured?: boolean }) {
    await this.db.system(async (tx) => {
      const [course] = await tx.select().from(courses).where(eq(courses.id, courseId));
      if (!course) throw notFound('course_not_found', 'Course not found');
      const where = and(eq(catalogListings.itemType, 'course'), eq(catalogListings.itemId, courseId), eq(catalogListings.channel, 'public'));
      const [listing] = await tx.select().from(catalogListings).where(where);
      const listed = patch.listed ?? !!listing;
      if (!listed) {
        if (listing) await tx.delete(catalogListings).where(where);
      } else if (listing) {
        if (patch.featured !== undefined) await tx.update(catalogListings).set({ featured: patch.featured }).where(where);
      } else {
        await tx.insert(catalogListings).values({ id: newId(), ownerOrgId: course.ownerOrgId, itemType: 'course', itemId: courseId, channel: 'public', featured: patch.featured ?? false });
      }
      await this.outbox.add(tx, {
        type: CatalogEvents.CourseListingChanged,
        orgId: course.ownerOrgId,
        actor: userActor(principal.userId),
        payload: { courseId, listed, featured: patch.featured ?? listing?.featured ?? false },
      });
    });
    const [item] = await this.toAdmin([courseId]);
    return item!;
  }

  private async toAdmin(ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await this.db.sys.select().from(courses).where(inArray(courses.id, ids)).orderBy(asc(courses.title));
    const versionIds = rows.map((r) => r.currentVersionId).filter((v): v is string => !!v);
    const versions = versionIds.length ? await this.db.sys.select().from(courseVersions).where(inArray(courseVersions.id, versionIds)) : [];
    const listings = await this.db.sys
      .select()
      .from(catalogListings)
      .where(and(eq(catalogListings.itemType, 'course'), eq(catalogListings.channel, 'public'), inArray(catalogListings.itemId, ids)));
    return rows.map((r) => {
      const v = versions.find((x) => x.id === r.currentVersionId);
      const l = listings.find((x) => x.itemId === r.id);
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        provider: r.provider,
        ownerOrgId: r.ownerOrgId,
        visibility: r.visibility,
        availability: v ? ('available' as const) : ('coming_soon' as const),
        listed: !!l,
        featured: l?.featured ?? false,
        versionNo: v?.versionNo ?? null,
        publishedAt: v?.publishedAt?.toISOString() ?? null,
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  }
}
