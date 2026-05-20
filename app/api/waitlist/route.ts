import { NextResponse } from 'next/server';

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
  const role = body.role === 'student' || body.role === 'instructor' ? body.role : null;
  const postcode = typeof body.postcode === 'string' ? body.postcode.trim().slice(0, 16) : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: 'Please choose student or instructor.' }, { status: 400 });
  }

  // TODO: forward to your email provider / CRM (Resend, ConvertKit, Notion, Airtable, etc).
  // For now we just log so the signup is visible in the server console.
  console.log('[waitlist]', { email, role, postcode, name, notes, at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
