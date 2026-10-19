import type { GatewayConfig } from './config';
import { mergeDocuments } from './modules/docs/docs.service';
import { originMatcher } from './cors';
import { TenantService } from './modules/tenancy/tenancy.service';

jest.mock('@nestjs/microservices', () => ({
  ...jest.requireActual('@nestjs/microservices'),
  ClientProxyFactory: { create: () => ({ send: jest.fn(), close: jest.fn() }) },
}));

const config = (overrides: Partial<GatewayConfig> = {}) =>
  ({
    SERVICE_NAME: 'gateway',
    RABBITMQ_URL: 'amqp://x',
    GATEWAY_BASE_DOMAINS: ['localhost', 'theafricandreamlab.com'],
    GATEWAY_ALLOW_TENANT_HEADER: false,
    ...overrides,
  }) as GatewayConfig;

const tenants = (overrides: Partial<GatewayConfig> = {}) => new TenantService(config(overrides), { subscribe: jest.fn() } as never);

describe('TenantService.slugFor', () => {
  it.each([
    ['dreamlab.theafricandreamlab.com', undefined, 'dreamlab'],
    ['acme.localhost:3000', undefined, 'acme'],
    ['theafricandreamlab.com', undefined, null],
    ['api.theafricandreamlab.com', undefined, null],
    ['www.theafricandreamlab.com', undefined, null],
    ['a.b.theafricandreamlab.com', undefined, null],
    ['evil.com', undefined, null],
    ['api.theafricandreamlab.com', 'https://dreamlab.theafricandreamlab.com', 'dreamlab'],
    ['api.theafricandreamlab.com', 'https://theafricandreamlab.com', null],
    ['api.theafricandreamlab.com', 'not a url', null],
  ])('host %s, origin %s → %s', (host, origin, expected) => {
    expect(tenants().slugFor(host, origin, undefined)).toBe(expected);
  });

  it('ignores X-Tenant unless explicitly enabled', () => {
    expect(tenants().slugFor('localhost', undefined, 'acme')).toBeNull();
    expect(tenants({ GATEWAY_ALLOW_TENANT_HEADER: true }).slugFor('localhost', undefined, 'acme')).toBe('acme');
  });
});

describe('originMatcher', () => {
  const allowed = originMatcher(['https://theafricandreamlab.com', 'https://*.theafricandreamlab.com']);
  it.each([
    ['https://theafricandreamlab.com', true],
    ['https://dreamlab.theafricandreamlab.com', true],
    ['http://dreamlab.theafricandreamlab.com', false],
    ['https://a.b.theafricandreamlab.com', false],
    ['https://theafricandreamlab.com.evil.com', false],
    ['https://eviltheafricandreamlab.com', false],
  ])('%s → %s', (origin, expected) => expect(allowed(origin)).toBe(expected));
});

describe('mergeDocuments', () => {
  it('merges paths, schemas and tags without duplicates', () => {
    const merged = mergeDocuments(
      { openapi: '3.0.0', info: { title: 'a', version: '1' }, paths: { '/health': {} }, tags: [{ name: 'health' }], components: { schemas: { A: {} } } },
      { openapi: '3.0.0', info: { title: 'b', version: '1' }, paths: { '/v1/me': {} }, tags: [{ name: 'health' }, { name: 'me' }], components: { schemas: { B: {} } } },
    );
    expect(Object.keys(merged.paths)).toEqual(['/health', '/v1/me']);
    expect(merged.tags?.map((t) => t.name)).toEqual(['health', 'me']);
    expect(Object.keys(merged.components?.schemas ?? {})).toEqual(['A', 'B']);
  });
});
