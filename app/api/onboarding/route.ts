import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';
import { Resend } from 'resend';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/adminAuth';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://newdryve.com';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const FILE_FIELDS = [
  { key: 'dbsCertificate', label: 'DBS certificate', required: true },
  { key: 'adiCertificate', label: 'ADI certificate', required: true },
  { key: 'insuranceCertificate', label: 'Insurance certificate', required: true },
  { key: 'photoId', label: 'Photo ID', required: false },
] as const;

const NOTIFY_TO = process.env.ONBOARDING_NOTIFY_EMAIL || process.env.WAITLIST_NOTIFY_EMAIL || 'hello@newdryve.com';
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

function field(formData: FormData, key: string, maxLen: number): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

export async function POST(req: Request) {
  const sessionToken = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifySessionToken(sessionToken)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form submission.' }, { status: 400 });
  }

  const name = field(formData, 'name', 80);
  const email = field(formData, 'email', 254);
  const phone = field(formData, 'phone', 32);
  const adiNumber = field(formData, 'adiNumber', 32);
  const transmission = field(formData, 'transmission', 16);
  const areas = field(formData, 'areas', 200);
  const experience = field(formData, 'experience', 1000);

  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!adiNumber) return NextResponse.json({ error: 'ADI number is required.' }, { status: 400 });

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json({ error: 'File storage is not configured.' }, { status: 500 });
  }

  const uploadedDocs: { label: string; url: string }[] = [];

  for (const f of FILE_FIELDS) {
    const file = formData.get(f.key);
    if (!(file instanceof File) || file.size === 0) {
      if (f.required) {
        return NextResponse.json({ error: `${f.label} is required.` }, { status: 400 });
      }
      continue;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `${f.label} must be a PDF, JPG, or PNG.` }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `${f.label} must be 10MB or smaller.` }, { status: 400 });
    }

    const blob = await put(`onboarding/${Date.now()}-${f.key}-${file.name}`, file, {
      access: 'private',
      addRandomSuffix: true,
      token: blobToken,
    });
    const viewerUrl = `${SITE_URL}/api/admin/documents?key=${encodeURIComponent(blob.pathname)}`;
    uploadedDocs.push({ label: f.label, url: viewerUrl });
  }

  const submittedAt = new Date().toISOString();

  const rows: [string, string, boolean][] = [
    ['Name', name, false],
    ['Email', email, false],
    ...(phone ? [['Phone', phone, false] as [string, string, boolean]] : []),
    ['ADI number', adiNumber, false],
    ['Transmission', transmission || '—', false],
    ...(areas ? [['Areas', areas, false] as [string, string, boolean]] : []),
    ...(experience ? [['Experience / notes', experience, false] as [string, string, boolean]] : []),
    ...uploadedDocs.map((d) => [d.label, d.url, true] as [string, string, boolean]),
    ['Submitted', submittedAt, false],
  ];

  const adminHtml = `
<!doctype html><html><body style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0A0A14;background:#F0EDF0;padding:24px;margin:0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #E8E8F2;border-radius:16px;padding:28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#E8527A;">Instructor onboarding</p>
    <h1 style="margin:0 0 20px;font-size:22px;letter-spacing:-0.5px;">New application: ${escapeHtml(name)}</h1>
    <p style="margin:0 0 16px;color:#6B6B84;font-size:12px;">Document links require admin login to open.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows
        .map(
          ([k, v, isLink]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E8E8F2;color:#6B6B84;font-weight:600;width:160px;vertical-align:top;">${escapeHtml(k)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #E8E8F2;color:#0A0A14;white-space:pre-wrap;word-break:break-all;">${
            isLink ? `<a href="${escapeHtml(v)}" style="color:#2D6A4F;">View document</a>` : escapeHtml(v)
          }</td>
        </tr>`,
        )
        .join('')}
    </table>
  </div>
</body></html>`.trim();

  const adminText = `New instructor application: ${name}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}`;

  const applicantHtml = `
<!doctype html><html><body style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0A0A14;background:#F0EDF0;padding:24px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E8E8F2;border-radius:16px;padding:32px;">
    <p style="margin:0 0 24px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
      <span style="color:#2D6A4F;">newdr</span><span style="color:#E8527A;">y</span><span style="color:#2D6A4F;">ve</span>
    </p>
    <h1 style="margin:0 0 14px;font-size:22px;letter-spacing:-0.5px;">Thanks for applying to teach with Newdryve</h1>
    <p style="margin:0 0 14px;color:#0A0A14;font-size:15px;line-height:1.55;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 14px;color:#0A0A14;font-size:15px;line-height:1.55;">
      We&rsquo;ve received your application and documents. We&rsquo;ll review everything and be in touch directly about next steps.
    </p>
    <p style="margin:24px 0 0;color:#6B6B84;font-size:13px;">— The Newdryve team</p>
  </div>
</body></html>`.trim();

  const applicantText = `Hi ${name},\n\nWe've received your application and documents. We'll review everything and be in touch directly about next steps.\n\n— The Newdryve team`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[onboarding:no-RESEND_API_KEY]', { name, email, adiNumber, uploadedDocs, submittedAt });
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(apiKey);

  const adminSend = resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    replyTo: email,
    subject: `New instructor application: ${name}`,
    html: adminHtml,
    text: adminText,
  });

  const applicantSend = resend.emails.send({
    from: FROM,
    to: email,
    replyTo: REPLY_TO,
    subject: 'Thanks for applying to teach with Newdryve',
    html: applicantHtml,
    text: applicantText,
  });

  const [adminResult, applicantResult] = await Promise.allSettled([adminSend, applicantSend]);

  if (adminResult.status === 'rejected' || (adminResult.value && 'error' in adminResult.value && adminResult.value.error)) {
    console.error('[onboarding:admin-send-failed]', { name, email }, adminResult);
    return NextResponse.json(
      { error: "We couldn't record the application just now. Please try again in a moment." },
      { status: 502 },
    );
  }

  if (applicantResult.status === 'rejected' || (applicantResult.value && 'error' in applicantResult.value && applicantResult.value.error)) {
    console.warn('[onboarding:applicant-send-failed]', email, applicantResult);
  }

  return NextResponse.json({ ok: true });
}
