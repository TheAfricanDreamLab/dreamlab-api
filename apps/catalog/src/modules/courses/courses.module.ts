import { Module } from '@nestjs/common';
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
  controllers: [CoursesController, ProgramsController, CatalogAdminController, CatalogRpcController],
  providers: [CatalogReadService, ProgramsService, CatalogAdminService],
  exports: [CatalogReadService],
})
export class CoursesModule {}
