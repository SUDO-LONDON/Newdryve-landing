import { NextResponse } from 'next/server';
import { ADMIN_NOTIFY_EMAIL, sendEmail } from '@/lib/email/send';
import {
  renderAdminNotificationEmail,
  renderInstructorWelcomeEmail,
  renderStudentWelcomeEmail,
} from '@/lib/email/templates';

type Payload = {
  email?: unknown;
  role?: unknown;
  postcode?: unknown;
  name?: unknown;
  notes?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  console.log('[waitlist]', { email, role, postcode, name, notes, at: new Date().toISOString() });

  const welcome =
    role === 'instructor'
      ? renderInstructorWelcomeEmail({ name })
      : renderStudentWelcomeEmail({ name });

  const admin = renderAdminNotificationEmail({ email, role, name, postcode, notes });

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
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
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
