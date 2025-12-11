import test from 'node:test';
import assert from 'node:assert/strict';

process.env['UPSHIFT_API_URL'] = process.env['UPSHIFT_API_URL'] || 'https://example.com';
process.env['UPSHIFT_API_KEY'] = process.env['UPSHIFT_API_KEY'] || 'test-key';
process.env['UPSHIFT_ENABLED'] = 'true';

const servicePromise = import('../src/services/upshift.js');

test('buildEnvelope creates a timestamped payload', async () => {
  const { upshiftService } = await servicePromise;
  const envelope = upshiftService.buildEnvelope('user_sync', { id: 'dev-user' });

  assert.equal(envelope.event, 'user_sync');
  assert.equal(envelope.payload.id, 'dev-user');
  assert.ok(envelope.sentAt);
});

test('send posts envelope via fetch with auth header', async () => {
  const { upshiftService } = await servicePromise;

  const calls: Array<{ url: string | URL; init?: RequestInit }> = [];
  const originalFetch = global.fetch;

  global.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response('{}', { status: 200 });
  }) as typeof fetch;

  const result = await upshiftService.send(
    upshiftService.buildEnvelope('user_sync', { id: 'dev-user', source: 'test' })
  );

  assert.ok(result.ok);
  assert.ok(calls.length === 1);
  assert.equal(calls[0].url.toString(), 'https://example.com/events');
  assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, 'Bearer test-key');

  global.fetch = originalFetch;
});
