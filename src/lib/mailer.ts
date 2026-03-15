import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const defaultSender =
  process.env.SMTP_FROM ||
  process.env.PASSWORD_RESET_SENDER ||
  "BoardGameTools <no-reply@boardgametools.local>";

if (!smtpHost) {
  console.warn("[mailer] SMTP_HOST is not configured. Emails will fail.");
}

const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  : null;

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function ensureTransporter() {
  if (!transporter) {
    throw new Error("SMTP transport is not configured. Set SMTP_HOST to enable email sending.");
  }
  return transporter;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function htmlLayout(body: string) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;color:#1a1a2e;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;">
  <div style="border-bottom:3px solid #4338ca;padding-bottom:12px;margin-bottom:24px;">
    <strong style="font-size:18px;color:#4338ca;">🎲 BoardGameTools</strong>
  </div>
  ${body}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#888;">
    Diese E-Mail wurde automatisch von BoardGameTools gesendet.
  </div>
</body>
</html>`;
}

function buttonHtml(url: string, label: string) {
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background-color:#4338ca;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">${label}</a>`;
}

// ────────────────────────────────────────────
// Password reset
// ────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string, expiresAt: Date) {
  const t = ensureTransporter();
  const formattedExpiry = expiresAt.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });

  await t.sendMail({
    from: defaultSender,
    to,
    subject: "Passwort zurücksetzen",
    text: `Hallo,

du hast eine Zurücksetzung deines Passworts angefordert. Nutze den folgenden Link, um ein neues Passwort festzulegen:

${resetUrl}

Der Link ist gültig bis ${formattedExpiry}. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.

Viele Grüße
BoardGameTools`,
    html: htmlLayout(`
      <p>Hallo,</p>
      <p>du hast eine Zurücksetzung deines Passworts angefordert. Nutze den folgenden Link, um ein neues Passwort festzulegen:</p>
      <p>${buttonHtml(resetUrl, "Passwort jetzt zurücksetzen")}</p>
      <p>Der Link ist gültig bis <strong>${formattedExpiry}</strong>. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
    `),
  });
}

// ────────────────────────────────────────────
// Event: Einladung
// ────────────────────────────────────────────

interface EventInviteMailOptions {
  to: string;
  eventTitle: string;
  eventDate: Date | string;
  location?: string | null;
  inviterName: string;
  eventUrl: string;
}

export async function sendEventInviteEmail(opts: EventInviteMailOptions) {
  const t = ensureTransporter();
  const { to, eventTitle, eventDate, location, inviterName, eventUrl } = opts;
  const dateStr = formatDate(eventDate);
  const locationLine = location ? `📍 Ort: ${location}` : "";

  await t.sendMail({
    from: defaultSender,
    to,
    subject: `Einladung: ${eventTitle}`,
    text: `Hallo,

${inviterName} hat dich zum Spieleabend "${eventTitle}" eingeladen!

📅 Datum: ${dateStr}
${locationLine}

Öffne BoardGameTools, um die Einladung anzunehmen oder abzulehnen:
${eventUrl}

Viele Grüße
BoardGameTools`,
    html: htmlLayout(`
      <h2 style="color:#1a1a2e;margin:0 0 8px;">Du bist eingeladen! 🎉</h2>
      <p><strong>${inviterName}</strong> hat dich zum Spieleabend eingeladen:</p>
      <div style="background:#f8f8fc;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#4338ca;">${eventTitle}</p>
        <p style="margin:0;color:#555;">📅 ${dateStr}</p>
        ${location ? `<p style="margin:4px 0 0;color:#555;">📍 ${location}</p>` : ""}
      </div>
      <p>${buttonHtml(eventUrl, "Einladung ansehen")}</p>
    `),
  });
}

// ────────────────────────────────────────────
// Event: Erinnerung (resend)
// ────────────────────────────────────────────

interface EventReminderMailOptions {
  to: string;
  eventTitle: string;
  eventDate: Date | string;
  location?: string | null;
  inviterName: string;
  eventUrl: string;
}

export async function sendEventReminderEmail(opts: EventReminderMailOptions) {
  const t = ensureTransporter();
  const { to, eventTitle, eventDate, location, inviterName, eventUrl } = opts;
  const dateStr = formatDate(eventDate);

  await t.sendMail({
    from: defaultSender,
    to,
    subject: `Erinnerung: ${eventTitle}`,
    text: `Hallo,

dies ist eine Erinnerung an die Einladung von ${inviterName} zum Spieleabend "${eventTitle}".

📅 Datum: ${dateStr}
${location ? `📍 Ort: ${location}` : ""}

Bitte antworte auf die Einladung:
${eventUrl}

Viele Grüße
BoardGameTools`,
    html: htmlLayout(`
      <h2 style="color:#1a1a2e;margin:0 0 8px;">Erinnerung: Einladung ausstehend ⏰</h2>
      <p>Du hast noch nicht auf die Einladung von <strong>${inviterName}</strong> geantwortet:</p>
      <div style="background:#f8f8fc;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#4338ca;">${eventTitle}</p>
        <p style="margin:0;color:#555;">📅 ${dateStr}</p>
        ${location ? `<p style="margin:4px 0 0;color:#555;">📍 ${location}</p>` : ""}
      </div>
      <p>${buttonHtml(eventUrl, "Jetzt antworten")}</p>
    `),
  });
}

// ────────────────────────────────────────────
// Event: Zu-/Absage an Organisator
// ────────────────────────────────────────────

interface InviteResponseMailOptions {
  to: string;
  eventTitle: string;
  responderName: string;
  response: "accepted" | "declined";
  eventUrl: string;
}

export async function sendInviteResponseEmail(opts: InviteResponseMailOptions) {
  const t = ensureTransporter();
  const { to, eventTitle, responderName, response, eventUrl } = opts;
  const isAccepted = response === "accepted";
  const emoji = isAccepted ? "✅" : "❌";
  const statusText = isAccepted ? "zugesagt" : "abgesagt";

  await t.sendMail({
    from: defaultSender,
    to,
    subject: `${emoji} ${responderName} hat für "${eventTitle}" ${statusText}`,
    text: `Hallo,

${responderName} hat für den Spieleabend "${eventTitle}" ${statusText}.

Sieh dir den aktuellen Status an:
${eventUrl}

Viele Grüße
BoardGameTools`,
    html: htmlLayout(`
      <h2 style="color:#1a1a2e;margin:0 0 8px;">${emoji} Neue Antwort auf deine Einladung</h2>
      <p><strong>${responderName}</strong> hat für <strong>${eventTitle}</strong> ${statusText}.</p>
      <p>${buttonHtml(eventUrl, "Event ansehen")}</p>
    `),
  });
}

// ────────────────────────────────────────────
// Event: Custom-Nachricht an Teilnehmer
// ────────────────────────────────────────────

interface CustomEventMessageOptions {
  to: string;
  eventTitle: string;
  eventDate: Date | string;
  location?: string | null;
  senderName: string;
  message: string;
  eventUrl: string;
}

export async function sendCustomEventMessage(opts: CustomEventMessageOptions) {
  const t = ensureTransporter();
  const { to, eventTitle, eventDate, location, senderName, message, eventUrl } = opts;
  const dateStr = formatDate(eventDate);

  await t.sendMail({
    from: defaultSender,
    to,
    subject: `${eventTitle} – Nachricht von ${senderName}`,
    text: `Hallo,

${senderName} hat eine Nachricht zum Spieleabend "${eventTitle}" geschickt:

"${message}"

📅 Datum: ${dateStr}
${location ? `📍 Ort: ${location}` : ""}

Zum Event:
${eventUrl}

Viele Grüße
BoardGameTools`,
    html: htmlLayout(`
      <h2 style="color:#1a1a2e;margin:0 0 8px;">Nachricht zum Spieleabend ✉️</h2>
      <p><strong>${senderName}</strong> schreibt zum Event:</p>
      <div style="background:#f8f8fc;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#4338ca;">${eventTitle}</p>
        <p style="margin:0;color:#555;">📅 ${dateStr}</p>
        ${location ? `<p style="margin:4px 0 0;color:#555;">📍 ${location}</p>` : ""}
      </div>
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;padding:16px;margin:16px 0;font-size:15px;color:#1a1a2e;">
        ${message.replace(/\n/g, "<br>")}
      </div>
      <p>${buttonHtml(eventUrl, "Event ansehen")}</p>
    `),
  });
}

// ────────────────────────────────────────────
// Event: Erinnerung an bevorstehenden Spieleabend
// ────────────────────────────────────────────

interface EventUpcomingReminderOptions {
  to: string;
  eventTitle: string;
  eventDate: Date | string;
  location?: string | null;
  organizerName: string;
  eventUrl: string;
}

export async function sendEventUpcomingReminder(opts: EventUpcomingReminderOptions) {
  const t = ensureTransporter();
  const { to, eventTitle, eventDate, location, organizerName, eventUrl } = opts;
  const dateStr = formatDate(eventDate);

  await t.sendMail({
    from: defaultSender,
    to,
    subject: `Nicht vergessen: ${eventTitle} steht an!`,
    text: `Hallo,

nur eine kurze Erinnerung: Der Spieleabend "${eventTitle}" von ${organizerName} steht bald an!

📅 Datum: ${dateStr}
${location ? `📍 Ort: ${location}` : ""}

Wir freuen uns auf dich!
${eventUrl}

Viele Grüße
BoardGameTools`,
    html: htmlLayout(`
      <h2 style="color:#1a1a2e;margin:0 0 8px;">Spieleabend steht an! 🎲</h2>
      <p>Nur eine kurze Erinnerung an den bevorstehenden Spieleabend von <strong>${organizerName}</strong>:</p>
      <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #bbf7d0;">
        <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#4338ca;">${eventTitle}</p>
        <p style="margin:0;color:#555;">📅 ${dateStr}</p>
        ${location ? `<p style="margin:4px 0 0;color:#555;">📍 ${location}</p>` : ""}
      </div>
      <p>Wir freuen uns auf dich!</p>
      <p>${buttonHtml(eventUrl, "Event ansehen")}</p>
    `),
  });
}
