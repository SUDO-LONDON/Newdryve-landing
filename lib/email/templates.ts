import { SITE_URL } from '@/lib/env';

const COLORS = {
  ink: '#0A0A14',
  inkSecondary: '#4B4B66',
  inkMuted: '#7A7A95',
  canvas: '#F0EDF0',
  white: '#FFFFFF',
  border: '#E8E8F2',
  racingGreen: '#2D6A4F',
  racingGreenSoft: '#E8F1EC',
  deepRose: '#E8527A',
  deepRoseSoft: '#FBE9EF',
  blush: '#F8F2F4',
} as const;

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function logoMarkup(): string {
  return `
    <span style="font-family:${FONT_STACK};font-size:22px;font-weight:800;letter-spacing:-0.5px;line-height:1;">
      <span style="color:${COLORS.racingGreen};">newdr</span><span style="color:${COLORS.deepRose};">y</span><span style="color:${COLORS.racingGreen};">ve</span>
    </span>
  `;
}

function stepRow(num: number, title: string, body: string, accent: string): string {
  return `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td valign="top" width="44" style="padding-right:14px;">
              <div style="width:36px;height:36px;border-radius:999px;background:${accent};color:${COLORS.white};font-family:${FONT_STACK};font-size:14px;font-weight:800;text-align:center;line-height:36px;">${num}</div>
            </td>
            <td valign="top" style="font-family:${FONT_STACK};">
              <div style="font-size:15px;font-weight:700;color:${COLORS.ink};line-height:1.35;">${title}</div>
              <div style="margin-top:4px;font-size:14px;color:${COLORS.inkSecondary};line-height:1.55;">${body}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function featureRow(emoji: string, title: string, body: string, tint: string): string {
  return `
    <tr>
      <td style="padding:0 0 10px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border:1px solid ${COLORS.border};border-radius:14px;background:${COLORS.white};">
          <tr>
            <td style="padding:16px 18px;font-family:${FONT_STACK};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="top" width="54" style="padding-right:14px;">
                    <div style="width:40px;height:40px;border-radius:10px;background:${tint};text-align:center;line-height:40px;font-size:20px;">${emoji}</div>
                  </td>
                  <td valign="top">
                    <div style="font-size:15px;font-weight:800;color:${COLORS.ink};line-height:1.3;">${title}</div>
                    <div style="margin-top:4px;font-size:14px;color:${COLORS.inkSecondary};line-height:1.55;">${body}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

type LayoutOpts = {
  preheader: string;
  title: string;
  subhead: string;
  greeting: string;
  intro: string;
  stepsTitle: string;
  steps: { title: string; body: string }[];
  featuresTitle: string;
  features: { emoji: string; title: string; body: string; tint: string }[];
  ctaLabel: string;
  ctaHref: string;
  closing: string;
  signOff: string;
};

function layout(opts: LayoutOpts): string {
  const stepsAccent = [COLORS.racingGreen, COLORS.deepRose, COLORS.ink];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${escape(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.canvas};font-family:${FONT_STACK};color:${COLORS.ink};-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:${COLORS.canvas};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escape(opts.preheader)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.canvas};border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:24px 16px 8px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;border-collapse:collapse;">
          <tr>
            <td>
              <div style="height:4px;border-radius:4px;background-image:linear-gradient(90deg,${COLORS.racingGreen} 0%,${COLORS.deepRose} 100%);background-color:${COLORS.racingGreen};"></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:0 16px 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;border-collapse:separate;background:${COLORS.white};border:1px solid ${COLORS.border};border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left">${logoMarkup()}</td>
                  <td align="right" style="font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${COLORS.deepRose};">Early access</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 0 32px;">
              <h1 style="margin:16px 0 8px 0;font-family:${FONT_STACK};font-size:30px;line-height:1.15;letter-spacing:-1px;font-weight:800;color:${COLORS.ink};">${opts.title}</h1>
              <p style="margin:0 0 8px 0;font-family:${FONT_STACK};font-size:16px;line-height:1.55;color:${COLORS.inkSecondary};">${opts.subhead}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;background-image:linear-gradient(135deg,${COLORS.racingGreen} 0%,${COLORS.ink} 100%);background-color:${COLORS.racingGreen};border-radius:14px;">
                <tr>
                  <td style="padding:24px;color:${COLORS.white};font-family:${FONT_STACK};">
                    <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,0.7);">${opts.greeting}</div>
                    <div style="margin-top:10px;font-size:18px;font-weight:600;line-height:1.5;color:${COLORS.white};">${opts.intro}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 0 32px;">
              <div style="font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${COLORS.deepRose};">${opts.stepsTitle}</div>
              <div style="height:14px;line-height:14px;">&nbsp;</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${opts.steps.map((s, i) => stepRow(i + 1, s.title, s.body, stepsAccent[i % stepsAccent.length])).join('')}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 32px 0 32px;">
              <div style="font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${COLORS.deepRose};">${opts.featuresTitle}</div>
              <div style="height:14px;line-height:14px;">&nbsp;</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                ${opts.features.map((f) => featureRow(f.emoji, f.title, f.body, f.tint)).join('')}
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
                <tr>
                  <td style="border-radius:999px;background:${COLORS.ink};">
                    <a href="${escape(opts.ctaHref)}" style="display:inline-block;padding:14px 26px;font-family:${FONT_STACK};font-size:15px;font-weight:800;color:${COLORS.white};text-decoration:none;letter-spacing:-0.1px;">${escape(opts.ctaLabel)} &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 24px 32px;">
              <p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${COLORS.inkSecondary};">${opts.closing}</p>
              <p style="margin:18px 0 0 0;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${COLORS.ink};font-weight:700;">${opts.signOff}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 28px 32px;">
              <div style="height:1px;background:${COLORS.border};line-height:1px;font-size:1px;">&nbsp;</div>
              <div style="margin-top:18px;font-family:${FONT_STACK};font-size:12px;color:${COLORS.inkMuted};line-height:1.6;">
                You&rsquo;re receiving this because you signed up for early access at
                <a href="${escape(SITE_URL)}" style="color:${COLORS.inkSecondary};text-decoration:underline;">${escape(SITE_URL.replace(/^https?:\/\//, ''))}</a>.
                Newdryve · Norwich, UK
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function nameOrFallback(name: string | undefined, fallback: string): string {
  const n = (name || '').trim();
  return n ? n : fallback;
}

export function renderStudentWelcomeEmail({ name }: { name?: string } = {}): { subject: string; html: string; text: string } {
  const firstName = nameOrFallback(name, 'there');
  const subject = "You're on the Newdryve early-access list";
  const html = layout({
    preheader: "Thanks for signing up. Here's what happens next as we open up driving lessons in Norwich.",
    title: 'Welcome to Newdryve.',
    subhead: "You're officially on the early-access list for driving lessons in Norwich. Here's what to expect from us.",
    greeting: `Hi ${escape(firstName)},`,
    intro:
      "Thanks for signing up. We're building Newdryve so finding a driving instructor and booking lessons in Norwich feels less like ringing around and more like a few taps. You're now in the queue for the first cohort.",
    stepsTitle: "What happens next",
    steps: [
      {
        title: "We'll match you with an instructor",
        body: "As soon as we onboard an ADI-qualified instructor with availability near you, we'll line up an introduction by email.",
      },
      {
        title: "You'll see real availability, no chasing callbacks",
        body: "When you're matched, you'll get access to your instructor's real, up-to-the-minute schedule. Pick a time that works and book the slot in seconds.",
      },
      {
        title: "Pay your way",
        body: "Card, bank transfer, or cash on arrival. Choose whichever you prefer, with no surprise fees and no hidden charges.",
      },
    ],
    featuresTitle: "What we're building",
    features: [
      {
        emoji: '📅',
        title: 'Real-time slots',
        body: '14 days of live availability per instructor. Book the slot you want without the back-and-forth.',
        tint: COLORS.racingGreenSoft,
      },
      {
        emoji: '💳',
        title: 'Flexible payments',
        body: 'Card, bank transfer, or cash on arrival, paid the way you actually like to pay.',
        tint: COLORS.deepRoseSoft,
      },
      {
        emoji: '📈',
        title: 'Hours toward your test',
        body: 'Every lesson logged, every hour counted, every milestone tracked toward your test.',
        tint: COLORS.blush,
      },
    ],
    ctaLabel: 'Visit Newdryve',
    ctaHref: SITE_URL,
    closing:
      "We'll only email you when there's real news: a matched instructor, an open lesson slot, or a platform launch in your area. Got a friend learning to drive in Norwich? Forward this on. The early cohort is small and we'd love to keep it local.",
    signOff: 'The Newdryve team',
  });

  const text = [
    `Hi ${firstName},`,
    '',
    "Thanks for signing up to Newdryve. You're officially on the early-access list for driving lessons in Norwich.",
    '',
    'What happens next:',
    "  1. We'll match you with an ADI-qualified instructor near you.",
    "  2. You'll see their real availability and book the slot you want.",
    '  3. Pay by card, bank transfer, or cash, whichever you prefer.',
    '',
    `We'll only email you when there's real news. Visit ${SITE_URL} to learn more.`,
    '',
    'The Newdryve team',
  ].join('\n');

  return { subject, html, text };
}

export function renderInstructorWelcomeEmail({ name }: { name?: string } = {}): { subject: string; html: string; text: string } {
  const firstName = nameOrFallback(name, 'there');
  const subject = 'Your founding instructor application · Newdryve';
  const html = layout({
    preheader: "Thanks for applying to teach with Newdryve. Here's exactly what happens next.",
    title: "Welcome, founding instructor.",
    subhead:
      "Thanks for applying to teach with Newdryve. We're building this with a small founding group of ADI-qualified instructors in Norwich, and you're now on the list.",
    greeting: `Hi ${escape(firstName)},`,
    intro:
      "We're recruiting a small founding cohort of instructors to launch Newdryve in Norwich. You stay in full control of your schedule and pricing. We just give you the booking layer and the learners.",
    stepsTitle: "What happens next",
    steps: [
      {
        title: "We'll review your application personally",
        body: "Every application is read by a real human on our team, not a form-bot. We'll look at your ADI, your area, and the experience you've shared.",
      },
      {
        title: "Quick intro call",
        body: "If it looks like a fit, we'll set up a 15-minute call to understand how you work today and what would actually help you run more lessons.",
      },
      {
        title: "Onboarding and first bookings",
        body: "We'll get you set up on the platform, your availability live, and send learners your way as soon as we have matches in your area.",
      },
    ],
    featuresTitle: 'Why teach with Newdryve',
    features: [
      {
        emoji: '🟢',
        title: '0% commission, forever',
        body: 'You keep 100% of every lesson. We never take a cut of what you earn.',
        tint: COLORS.racingGreenSoft,
      },
      {
        emoji: '🆓',
        title: 'Free until your first booking',
        body: "You don't pay anything until a learner books with you. After that, a flat monthly fee. That's it.",
        tint: COLORS.deepRoseSoft,
      },
      {
        emoji: '🎛️',
        title: 'You stay in control',
        body: 'Set your own schedule, your own pricing, and your own teaching style. We just handle the booking layer.',
        tint: COLORS.blush,
      },
    ],
    ctaLabel: 'See the founding cohort page',
    ctaHref: `${SITE_URL}/#instructors`,
    closing:
      "We're keeping the first cohort intentionally small so we can build the platform around how Norwich instructors actually work. If there's anything specific you want from a tool like this, just hit reply. Every founding instructor's feedback directly shapes what we build next.",
    signOff: 'The Newdryve team',
  });

  const text = [
    `Hi ${firstName},`,
    '',
    "Thanks for applying to teach with Newdryve. You're on the list for our founding cohort of instructors in Norwich.",
    '',
    'What happens next:',
    "  1. We'll review your application personally.",
    "  2. We'll set up a 15-minute intro call if it's a fit.",
    "  3. We'll onboard you and start sending learners your way.",
    '',
    'Why teach with us:',
    '  - 0% commission, forever',
    '  - Free until your first booking, then a flat monthly fee',
    '  - You keep full control of schedule and pricing',
    '',
    `Visit ${SITE_URL}/#instructors for more.`,
    '',
    'The Newdryve team',
  ].join('\n');

  return { subject, html, text };
}

export function renderAdminNotificationEmail(payload: {
  email: string;
  role: 'student' | 'instructor';
  name?: string;
  postcode?: string;
  notes?: string;
}): { subject: string; html: string; text: string } {
  const { email, role, name, postcode, notes } = payload;
  const roleLabel = role === 'instructor' ? 'Instructor' : 'Learner';
  const subject = `[Newdryve] New ${roleLabel.toLowerCase()} signup: ${email}`;

  const rows: { label: string; value: string }[] = [
    { label: 'Role', value: roleLabel },
    { label: 'Email', value: email },
  ];
  if (name && name.trim()) rows.push({ label: 'Name', value: name.trim() });
  if (postcode && postcode.trim())
    rows.push({ label: role === 'instructor' ? 'Where they teach' : 'Postcode / area', value: postcode.trim() });
  if (notes && notes.trim())
    rows.push({ label: role === 'instructor' ? 'ADI / experience' : 'Notes', value: notes.trim() });
  rows.push({ label: 'Received', value: new Date().toISOString() });

  const rowsHtml = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:6px 14px 6px 0;font-family:${FONT_STACK};font-size:12px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;color:${COLORS.inkMuted};vertical-align:top;width:140px;">${escape(r.label)}</td>
          <td style="padding:6px 0;font-family:${FONT_STACK};font-size:14px;color:${COLORS.ink};line-height:1.55;white-space:pre-wrap;">${escape(r.value)}</td>
        </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.canvas};font-family:${FONT_STACK};color:${COLORS.ink};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.canvas};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:${COLORS.white};border:1px solid ${COLORS.border};border-radius:14px;">
          <tr>
            <td style="padding:24px 28px 8px 28px;">
              ${logoMarkup()}
              <div style="margin-top:18px;font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${COLORS.deepRose};">New ${roleLabel.toLowerCase()} signup</div>
              <h1 style="margin:6px 0 0 0;font-family:${FONT_STACK};font-size:22px;font-weight:800;letter-spacing:-0.5px;color:${COLORS.ink};">${escape(email)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                ${rowsHtml}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `[Newdryve] New ${roleLabel.toLowerCase()} signup`,
    ...rows.map((r) => `${r.label}: ${r.value}`),
  ].join('\n');

  return { subject, html, text };
}
