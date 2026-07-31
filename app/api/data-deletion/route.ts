import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type Payload = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
};

type DeletionRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  submittedAt: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_RE = /^[+\d\s().-]+$/;
const NOTIFY_TO = 'admin@newdryve.com';

function clean(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAdminEmail(request: DeletionRequest) {
  const fullName = `${request.firstName} ${request.lastName}`;
  const rows: [string, string][] = [
    ['First name', request.firstName],
    ['Last name', request.lastName],
    ['Email address', request.email],
    ['Phone number', request.phone],
    ['Submitted', request.submittedAt],
  ];

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#F0EDF0;color:#0A0A14;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;border:1px solid #E8E8F2;border-radius:16px;background:#FFFFFF;padding:28px;">
    <p style="margin:0 0 6px;color:#E8527A;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Newdryve privacy request</p>
    <h1 style="margin:0 0 8px;font-size:22px;letter-spacing:-0.5px;">New data deletion request</h1>
    <p style="margin:0 0 20px;color:#6B6B84;font-size:14px;line-height:1.5;">${escapeHtml(fullName)} has asked for their Newdryve account and eligible personal data to be deleted.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="width:140px;padding:10px 0;border-bottom:1px solid #E8E8F2;color:#6B6B84;font-weight:600;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #E8E8F2;color:#0A0A14;">${escapeHtml(value)}</td>
        </tr>`).join('')}
    </table>
    <p style="margin:20px 0 0;color:#6B6B84;font-size:12px;line-height:1.5;">Verify the requester&rsquo;s identity before deleting any data and record the outcome in accordance with the Newdryve privacy process.</p>
  </div>
</body>
</html>`;

  const text = [
    'New Newdryve data deletion request',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    "Verify the requester's identity before deleting any data.",
  ].join('\n');

  return {
    subject: `Data deletion request: ${fullName}`,
    html,
    text,
  };
}

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const deletionRequest: DeletionRequest = {
    firstName: clean(body.firstName, 80),
    lastName: clean(body.lastName, 80),
    email: clean(body.email, 254).toLowerCase(),
    phone: clean(body.phone, 32),
    submittedAt: new Date().toISOString(),
  };

  if (!deletionRequest.firstName || !deletionRequest.lastName) {
    return NextResponse.json({ error: 'Please enter your first and last name.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(deletionRequest.email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const phoneDigits = deletionRequest.phone.replace(/\D/g, '');
  if (!PHONE_ALLOWED_RE.test(deletionRequest.phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  }

  let requestId: string;
  try {
    const supabase = createSupabaseAdminClient();
    // The service-role client is intentionally schema-untyped in this project,
    // so Supabase resolves mutation payloads to `never`. This object is fully
    // validated above before being cast at the client boundary.
    const insert = {
      first_name: deletionRequest.firstName,
      last_name: deletionRequest.lastName,
      email: deletionRequest.email,
      phone: deletionRequest.phone,
    } as never;
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .insert(insert)
      .select('id')
      .single();

    if (error || !data) throw error || new Error('Supabase did not return a request id');
    requestId = String((data as unknown as { id: string }).id);
  } catch (error) {
    console.error('[data-deletion:supabase-insert-failed]', error);
    return NextResponse.json(
      { error: 'We could not submit your request just now. Please try again in a moment.' },
      { status: 503 },
    );
  }

  const message = renderAdminEmail(deletionRequest);
  const sendResult = await sendEmail({
    to: NOTIFY_TO,
    replyTo: deletionRequest.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
    headers: { 'X-Entity-Ref-ID': requestId },
  });

  try {
    const supabase = createSupabaseAdminClient();
    const notificationUpdate = {
      notification_sent_at: sendResult.ok ? new Date().toISOString() : null,
      notification_error: sendResult.ok ? null : (sendResult.error || 'Unknown email error').slice(0, 500),
    } as never;
    const { error: updateError } = await supabase
      .from('data_deletion_requests')
      .update(notificationUpdate)
      .eq('id', requestId);
    if (updateError) {
      console.error('[data-deletion:supabase-notification-update-failed]', requestId, updateError);
    }
  } catch (error) {
    console.error('[data-deletion:supabase-notification-update-failed]', requestId, error);
  }

  if (!sendResult.ok) {
    console.error('[data-deletion:email-send-failed]', requestId, sendResult.error);
    return NextResponse.json(
      { error: 'We saved your request but could not notify the team. Please try again in a moment.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
