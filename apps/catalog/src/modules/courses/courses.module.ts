import { Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import { BlobStorage } from '@lib/storage';
import type { CatalogConfig } from '../../config';
import { AuthoringController } from '../authoring/authoring.controller';
import { AuthoringService, STORAGE } from '../authoring/authoring.service';
import { SeedModule } from '../seed/seed.module';
import { CatalogAdminController } from '../admin/catalog-admin.controller';
import { CatalogAdminService } from '../admin/catalog-admin.service';
import { ProgramsController } from '../programs/programs.controller';
import { ProgramsService } from '../programs/programs.service';
import { CatalogReadService } from './catalog-read.service';
import { CatalogRpcController } from './catalog-rpc.controller';
import { CoursesController } from './courses.controller';

@Module({
  imports: [SeedModule],
  controllers: [CoursesController, ProgramsController, CatalogAdminController, CatalogRpcController, AuthoringController],
  providers: [
    CatalogReadService,
    ProgramsService,
    CatalogAdminService,
    AuthoringService,
    { provide: STORAGE, inject: [CONFIG], useFactory: (c: CatalogConfig) => new BlobStorage(c) },
  ],
  exports: [CatalogReadService, STORAGE],
})
export class CoursesModule {}
