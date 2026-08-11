/**
 * Waitlist intake. Ported from the Next route handler at app/api/waitlist/route.ts
 * with the request contract, validation rules, response bodies and status codes
 * preserved exactly, so the existing form keeps working unchanged.
 *
 * Request:  POST { email, role: 'student'|'instructor', postcode?, name?, notes? }
 * Response: 200 { ok: true } | 400 { error } | 502 { error }
 */
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { escapeHtml, json } from '../../lib/email';

// Holds server-only secrets, so this route is never prerendered.
export const prerender = false;

type Payload = {
  email?: unknown;
  role?: unknown;
  postcode?: unknown;
  name?: unknown;
  notes?: unknown;
};

type Signup = {
  email: string;
  role: 'student' | 'instructor';
  postcode: string;
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
    s.postcode && [s.role === 'instructor' ? 'Where they teach' : 'Postcode / area', s.postcode],
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
    ? `Thanks for putting your name forward. We're recruiting a small founding group of ADI-qualified instructors in Norwich, and we'll be in touch as we line up the first cohort.\n\nA quick reminder of what you can expect: 0% commission on every booking, free until your first booking, and a flat monthly fee after that. You keep 100% of every lesson.\n\nIf you'd like to add anything (ADI number, transmission, what areas you cover), just reply to this email.`
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
  const role: 'student' | 'instructor' | null =
    body.role === 'student' || body.role === 'instructor' ? body.role : null;
  const postcode = typeof body.postcode === 'string' ? body.postcode.trim().slice(0, 16) : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }
  if (!role) {
    return json({ error: 'Please choose student or instructor.' }, 400);
  }

  const signup: Signup = {
    email,
    role,
    postcode,
    name,
    notes,
    submittedAt: new Date().toISOString(),
  };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No provider configured (e.g. local dev). Log the signup so it is not lost
    // and return success so the form UX stays consistent.
    console.log('[waitlist:no-RESEND_API_KEY]', signup);
    return json({ ok: true });
  }

  const resend = new Resend(apiKey);
  const admin = adminEmail(signup);
  const applicant = applicantEmail(signup);

  const adminSend = resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    replyTo: signup.email,
    subject: admin.subject,
    html: admin.html,
    text: admin.text,
  });

  const applicantSend = resend.emails.send({
    from: FROM,
    to: signup.email,
    replyTo: REPLY_TO,
    subject: applicant.subject,
    html: applicant.html,
    text: applicant.text,
  });

  const [adminResult, applicantResult] = await Promise.allSettled([adminSend, applicantSend]);

  if (
    adminResult.status === 'rejected' ||
    (adminResult.value && 'error' in adminResult.value && adminResult.value.error)
  ) {
    // The admin notification is the critical one: without it the lead is lost.
    console.error('[waitlist:admin-send-failed]', signup, adminResult);
    return json(
      { error: "We couldn't record your details just now. Please try again in a moment." },
      502
    );
  }

  if (
    applicantResult.status === 'rejected' ||
    (applicantResult.value && 'error' in applicantResult.value && applicantResult.value.error)
  ) {
    // Confirmation failed but the lead landed. Log and still return success.
    console.warn('[waitlist:applicant-send-failed]', signup.email, applicantResult);
  }

  return json({ ok: true });
};
