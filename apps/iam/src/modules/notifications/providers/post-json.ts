const TIMEOUT_MS = 10_000;

export class DeliveryError extends Error {}

/** POST a JSON body to an email provider's API; any non-2xx answer is a DeliveryError. */
export async function postJson(url: string, headers: Record<string, string>, body: unknown, provider: string): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    // The response body can echo request data; log the status only.
    throw new DeliveryError(`${provider} rejected the email (HTTP ${res.status})`);
  }
}
