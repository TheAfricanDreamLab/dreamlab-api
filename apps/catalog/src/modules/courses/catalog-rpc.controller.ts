import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { Principal } from '@lib/auth';
import { CatalogRpc } from '@lib/rpc';
import { z } from 'zod';
import { CatalogReadService } from './catalog-read.service';

const SlugPayload = z.object({ slug: z.string().min(1).max(80) });
const VersionPayload = z.object({ versionId: z.string().uuid() });
const IdsPayload = z.object({ ids: z.array(z.string().uuid()).max(200) });
const DetailPayload = SlugPayload.extend({ viewer: z.object({ orgId: z.string().uuid().nullable(), platformAdmin: z.boolean() }) });

/** RabbitMQ RPC for the learning service: course content (answers included) and summaries. */
@Controller()
export class CatalogRpcController {
  constructor(private readonly catalog: CatalogReadService) {}

  @MessagePattern(CatalogRpc.CourseContent)
  courseContent(@Payload() payload: unknown) {
    const p = SlugPayload.safeParse(payload);
    return p.success ? this.catalog.content({ slug: p.data.slug }) : null;
  }

  @MessagePattern(CatalogRpc.VersionContent)
  versionContent(@Payload() payload: unknown) {
    const p = VersionPayload.safeParse(payload);
    return p.success ? this.catalog.content({ versionId: p.data.versionId }) : null;
  }

  @MessagePattern(CatalogRpc.CourseDetail)
  async detail(@Payload() payload: unknown) {
    const p = DetailPayload.safeParse(payload);
    if (!p.success) return null;
    // Only visibility is decided from the viewer; it carries no identity.
    const viewer = { orgId: p.data.viewer.orgId, platformAdmin: p.data.viewer.platformAdmin } as Principal;
    return this.catalog.getCourse(p.data.slug, viewer).catch(() => null);
  }

  @MessagePattern(CatalogRpc.CourseSummaries)
  summaries(@Payload() payload: unknown) {
    const p = IdsPayload.safeParse(payload);
    return p.success ? this.catalog.summariesByIds(p.data.ids) : [];
  }
}
