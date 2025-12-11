import { UpshiftEnvelope, UpshiftEvent } from '../types/upshift.js';

// Env configuration:
// - UPSHIFT_API_URL: base URL for Upshift events API
// - UPSHIFT_API_KEY: bearer token used for outbound calls
// - UPSHIFT_ENABLED: optional toggle (set to "false" to disable)
// - UPSHIFT_TIMEOUT_MS / UPSHIFT_MAX_RETRIES / UPSHIFT_RETRY_DELAY_MS: resiliency tuning
const API_URL = process.env.UPSHIFT_API_URL;
const API_KEY = process.env.UPSHIFT_API_KEY;
const ENABLED = process.env.UPSHIFT_ENABLED !== 'false';
const TIMEOUT_MS = Number(process.env.UPSHIFT_TIMEOUT_MS || 4000);
const MAX_RETRIES = Number(process.env.UPSHIFT_MAX_RETRIES || 1);
const RETRY_DELAY_MS = Number(process.env.UPSHIFT_RETRY_DELAY_MS || 150);

type SendResult = { ok: boolean; skipped?: boolean; status?: number; error?: unknown };

const isConfigured = () => Boolean(API_URL && API_KEY && ENABLED);

const buildEnvelope = <TPayload>(event: UpshiftEvent, payload: TPayload): UpshiftEnvelope<TPayload> => ({
  event,
  payload,
  sentAt: new Date().toISOString(),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const postEnvelope = async <TPayload>(envelope: UpshiftEnvelope<TPayload>): Promise<SendResult> => {
  if (!isConfigured()) {
    console.info('[Upshift] Skipping send (not configured)');
    return { ok: false, skipped: true };
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(envelope),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn('[Upshift] Send failed', response.status, `attempt ${attempt + 1}`);
      }

      // Do not retry on client errors
      if (response.ok || response.status < 500 || attempt === MAX_RETRIES) {
        return { ok: response.ok, status: response.status };
      }
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      console.warn('[Upshift] Send error', `attempt ${attempt + 1}`, error);
    }

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  return { ok: false, error: lastError };
};

export const upshiftService = {
  isConfigured,
  send: postEnvelope,
  buildEnvelope,
};
