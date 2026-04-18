import type { APIRoute } from 'astro';

export const prerender = false;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingBody {
  name:       string;
  phone:      string;
  email:      string;
  service:    string;
  pickup:     string;
  dropoff:    string;
  date:       string;
  time:       string;
  passengers?: string;
  notes?:     string;
  _honey?:    string;
}

interface Env {
  RESEND_API_KEY:      string;
  OWNER_EMAIL:         string;
  OWNER_PHONE:         string;
  FROM_EMAIL:          string;
  REPLY_TO_EMAIL:      string;
  TWILIO_ACCOUNT_SID:  string;
  TWILIO_AUTH_TOKEN:   string;
  TWILIO_FROM_NUMBER:  string;
  ALLOWED_ORIGIN?:     string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS: (keyof BookingBody)[] = [
  'name', 'phone', 'email', 'service', 'pickup', 'dropoff', 'date', 'time',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[\+\d][\d\s\-\(\)]{6,19}$/;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE  = /^\d{2}:\d{2}$/;

function validateBooking(body: BookingBody): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (body._honey) return { ok: false, errors: ['spam'] };

  for (const field of REQUIRED_FIELDS) {
    if (!body[field]?.trim()) errors.push(`${field} is required`);
  }

  if (errors.length) return { ok: false, errors };

  if (!EMAIL_RE.test(body.email.trim()))  errors.push('email address is invalid');
  if (!PHONE_RE.test(body.phone.trim()))  errors.push('phone number is invalid');

  if (!DATE_RE.test(body.date)) {
    errors.push('date format is invalid');
  } else {
    const bookingDate = new Date(body.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) errors.push('date must be today or in the future');
  }

  if (!TIME_RE.test(body.time)) errors.push('time format is invalid');

  const pax = parseInt(body.passengers ?? '1', 10);
  if (body.passengers && (isNaN(pax) || pax < 1 || pax > 20)) {
    errors.push('passengers must be between 1 and 20');
  }

  if (body.notes && body.notes.length > 1000) {
    errors.push('notes must be under 1000 characters');
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Reference
// ---------------------------------------------------------------------------

function generateReference(): string {
  const now    = new Date();
  const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand   = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VEC-${yymmdd}-${rand}`;
}

// ---------------------------------------------------------------------------
// Email via Resend
// ---------------------------------------------------------------------------

async function sendEmail(
  params: { to: string; subject: string; html: string; replyTo?: string },
  env: Env
): Promise<void> {
  const body: Record<string, unknown> = {
    from:    env.FROM_EMAIL,
    to:      [params.to],
    subject: params.subject,
    html:    params.html,
  };
  if (params.replyTo) body.reply_to = params.replyTo;

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

// ---------------------------------------------------------------------------
// SMS via Twilio
// ---------------------------------------------------------------------------

async function sendSMS(
  params: { to: string; body: string },
  env: Env
): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      To:   params.to,
      From: env.TWILIO_FROM_NUMBER,
      Body: params.body,
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio ${res.status}: ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Templates (same as worker.js)
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);font-size:12px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0 8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;color:#ffffff;">${value}</td>
  </tr>`;
}

function customerRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;font-size:12px;width:110px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0 8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#1a1a1a;">${value}</td>
  </tr>`;
}

function ownerEmailHTML(b: BookingBody, ref: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Booking Request — ${ref}</title></head>
<body style="margin:0;padding:0;background:#1a1a1a;font-family:Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#242424;border-radius:8px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
        <tr>
          <td style="background:#b8922a;padding:20px 28px;">
            <p style="margin:0;color:#1a1200;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">Vitaly Executive Chauffeur</p>
            <h1 style="margin:6px 0 0;color:#1a1200;font-size:22px;font-weight:700;">New Booking Request</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 20px;color:rgba(255,255,255,0.6);font-size:13px;">Reference: <strong style="color:#d4a832;font-family:monospace;">${ref}</strong></p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${row('Name',       escapeHtml(b.name))}
              ${row('Phone',      escapeHtml(b.phone))}
              ${row('Email',      escapeHtml(b.email))}
              ${row('Service',    escapeHtml(b.service))}
              ${row('Pickup',     escapeHtml(b.pickup))}
              ${row('Dropoff',    escapeHtml(b.dropoff))}
              ${row('Date',       formatDate(b.date))}
              ${row('Time',       escapeHtml(b.time))}
              ${row('Passengers', escapeHtml(b.passengers ?? '1'))}
              ${b.notes ? row('Notes', escapeHtml(b.notes)) : ''}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td style="padding-right:8px;">
                  <a href="tel:${encodeURIComponent(b.phone)}"
                     style="display:block;text-align:center;padding:12px;background:#b8922a;color:#1a1200;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
                    Call ${escapeHtml(b.name.split(' ')[0])}
                  </a>
                </td>
                <td style="padding-left:8px;">
                  <a href="https://wa.me/${b.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Hi ' + b.name.split(' ')[0] + ', booking ref ' + ref + ' confirmed.')}"
                     style="display:block;text-align:center;padding:12px;background:#25D366;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
                    WhatsApp
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.08);">
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;text-align:center;">Vitaly Executive Chauffeur · Dublin, Ireland · info@vitalychauffeur.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function customerEmailHTML(b: BookingBody, ref: string): string {
  const firstName = escapeHtml(b.name.split(' ')[0]);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Booking Request Received — ${ref}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e5e5;overflow:hidden;">
        <tr>
          <td style="background:#1c1c1c;padding:20px 28px;">
            <p style="margin:0;color:#b8922a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">Vitaly Executive Chauffeur</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Booking Request Received</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 12px;font-size:16px;color:#1a1a1a;">Hi ${firstName},</p>
            <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">
              Thank you for your booking request. We'll confirm availability and the exact fare within <strong>10 minutes</strong>.
            </p>
            <div style="background:#f9f6ee;border:1px solid #d4a832;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:11px;color:#b8922a;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">Your reference</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;font-family:monospace;letter-spacing:0.05em;">${ref}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
              ${customerRow('Service',    escapeHtml(b.service))}
              ${customerRow('Pickup',     escapeHtml(b.pickup))}
              ${customerRow('Drop-off',   escapeHtml(b.dropoff))}
              ${customerRow('Date',       formatDate(b.date))}
              ${customerRow('Time',       escapeHtml(b.time))}
              ${customerRow('Passengers', escapeHtml(b.passengers ?? '1'))}
              ${b.notes ? customerRow('Notes', escapeHtml(b.notes)) : ''}
            </table>
            <p style="margin:0 0 8px;font-size:14px;color:#444;line-height:1.6;">
              We may contact you by phone or WhatsApp to confirm. To make changes, reply to this email or message us on WhatsApp.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
              <tr>
                <td>
                  <a href="https://wa.me/353XXXXXXXXX?text=${encodeURIComponent('Hi, my booking ref is ' + ref + '. I need to make a change.')}"
                     style="display:block;text-align:center;padding:12px;background:#25D366;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
                    WhatsApp Us
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:#f9f9f9;border-top:1px solid #e5e5e5;">
            <p style="margin:0;color:#999;font-size:12px;text-align:center;line-height:1.6;">
              Vitaly Executive Chauffeur · Dublin, Ireland<br>
              info@vitalychauffeur.com · vitalychauffeur.ie
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ownerSMSBody(b: BookingBody, ref: string): string {
  return `New booking [${ref}]\n${b.name} · ${b.phone}\n${b.service}\n${formatDate(b.date)} ${b.time}\n${b.pickup} → ${b.dropoff}\nPax: ${b.passengers ?? '1'}${b.notes ? '\nNote: ' + b.notes.slice(0, 100) : ''}`;
}

function customerSMSBody(b: BookingBody, ref: string): string {
  const firstName = b.name.split(' ')[0];
  return `Hi ${firstName}, Vitaly Executive Chauffeur received your booking request [${ref}] for ${formatDate(b.date)} at ${b.time}. We'll confirm within 10 minutes. vitalychauffeur.ie`;
}

// ---------------------------------------------------------------------------
// API route handler
// ---------------------------------------------------------------------------

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as { runtime?: { env?: Env } }).runtime?.env as Env | undefined;

  const corsOrigin = env?.ALLOWED_ORIGIN ?? '*';
  const corsHead   = {
    'Access-Control-Allow-Origin':  corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHead },
    });

  // Parse body
  let body: BookingBody;
  try {
    const ct = request.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      body = await request.json() as BookingBody;
    } else {
      const fd = await request.formData();
      body = Object.fromEntries(fd.entries()) as unknown as BookingBody;
    }
  } catch {
    return json({ success: false, message: 'Invalid request body' }, 400);
  }

  // Validate
  const { ok, errors } = validateBooking(body);
  if (!ok) {
    return json({ success: false, errors }, errors[0] === 'spam' ? 200 : 422);
  }

  if (!env?.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY — booking notifications disabled');
    const ref = generateReference();
    return json({ success: true, reference: ref });
  }

  const ref = generateReference();

  // Fire notifications — don't let failures block the response
  const ctx = (locals as { runtime?: { ctx?: ExecutionContext } }).runtime?.ctx;
  const notifications = Promise.allSettled([
    sendEmail({
      to:      env.OWNER_EMAIL,
      subject: `[${ref}] New booking — ${body.name} · ${formatDate(body.date)} ${body.time}`,
      html:    ownerEmailHTML(body, ref),
      replyTo: body.email,
    }, env).catch(err => console.error('Owner email failed:', (err as Error).message)),

    sendEmail({
      to:      body.email.trim(),
      subject: `Booking request received — ${ref} | Vitaly Executive Chauffeur`,
      html:    customerEmailHTML(body, ref),
      replyTo: env.REPLY_TO_EMAIL ?? env.OWNER_EMAIL,
    }, env).catch(err => console.error('Customer email failed:', (err as Error).message)),

    env.OWNER_PHONE
      ? sendSMS({ to: env.OWNER_PHONE, body: ownerSMSBody(body, ref) }, env)
          .catch(err => console.error('Owner SMS failed:', (err as Error).message))
      : Promise.resolve(),

    env.TWILIO_FROM_NUMBER && body.phone
      ? sendSMS({ to: body.phone.trim(), body: customerSMSBody(body, ref) }, env)
          .catch(err => console.error('Customer SMS failed:', (err as Error).message))
      : Promise.resolve(),
  ]);

  if (ctx?.waitUntil) {
    ctx.waitUntil(notifications);
  } else {
    await notifications;
  }

  return json({ success: true, reference: ref });
};
