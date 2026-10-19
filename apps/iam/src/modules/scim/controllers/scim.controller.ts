import { Body, Controller, Delete, Get, Header, HttpCode, Param, Patch, Post, Put, Query, Req, UseFilters, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '@lib/auth';
import { ScimExceptionFilter } from '../filters/scim-exception.filter';
import { ScimRequest, ScimTokenGuard } from '../guards/scim-token.guard';
import { ScimGroupsService } from '../services/scim-groups.service';
import { ScimUsersService } from '../services/scim-users.service';
import { SCIM, SCIM_CONTENT_TYPE } from '../utils/scim';

type ListQuery = { filter?: string; startIndex?: string; count?: string; excludedAttributes?: string };
const org = (req: ScimRequest) => req.scim!.orgId;

/**
 * SCIM 2.0 service provider (IAM-17) for identity providers such as Microsoft Entra, Okta and
 * Google. Authenticated by the organisation's SCIM bearer token, not by user tokens.
 */
@ApiExcludeController()
@Public()
@UseGuards(ScimTokenGuard)
@UseFilters(ScimExceptionFilter)
@Controller('scim/v2')
export class ScimController {
  constructor(
    private readonly users: ScimUsersService,
    private readonly groups: ScimGroupsService,
  ) {}

  @Get('ServiceProviderConfig')
  @Header('content-type', SCIM_CONTENT_TYPE)
  config() {
    return {
      schemas: [SCIM.spConfig],
      documentationUri: 'https://theafricandreamlab.com/docs/scim',
      patch: { supported: true },
      bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
      filter: { supported: true, maxResults: 200 },
      changePassword: { supported: false },
      sort: { supported: false },
      etag: { supported: false },
      authenticationSchemes: [{ type: 'oauthbearertoken', name: 'Bearer token', description: 'The SCIM token from your organisation’s settings', primary: true }],
    };
  }

  @Get('ResourceTypes')
  @Header('content-type', SCIM_CONTENT_TYPE)
  resourceTypes() {
    const types = [
      { schemas: [SCIM.resourceType], id: 'User', name: 'User', endpoint: '/Users', schema: SCIM.user },
      { schemas: [SCIM.resourceType], id: 'Group', name: 'Group', endpoint: '/Groups', schema: SCIM.group },
    ];
    return { schemas: [SCIM.list], totalResults: types.length, startIndex: 1, itemsPerPage: types.length, Resources: types };
  }

  @Get('Schemas')
  @Header('content-type', SCIM_CONTENT_TYPE)
  schemasList() {
    const s = [
      { schemas: [SCIM.schema], id: SCIM.user, name: 'User', attributes: ['userName', 'name', 'displayName', 'emails', 'active', 'externalId', 'title'].map((name) => ({ name })) },
      { schemas: [SCIM.schema], id: SCIM.group, name: 'Group', attributes: ['displayName', 'members', 'externalId'].map((name) => ({ name })) },
    ];
    return { schemas: [SCIM.list], totalResults: s.length, startIndex: 1, itemsPerPage: s.length, Resources: s };
  }

  // ---------- Users ----------

  @Get('Users')
  @Header('content-type', SCIM_CONTENT_TYPE)
  listUsers(@Req() req: ScimRequest, @Query() q: ListQuery) {
    return this.users.list(org(req), q);
  }

  @Post('Users')
  @HttpCode(201)
  @Header('content-type', SCIM_CONTENT_TYPE)
  createUser(@Req() req: ScimRequest, @Body() body: unknown) {
    return this.users.create(org(req), body);
  }

  @Get('Users/:id')
  @Header('content-type', SCIM_CONTENT_TYPE)
  getUser(@Req() req: ScimRequest, @Param('id') id: string) {
    return this.users.get(org(req), id);
  }

  @Put('Users/:id')
  @Header('content-type', SCIM_CONTENT_TYPE)
  replaceUser(@Req() req: ScimRequest, @Param('id') id: string, @Body() body: unknown) {
    return this.users.replace(org(req), id, body);
  }

  @Patch('Users/:id')
  @Header('content-type', SCIM_CONTENT_TYPE)
  patchUser(@Req() req: ScimRequest, @Param('id') id: string, @Body() body: unknown) {
    return this.users.patch(org(req), id, body);
  }

  @Delete('Users/:id')
  @HttpCode(204)
  async deleteUser(@Req() req: ScimRequest, @Param('id') id: string) {
    await this.users.remove(org(req), id);
  }

  // ---------- Groups ----------

  @Get('Groups')
  @Header('content-type', SCIM_CONTENT_TYPE)
  listGroups(@Req() req: ScimRequest, @Query() q: ListQuery) {
    return this.groups.list(org(req), q);
  }

  @Post('Groups')
  @HttpCode(201)
  @Header('content-type', SCIM_CONTENT_TYPE)
  createGroup(@Req() req: ScimRequest, @Body() body: unknown) {
    return this.groups.create(org(req), body);
  }

  @Get('Groups/:id')
  @Header('content-type', SCIM_CONTENT_TYPE)
  getGroup(@Req() req: ScimRequest, @Param('id') id: string) {
    return this.groups.get(org(req), id);
  }

  @Put('Groups/:id')
  @Header('content-type', SCIM_CONTENT_TYPE)
  replaceGroup(@Req() req: ScimRequest, @Param('id') id: string, @Body() body: unknown) {
    return this.groups.replace(org(req), id, body);
  }

  @Patch('Groups/:id')
  @Header('content-type', SCIM_CONTENT_TYPE)
  patchGroup(@Req() req: ScimRequest, @Param('id') id: string, @Body() body: unknown) {
    return this.groups.patch(org(req), id, body);
  }

  @Delete('Groups/:id')
  @HttpCode(204)
  async deleteGroup(@Req() req: ScimRequest, @Param('id') id: string) {
    await this.groups.remove(org(req), id);
  }
}
