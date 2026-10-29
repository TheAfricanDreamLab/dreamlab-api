import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDatabase } from '@lib/database';
import { APPLICANT_ADMITTED, EventEnvelope, InjectRabbit, processOnce, RabbitConnection } from '@lib/messaging';
import { z } from 'zod';
import { LearningDatabase } from '../../database';
import { ProgramsService } from './programs.service';

const AdmittedSchema = z.object({
  applicationId: z.string().uuid(),
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  cycleId: z.string().uuid(),
  cohortId: z.string().uuid(),
  programSlug: z.string().min(1),
  scholarshipPercent: z.number().nullable(),
});

/** Enrols people admissions admitted (ADM-1) in their cohort, once per event. */
@Injectable()
export class AdmissionsIntake implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdmissionsIntake.name);

  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectRabbit() private readonly rabbit: RabbitConnection,
    private readonly programs: ProgramsService,
  ) {}

  onApplicationBootstrap(): void {
    this.rabbit.subscribe({ queue: 'learning.admissions', bindings: [APPLICANT_ADMITTED], handler: async (e) => void (await this.handle(e)) });
  }

  async handle(event: EventEnvelope): Promise<void> {
    const parsed = AdmittedSchema.safeParse(event.payload);
    if (!parsed.success) {
      this.logger.warn(`Ignoring malformed ${event.type} ${event.id} from ${event.source}`);
      return;
    }
    await processOnce(this.db, 'learning.admissions', event.id, async (tx) => {
      const result = await this.programs.admit(tx, parsed.data);
      if (result === 'mismatch') {
        this.logger.warn(`Application ${parsed.data.applicationId}: cohort ${parsed.data.cohortId} is not ${parsed.data.programSlug} hosted by the admitting organisation; not enrolled`);
      }
    });
  }
}
