import type { StartedTestContainer } from 'testcontainers';

export default async function globalTeardown(): Promise<void> {
  const containers = ((globalThis as Record<string, unknown>).__E2E_CONTAINERS__ ?? []) as StartedTestContainer[];
  await Promise.allSettled(containers.map((c) => c.stop()));
}
