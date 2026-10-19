import { safeEqual } from './ids';

/**
 * Tenant headers are only believed when the request carries the gateway's shared secret; anything
 * else (a client reaching IAM directly) has them stripped before any handler runs.
 */
export function installGatewayTrust(fastify: { addHook: (name: 'onRequest', fn: (req: { headers: Record<string, unknown> }) => Promise<void>) => unknown }, secret: string): void {
  fastify.addHook('onRequest', async (req) => {
    const presented = req.headers['x-gateway-token'];
    const trusted = typeof presented === 'string' && safeEqual(presented, secret);
    delete req.headers['x-gateway-token'];
    if (!trusted) {
      delete req.headers['x-tenant-org-id'];
      delete req.headers['x-tenant-slug'];
    }
  });
}
