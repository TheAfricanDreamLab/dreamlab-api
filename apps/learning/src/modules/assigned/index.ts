import type { Provider, Type } from '@nestjs/common';
import { AssignedController } from './assigned.controller';
import { AssignedService } from './assigned.service';

/** Assigned learning (ASSIGN-1): wired into LearningModule. */
export const ASSIGNED_CONTROLLERS: Type[] = [AssignedController];
export const ASSIGNED_PROVIDERS: Provider[] = [AssignedService];
