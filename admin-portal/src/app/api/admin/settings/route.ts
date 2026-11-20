import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { serializeSettings } from "@/lib/serializers";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// GET /api/admin/settings — full settings incl. gateway keys presence
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    let setting = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (!setting) setting = await db.siteSetting.create({ data: { id: "singleton" } });
    return json({
      settings: serializeSettings(setting),
      hasRazorpayKeys: Boolean(setting.razorpayKeyId && setting.razorpayKeySecret),
      hasWebhookSecret: Boolean(setting.razorpayWebhookSecret),
      hasSMTP: Boolean(setting.smtpHost && setting.smtpUser && setting.smtpPass),
    });
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/admin/settings — update any subset of settings
export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const body = await req.json();
    const data: Record<string, unknown> = {};

    const strings = [
      "siteName", "tagline", "announcement", "supportEmail", "supportPhone",
      "seoTitle", "seoDescription", "seoKeywords",
    ] as const;
    for (const key of strings) {
      if (body[key] !== undefined) data[key] = body[key] === "" || body[key] === null ? (key === "siteName" || key === "tagline" ? undefined : null) : String(body[key]).trim();
    }

    if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl ? String(body.logoUrl) : null;
    if (body.faviconUrl !== undefined) data.faviconUrl = body.faviconUrl ? String(body.faviconUrl) : null;
    if (body.adminUrl !== undefined) data.adminUrl = String(body.adminUrl).trim() || null;
    if (body.storeUrl !== undefined) data.storeUrl = String(body.storeUrl).trim() || null;
    if (body.primaryColor !== undefined) {
      const color = String(body.primaryColor);
      if (!HEX_COLOR.test(color)) return badRequest("Primary color must be a hex value like #ea580c");
      data.primaryColor = color.toLowerCase();
    }

    const booleans = [
      "codEnabled", "razorpayEnabled", "wishlistEnabled", "reviewsEnabled",
      "couponsEnabled", "maintenanceMode",
    ] as const;
    for (const key of booleans) {
      if (body[key] !== undefined) data[key] = body[key] === true;
    }

    if (body.shippingFee !== undefined) data.shippingFee = Math.max(0, Math.round(Number(body.shippingFee) || 0));
    if (body.freeShippingAbove !== undefined) data.freeShippingAbove = Math.max(0, Math.round(Number(body.freeShippingAbove) || 0));

    if (body.razorpayKeyId !== undefined) data.razorpayKeyId = String(body.razorpayKeyId).trim() || null;
    if (body.razorpayKeySecret !== undefined) data.razorpayKeySecret = String(body.razorpayKeySecret).trim() || null;
    if (body.razorpayWebhookSecret !== undefined) data.razorpayWebhookSecret = String(body.razorpayWebhookSecret).trim() || null;

    // SMTP (email) settings
    if (body.smtpHost !== undefined) data.smtpHost = String(body.smtpHost).trim() || null;
    if (body.smtpPort !== undefined) data.smtpPort = Math.round(Number(body.smtpPort)) || 587;
    if (body.smtpUser !== undefined) data.smtpUser = String(body.smtpUser).trim() || null;
    if (body.smtpPass !== undefined) data.smtpPass = String(body.smtpPass) || null;
    if (body.smtpFrom !== undefined) data.smtpFrom = String(body.smtpFrom).trim() || null;

    if (body.social !== undefined && typeof body.social === "object") {
      data.socialJson = JSON.stringify(body.social);
    }

    // Never allow empty site name
    if (data.siteName === undefined || data.siteName === "") delete data.siteName;

    const setting = await db.siteSetting.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });
    return json({
      settings: serializeSettings(setting),
      hasRazorpayKeys: Boolean(setting.razorpayKeyId && setting.razorpayKeySecret),
      hasWebhookSecret: Boolean(setting.razorpayWebhookSecret),
      hasSMTP: Boolean(setting.smtpHost && setting.smtpUser && setting.smtpPass),
    });
  } catch (error) {
    return serverError(error);
  }
}
