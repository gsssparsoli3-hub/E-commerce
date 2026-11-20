import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/payments/test-connection
 * Validates the saved Razorpay key pair by hitting the gateway's
 * /v1/orders endpoint with a tiny test amount. Returns the key mode
 * (test/live) inferred from the key ID prefix.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const settings = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (!settings?.razorpayKeyId || !settings?.razorpayKeySecret) {
      return json({ ok: false, mode: null, error: "Razorpay keys are not configured. Add your Key ID and Secret in the Payments tab first." });
    }

    const auth = Buffer.from(`${settings.razorpayKeyId}:${settings.razorpayKeySecret}`).toString("base64");
    // Create a 1-rupee test order — the lightest possible gateway call.
    const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount: 100, currency: "INR", receipt: `test-${Date.now()}` }),
    });

    const mode = settings.razorpayKeyId.startsWith("rzp_live_") ? "live" : settings.razorpayKeyId.startsWith("rzp_test_") ? "test" : "unknown";

    if (rpRes.ok) {
      return json({ ok: true, mode, message: `Connected successfully — your keys are valid (${mode} mode).` });
    }

    const errBody = (await rpRes.json().catch(() => ({}))) as { error?: { description?: string } };
    const message = errBody.error?.description ?? `Gateway rejected the keys (HTTP ${rpRes.status})`;
    return json({ ok: false, mode, error: message });
  } catch (error) {
    return serverError(error);
  }
}
