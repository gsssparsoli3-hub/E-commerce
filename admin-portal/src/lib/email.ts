import nodemailer from "nodemailer";
import { db } from "./db";

/**
 * Provider-agnostic email service. SMTP credentials live in SiteSetting
 * (configured from Admin → Settings → Email). When SMTP is not configured
 * the call is a safe no-op (logs a warning) so flows never break in dev.
 */

type EmailInput = {
  to: string;
  subject: string;
  /** Inner HTML content — wrapped in the branded template automatically. */
  html: string;
};

export async function smtpConfigured(): Promise<boolean> {
  const s = await db.siteSetting.findUnique({ where: { id: "singleton" } });
  return Boolean(s?.smtpHost && s?.smtpUser && s?.smtpPass);
}

export async function sendEmail(input: EmailInput): Promise<boolean> {
  try {
    const s = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (!s?.smtpHost || !s?.smtpUser || !s?.smtpPass) {
      console.warn(`[email] SMTP not configured — skipped "${input.subject}" to ${input.to}`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: s.smtpHost,
      port: s.smtpPort ?? 587,
      secure: (s.smtpPort ?? 587) === 465,
      auth: { user: s.smtpUser, pass: s.smtpPass },
    });

    await transporter.sendMail({
      from: s.smtpFrom || s.smtpUser,
      to: input.to,
      subject: input.subject,
      html: wrapTemplate(input.subject, input.html),
    });
    return true;
  } catch (error) {
    console.error("[email] send failed:", error);
    return false;
  }
}

/** Branded email wrapper — consistent look for every transactional email. */
function wrapTemplate(subject: string, inner: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <div style="background:#ea580c;padding:20px 28px;">
      <span style="color:#ffffff;font-size:20px;font-weight:800;">Shoperic</span>
    </div>
    <div style="padding:28px;color:#1a1a1a;font-size:14px;line-height:1.6;">
      ${inner}
    </div>
    <div style="padding:18px 28px;background:#f9fafb;border-top:1px solid #eee;color:#6b7280;font-size:11px;text-align:center;">
      This is an automated message from Shoperic. Please do not reply to this email.
    </div>
  </div>
</body></html>`;
}

/** Helper to build a primary-action button for emails. */
export function emailButton(url: string, label: string): string {
  return `<p style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:#ea580c;color:#ffffff;padding:12px 28px;border-radius:24px;font-weight:700;text-decoration:none;">${label}</a>
  </p>
  <p style="text-align:center;font-size:12px;color:#6b7280;word-break:break-all;">Or paste this link: ${url}</p>`;
}
