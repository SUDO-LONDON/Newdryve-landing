import { Resend } from 'resend';

let cached: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

export const DEFAULT_FROM =
  process.env.WAITLIST_FROM_EMAIL || 'Newdryve <hello@newdryve.com>';

export const ADMIN_NOTIFY_EMAIL =
  process.env.WAITLIST_NOTIFY_EMAIL || 'hello@newdryve.com';

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const client = getClient();
  if (!client) {
    console.warn('[email] RESEND_API_KEY missing — skipping send to', args.to);
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }
  try {
    const { data, error } = await client.emails.send({
      from: args.from || DEFAULT_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
    });
    if (error) {
      console.error('[email] resend error', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('[email] send threw', err);
    return { ok: false, error: err instanceof Error ? err.message : 'send failed' };
  }
}
