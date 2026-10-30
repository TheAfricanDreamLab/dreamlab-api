import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDatabase } from '@lib/database';
import { EventEnvelope, InjectRabbit, processOnce, RabbitConnection } from '@lib/messaging';
import { CatalogClient } from '@lib/rpc';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { LearningDatabase, schema } from '../../database';
import { LearningEvents } from '../../events';
import { CATALOG } from '../enrollments/enrollments.service';
import { CredentialsService } from './credentials.service';

const { courseEnrollments, courseRuns } = schema;

const CompletedSchema = z.object({ enrollmentId: z.string().uuid(), userId: z.string().uuid(), finalScore: z.number().nullable().optional() });

/**
 * Course certificates (CRED-1): when a course enrolment completes, its learner gets a certificate
 * from the organisation they learned it with (the platform for self-paced learning). Once per
 * enrolment, whatever the redeliveries.
 */
@Injectable()
export class CertificatesIntake implements OnApplicationBootstrap {
  private readonly logger = new Logger(CertificatesIntake.name);

  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectRabbit() private readonly rabbit: RabbitConnection,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    private readonly credentials: CredentialsService,
  ) {}

  onApplicationBootstrap(): void {
    this.rabbit.subscribe({ queue: 'learning.course-certificates', bindings: [LearningEvents.CourseCompleted], handler: async (e) => void (await this.handle(e)) });
  }

  async handle(event: EventEnvelope): Promise<void> {
    const parsed = CompletedSchema.safeParse(event.payload);
    if (!parsed.success) {
      this.logger.warn(`Ignoring malformed ${event.type} ${event.id}`);
      return;
    }
    const [enrollment] = await this.db.sys.select().from(courseEnrollments).where(eq(courseEnrollments.id, parsed.data.enrollmentId));
    if (!enrollment || enrollment.status !== 'completed') return;
    const content = await this.catalog.version(enrollment.courseVersionId);
    const [run] = enrollment.courseRunId ? await this.db.sys.select().from(courseRuns).where(eq(courseRuns.id, enrollment.courseRunId)) : [];
    await processOnce(this.db, 'learning.course-certificates', event.id, async (tx) => {
      await this.credentials.issue(tx, {
        kind: 'course_completion',
        userId: enrollment.userId,
        issuerOrgId: enrollment.contextOrgId,
        courseEnrollmentId: enrollment.id,
        title: content?.course.title ?? enrollment.courseSlug,
        scorePct: enrollment.finalScore,
        creditHours: run?.creditHours ?? content?.version.creditHours ?? null,
      });
    });
  }
}
