/**
 * Waitlist intake. Ported from the Next route handler at app/api/waitlist/route.ts
 * with the request contract, validation rules, response bodies and status codes
 * preserved exactly, so the existing form keeps working unchanged. Now also
 * stores each signup in Supabase before notifying, mirroring the
 * data-deletion route's insert-then-notify pattern so a lead survives even if
 * the email send fails.
 *
 * Request:  POST { email, role: 'student'|'instructor', postcode?, name?, notes? }
 * Response: 200 { ok: true } | 400 { error } | 502 { error } | 503 { error }
 */
import type { APIRoute } from 'astro';
import { escapeHtml, json, sendEmail } from '../../lib/email';
import { createAdminClient } from '../../lib/supabase';
import { testCentresByCity } from '../../data/driving-test-centres';

// Holds server-only secrets, so this route is never prerendered.
export const prerender = false;

// Same city binding the instructor application form uses for its city
// <select>, so a submitted city is checked against the identical set.
const VALID_CITIES = new Set(Object.keys(testCentresByCity));

type Payload = {
  email?: unknown;
  role?: unknown;
  city?: unknown;
  name?: unknown;
  notes?: unknown;
};

type Signup = {
  email: string;
  role: 'student' | 'instructor';
  city: string;
  name: string;
  notes: string;
  submittedAt: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function adminEmail(s: Signup) {
  const roleLabel = s.role === 'instructor' ? 'Instructor' : 'Learner';
  const subject = `New Newdryve waitlist signup: ${s.name || s.email} (${roleLabel})`;

  const rows = [
    ['Role', roleLabel],
    ['Email', s.email],
    s.name && ['Name', s.name],
    s.city && ['City', s.city],
    s.notes && [s.role === 'instructor' ? 'ADI / experience' : 'Notes', s.notes],
    ['Submitted', s.submittedAt],
  ].filter(Boolean) as [string, string][];

  const html = `
<!doctype html><html><body style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0A0A14;background:#F0EDF0;padding:24px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E8E8F2;border-radius:16px;padding:28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#E8527A;">Newdryve waitlist</p>
    <h1 style="margin:0 0 20px;font-size:22px;letter-spacing:-0.5px;">New ${roleLabel.toLowerCase()} signup</h1>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows
        .map(
          ([k, v]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E8E8F2;color:#6B6B84;font-weight:600;width:140px;vertical-align:top;">${escapeHtml(k)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #E8E8F2;color:#0A0A14;white-space:pre-wrap;">${escapeHtml(v)}</td>
        </tr>`
        )
        .join('')}
    </table>
  </div>
</body></html>`.trim();

  const text =
    `New Newdryve ${roleLabel.toLowerCase()} signup\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  return { subject, html, text };
}

function applicantEmail(s: Signup) {
  const isInstructor = s.role === 'instructor';
  const greeting = s.name ? `Hi ${s.name},` : 'Hi,';
  const subject = isInstructor
    ? 'Thanks for applying to teach with Newdryve'
    : "You're on the Newdryve waitlist";

  const body = isInstructor
    ? `Thanks for putting your name forward. We're recruiting a small founding group of ADI-qualified instructors in Norwich, and we'll be in touch as we line up the first cohort.\n\nA quick reminder of what you can expect: membership is £29 per month and Newdryve takes 0% commission from lesson payments. At the end of each lesson, you choose cash, bank transfer or card through Stripe; Stripe's standard processing fee applies to card payments.\n\nIf you'd like to add anything (ADI number, transmission, what areas you cover), just reply to this email.`
    : `Thanks for joining the Newdryve waitlist. We're building a faster way to book driving lessons in Norwich, and we'll be in touch as soon as we have an instructor lined up for you.\n\nIf you have any questions in the meantime, just reply to this email.`;

  const html = `
<!doctype html><html><body style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0A0A14;background:#F0EDF0;padding:24px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E8E8F2;border-radius:16px;padding:32px;">
    <p style="margin:0 0 24px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
      <span style="color:#2D6A4F;">newdr</span><span style="color:#E8527A;">y</span><span style="color:#2D6A4F;">ve</span>
    </p>
    <h1 style="margin:0 0 14px;font-size:22px;letter-spacing:-0.5px;">${escapeHtml(subject)}</h1>
    <p style="margin:0 0 14px;color:#0A0A14;font-size:15px;line-height:1.55;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 14px;color:#0A0A14;font-size:15px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(body)}</p>
    <p style="margin:24px 0 0;color:#6B6B84;font-size:13px;">The Newdryve team</p>
  </div>
</body></html>`.trim();

  const text = `${greeting}\n\n${body}\n\nThe Newdryve team`;

  return { subject, html, text };
}

export const POST: APIRoute = async ({ request }) => {
  const NOTIFY_TO = process.env.WAITLIST_NOTIFY_EMAIL || 'hello@newdryve.com';
  const FROM = process.env.WAITLIST_FROM_EMAIL || 'Newdryve <onboarding@resend.dev>';
  const REPLY_TO = process.env.WAITLIST_REPLY_TO || NOTIFY_TO;

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const city = typeof body.city === 'string' ? body.city.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }
  if (city && !VALID_CITIES.has(city)) {
    return json({ error: 'Please choose a valid city.' }, 400);
  }

  // Learners only. Instructors no longer join a waitlist — they apply for a
  // real account at /instructors/apply and a founder approves them. An
  // instructor signup arriving here means a stale cached page or a direct POST,
  // so send them to the right place rather than silently filing them as a lead
  // nobody will action.
  if (body.role === 'instructor') {
    return json(
      {
        error: 'Instructors apply for an account directly.',
        redirect: '/instructors/apply',
      },
      400
    );
  }

  const role = 'student' as const;

  const signup: Signup = {
    email,
    role,
    city,
    name,
    notes,
    submittedAt: new Date().toISOString(),
  };

  let signupId: string;
  try {
    const supabase = createAdminClient();
    const insert = {
      email: signup.email,
      name: signup.name,
      city: signup.city,
      notes: signup.notes,
    } as never;
    const { data, error } = await supabase
      .from('waitlist_signups')
      .insert(insert)
      .select('id')
      .single();

    if (error || !data) throw error || new Error('Supabase did not return a signup id');
    signupId = String((data as unknown as { id: string }).id);
  } catch (error) {
    console.error('[waitlist:supabase-insert-failed]', signup, error);
    return json(
      { error: "We couldn't record your details just now. Please try again in a moment." },
      503
    );
  }

  if (!process.env.RESEND_API_KEY) {
    // No provider configured (e.g. local dev). The signup is already saved in
    // Supabase, so just log and return success rather than failing the form.
    console.log('[waitlist:no-RESEND_API_KEY]', signupId, signup);
    return json({ ok: true });
  }

  const admin = adminEmail(signup);
  const applicant = applicantEmail(signup);

  const [adminResult, applicantResult] = await Promise.all([
    sendEmail({
      to: NOTIFY_TO,
      from: FROM,
      replyTo: signup.email,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
      headers: { 'X-Entity-Ref-ID': signupId },
    }),
    sendEmail({
      to: signup.email,
      from: FROM,
      replyTo: REPLY_TO,
      subject: applicant.subject,
      html: applicant.html,
      text: applicant.text,
    }),
  ]);

  try {
    const supabase = createAdminClient();
    const notificationUpdate = {
      notification_sent_at: adminResult.ok ? new Date().toISOString() : null,
      notification_error: adminResult.ok ? null : (adminResult.error || 'Unknown email error').slice(0, 500),
    } as never;
    const { error: updateError } = await supabase
      .from('waitlist_signups')
      .update(notificationUpdate)
      .eq('id', signupId);
    if (updateError) {
      console.error('[waitlist:supabase-notification-update-failed]', signupId, updateError);
    }
  } catch (error) {
    console.error('[waitlist:supabase-notification-update-failed]', signupId, error);
  }

  if (!adminResult.ok) {
    // The admin notification is the critical one, but the lead is already
    // safely stored in Supabase either way.
    console.error('[waitlist:admin-send-failed]', signupId, adminResult.error);
    return json(
      { error: "We couldn't record your details just now. Please try again in a moment." },
      502
    );
  }

  if (!applicantResult.ok) {
    // Confirmation failed but the lead landed. Log and still return success.
    console.warn('[waitlist:applicant-send-failed]', signup.email, applicantResult.error);
  }

  return json({ ok: true });
};
