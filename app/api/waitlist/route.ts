import { NextResponse } from 'next/server';
import { Resend } from 'resend';

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

const NOTIFY_TO = process.env.WAITLIST_NOTIFY_EMAIL || 'hello@newdryve.com';
const FROM = process.env.WAITLIST_FROM_EMAIL || 'Newdryve <onboarding@resend.dev>';
const REPLY_TO = process.env.WAITLIST_REPLY_TO || NOTIFY_TO;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
        </tr>`,
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
    ? "Thanks for applying to teach with Newdryve"
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
    <p style="margin:24px 0 0;color:#6B6B84;font-size:13px;">— The Newdryve team</p>
  </div>
</body></html>`.trim();

  const text = `${greeting}\n\n${body}\n\n— The Newdryve team`;

  return { subject, html, text };
}

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const role: 'student' | 'instructor' | null =
    body.role === 'student' || body.role === 'instructor' ? body.role : null;
  const postcode = typeof body.postcode === 'string' ? body.postcode.trim().slice(0, 16) : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: 'Please choose student or instructor.' }, { status: 400 });
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
    // No provider configured (e.g. local dev). Log the signup so it's not lost
    // and return success so the form UX stays consistent.
    console.log('[waitlist:no-RESEND_API_KEY]', signup);
    return NextResponse.json({ ok: true });
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

  if (adminResult.status === 'rejected' || (adminResult.value && 'error' in adminResult.value && adminResult.value.error)) {
    // Admin notification is the critical one — without it we lose the lead.
    console.error('[waitlist:admin-send-failed]', signup, adminResult);
    return NextResponse.json(
      { error: "We couldn't record your details just now. Please try again in a moment." },
      { status: 502 },
    );
  }

  if (applicantResult.status === 'rejected' || (applicantResult.value && 'error' in applicantResult.value && applicantResult.value.error)) {
    // Confirmation failed but admin got the lead — log and still return success.
    console.warn('[waitlist:applicant-send-failed]', signup.email, applicantResult);
  }

  const welcome =
    role === 'instructor'
      ? renderInstructorWelcomeEmail({ name })
      : renderStudentWelcomeEmail({ name });

  const adminNotification = renderAdminNotificationEmail({ email, role, name, postcode, notes });

  const unsubscribeMailto = `mailto:${ADMIN_NOTIFY_EMAIL}?subject=unsubscribe`;

  const [welcomeResult, adminResult] = await Promise.allSettled([
    sendEmail({
      to: email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
      replyTo: ADMIN_NOTIFY_EMAIL,
      headers: {
        'List-Unsubscribe': `<${unsubscribeMailto}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
    sendEmail({
      to: ADMIN_NOTIFY_EMAIL,
      subject: adminNotification.subject,
      html: adminNotification.html,
      text: adminNotification.text,
      replyTo: email,
    }),
  ]);

  if (welcomeResult.status === 'rejected') {
    console.error('[waitlist] welcome send threw', welcomeResult.reason);
  } else if (!welcomeResult.value.ok) {
    console.error('[waitlist] welcome send failed', welcomeResult.value.error);
  }
  if (adminResult.status === 'rejected') {
    console.error('[waitlist] admin send threw', adminResult.reason);
  } else if (!adminResult.value.ok) {
    console.error('[waitlist] admin send failed', adminResult.value.error);
  }

  return NextResponse.json({ ok: true });
}
