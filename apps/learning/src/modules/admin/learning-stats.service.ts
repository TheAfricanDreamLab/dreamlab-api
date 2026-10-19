import { Inject, Injectable } from '@nestjs/common';
import type { LearningStats } from '@dreamlab/contracts';
import { InjectDatabase } from '@lib/database';
import { CatalogClient } from '@lib/rpc';
import { sql } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { CATALOG } from '../enrollments/enrollments.service';

const { courseEnrollments, submissions } = schema;

/** Platform-wide figures (PLT-1). Counts only; no learner's records leave the service. */
@Injectable()
export class LearningStatsService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
  ) {}

  async stats(): Promise<LearningStats> {
    const [totals] = await this.db.sys
      .select({
        enrollments: sql<number>`count(*)::int`,
        completions: sql<number>`count(*) filter (where ${courseEnrollments.status} = 'completed')::int`,
        active: sql<number>`count(distinct ${courseEnrollments.userId}) filter (where ${courseEnrollments.lastActiveAt} > now() - interval '7 days')::int`,
      })
      .from(courseEnrollments);
    const [subs] = await this.db.sys
      .select({ n: sql<number>`count(*)::int` })
      .from(submissions)
      .where(sql`${submissions.submittedAt} > now() - interval '7 days' and ${submissions.kind} in ('quiz', 'assignment', 'discussion', 'reflection')`);
    const perCourse = await this.db.sys
      .select({
        courseId: courseEnrollments.courseId,
        slug: courseEnrollments.courseSlug,
        enrolled: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${courseEnrollments.status} = 'completed')::int`,
        avg: sql<number>`coalesce(round(avg(${courseEnrollments.progressPct})), 0)::int`,
      })
      .from(courseEnrollments)
      .groupBy(courseEnrollments.courseId, courseEnrollments.courseSlug)
      .orderBy(sql`count(*) desc`)
      .limit(50);
    const titles = await this.catalog.courseSummaries(perCourse.map((c) => c.courseId)).catch(() => new Map());
    return {
      enrollments: totals?.enrollments ?? 0,
      activeLearners7d: totals?.active ?? 0,
      completions: totals?.completions ?? 0,
      submissions7d: subs?.n ?? 0,
      courses: perCourse.map((c) => ({ slug: c.slug, title: titles.get(c.courseId)?.title ?? c.slug, enrolled: c.enrolled, completed: c.completed, avgProgressPct: c.avg })),
    };
  }
}
