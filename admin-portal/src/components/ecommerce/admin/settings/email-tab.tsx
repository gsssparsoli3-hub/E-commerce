"use client";

import { AlertCircle, BadgeCheck, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "./field";

/** SMTP form state — credentials are never echoed back; blank fields keep the saved values. */
export type SMTPForm = {
  host: string;
  port: string;
  user: string;
  pass: string;
  from: string;
};

/** Email tab — SMTP config for transactional emails (order lifecycle + password reset). */
export function EmailTab({
  smtp,
  setSmtp,
  hasSMTP,
}: {
  smtp: SMTPForm;
  setSmtp: (v: SMTPForm) => void;
  hasSMTP: boolean;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          {/* Status indicator */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
            <span className="font-semibold">Email status:</span>
            {hasSMTP ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <BadgeCheck className="h-3 w-3" /> Configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <AlertCircle className="h-3 w-3" /> Not configured
              </span>
            )}
            <span className="text-muted-foreground">
              {hasSMTP
                ? "· order lifecycle + password reset emails are being sent"
                : "· order lifecycle + password reset emails are currently skipped"}
            </span>
          </div>

          <div className="grid gap-4 rounded-xl border border-dashed p-4 sm:grid-cols-2">
            <Field label="SMTP Host">
              <Input
                value={smtp.host}
                onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="font-mono"
              />
            </Field>
            <Field label="SMTP Port">
              <Input
                type="number"
                min="0"
                value={smtp.port}
                onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                placeholder="587"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">465 for SSL, 587 for TLS</p>
            </Field>
            <Field label="SMTP Username">
              <Input
                value={smtp.user}
                onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                placeholder="you@yourdomain.com"
                className="font-mono"
              />
            </Field>
            <Field label={`SMTP Password ${hasSMTP ? "(saved — leave blank to keep)" : ""}`}>
              <Input
                type="password"
                value={smtp.pass}
                onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                placeholder={hasSMTP ? "••••••••" : "Enter your SMTP password (or app password)"}
                className="font-mono"
              />
            </Field>
            <Field label="From Address" className="sm:col-span-2">
              <Input
                value={smtp.from}
                onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
                placeholder="Shoperic <orders@shoperic.com>"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                How the sender appears in customer inboxes — falls back to the SMTP username when empty.
              </p>
            </Field>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Provider-agnostic: Gmail, Amazon SES, Brevo, Resend SMTP, Mailgun, SendGrid — any SMTP provider
            works. Once configured, customers automatically get emails when an order is placed, payment is
            received, the parcel ships (with tracking), is delivered, or is cancelled/refunded.
          </p>
        </CardContent>
      </Card>

      {/* Setup guide */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold">Email setup guide</h3>
          </div>
          <ol className="space-y-2.5 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
              <div>
                <p className="font-medium">Choose a provider</p>
                <p className="text-xs text-muted-foreground">
                  Gmail (with an App Password), Amazon SES, Brevo, Resend SMTP — any SMTP provider works.
                  Transactional providers like SES/Brevo give better deliverability than personal Gmail.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
              <div>
                <p className="font-medium">Get your SMTP credentials</p>
                <p className="text-xs text-muted-foreground">
                  From the provider dashboard, note the <span className="font-mono">host</span>,{" "}
                  <span className="font-mono">port</span>, <span className="font-mono">username</span> and{" "}
                  <span className="font-mono">password</span>.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
              <div>
                <p className="font-medium">Paste here &amp; Save</p>
                <p className="text-xs text-muted-foreground">
                  Fill the fields above, then click <span className="font-medium">Save all changes</span>.
                  Credentials are stored in the database and used only server-side — the password is never
                  shown again after saving.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
              <div>
                <p className="font-medium">Emails send automatically</p>
                <p className="text-xs text-muted-foreground">
                  Order emails (placed, payment confirmed, shipped with tracking, delivered, cancelled) and
                  password reset emails go out on their own — no further setup needed.
                </p>
              </div>
            </li>
          </ol>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="font-semibold">Gmail tip</p>
            <p className="mt-0.5">
              Gmail: enable 2FA on your Google account, create an App Password
              (myaccount.google.com → Security → App passwords), then use host{" "}
              <span className="font-mono">smtp.gmail.com</span> and port <span className="font-mono">587</span>.
              Your Gmail address is the username and the 16-character App Password is the password.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
