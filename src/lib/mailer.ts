import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const defaultSender = process.env.PASSWORD_RESET_SENDER || "BoardGameTools <no-reply@boardgametools.local>";

if (!smtpHost) {
  console.warn("[mailer] SMTP_HOST is not configured. Password reset emails will fail.");
}

const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  : null;

export async function sendPasswordResetEmail(to: string, resetUrl: string, expiresAt: Date) {
  if (!transporter) {
    throw new Error("SMTP transport is not configured. Set SMTP_HOST to enable email sending.");
  }

  const formattedExpiry = expiresAt.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });

  await transporter.sendMail({
    from: defaultSender,
    to,
    subject: "Passwort zurücksetzen",
    text: `Hallo,

du hast eine Zurücksetzung deines Passworts angefordert. Nutze den folgenden Link, um ein neues Passwort festzulegen:

${resetUrl}

Der Link ist gültig bis ${formattedExpiry}. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.

Viele Grüße
BoardGameTools`,
    html: `<p>Hallo,</p>
<p>du hast eine Zurücksetzung deines Passworts angefordert. Nutze den folgenden Link, um ein neues Passwort festzulegen:</p>
<p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="font-weight:bold;color:#2563eb;">Passwort jetzt zurücksetzen</a></p>
<p>Der Link ist gültig bis <strong>${formattedExpiry}</strong>. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
<p>Viele Grüße<br/>BoardGameTools</p>`,
  });
}
