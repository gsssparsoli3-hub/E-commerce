import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, notFound, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";
import { formatINR, formatDateTime } from "@/lib/format";

/**
 * GET /api/orders/[id]/invoice — returns a self-contained HTML invoice
 * suitable for printing to PDF (browser print dialog). Customer's own order only.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const order = await db.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }], userId: user.id },
      include: { items: true },
    });
    if (!order) return notFound("Order not found");

    const settings = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    const siteName = settings?.siteName ?? "Store";
    const supportEmail = settings?.supportEmail ?? "support@shoperic.com";
    const supportPhone = settings?.supportPhone ?? "";

    const addr = JSON.parse(order.addressJson || "{}") as Record<string, string>;

    const itemsRows = order.items.map((it) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(it.name)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatINR(it.price)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatINR(it.price * it.quantity)}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${order.orderNumber}</title>
    <style>
      *{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;box-sizing:border-box}
      body{margin:0;padding:40px;color:#1a1a1a;background:#f5f5f5}
      .invoice{max-width:720px;margin:0 auto;background:#fff;padding:40px;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
      .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #ea580c;padding-bottom:16px;margin-bottom:24px}
      .brand{font-size:24px;font-weight:800;color:#ea580c}
      .muted{color:#666;font-size:13px}
      h1{font-size:20px;margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
      th{text-align:left;padding:8px;background:#f9fafb;border-bottom:2px solid #eee;font-size:11px;text-transform:uppercase;color:#888}
      th.r,td.r{text-align:right}
      th.c,td.c{text-align:center}
      .totals{margin-left:auto;width:280px;font-size:14px}
      .totals div{display:flex;justify-content:space-between;padding:6px 0}
      .totals .grand{border-top:2px solid #1a1a1a;margin-top:8px;padding-top:10px;font-weight:800;font-size:18px}
      .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#f0fdf4;color:#15803d}
      .footer{margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center}
      @media print{body{background:#fff;padding:0}.invoice{box-shadow:none;border-radius:0;padding:20px}}
    </style></head>
    <body><div class="invoice">
      <div class="head">
        <div>
          <div class="brand">${escapeHtml(siteName)}</div>
          <div class="muted">${escapeHtml(supportEmail)}${supportPhone ? " · " + escapeHtml(supportPhone) : ""}</div>
        </div>
        <div style="text-align:right">
          <h1>Invoice</h1>
          <div class="muted"><strong>${order.orderNumber}</strong></div>
          <div class="muted">${formatDateTime(order.createdAt)}</div>
          <span class="badge">${order.status}</span>
        </div>
      </div>
      <div style="display:flex;gap:32px;margin-bottom:16px">
        <div style="flex:1">
          <div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Billed to</div>
          <div style="font-weight:600">${escapeHtml(addr.fullName ?? user.name)}</div>
          <div class="muted">${escapeHtml(addr.phone ?? "")}</div>
          <div class="muted">${escapeHtml(addr.line1 ?? "")}${addr.line2 ? ", " + escapeHtml(addr.line2) : ""}</div>
          <div class="muted">${escapeHtml(addr.city ?? "")}, ${escapeHtml(addr.state ?? "")} — ${escapeHtml(addr.pincode ?? "")}</div>
        </div>
        <div style="flex:1">
          <div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Payment</div>
          <div style="font-weight:600">${order.paymentMethod}</div>
          <div class="muted">${order.paymentStatus}${order.paymentId ? " · " + escapeHtml(order.paymentId) : ""}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="totals">
        <div><span class="muted">Subtotal</span><span>${formatINR(order.subtotal)}</span></div>
        ${order.discount > 0 ? `<div style="color:#15803d"><span>Discount${order.couponCode ? " (" + escapeHtml(order.couponCode) + ")" : ""}</span><span>−${formatINR(order.discount)}</span></div>` : ""}
        <div><span class="muted">Shipping</span><span>${order.shipping === 0 ? "FREE" : formatINR(order.shipping)}</span></div>
        <div class="grand"><span>Total Paid</span><span>${formatINR(order.total)}</span></div>
      </div>
      <div class="footer">
        Thank you for shopping with ${escapeHtml(siteName)}! This is a computer-generated invoice and does not require a signature.
      </div>
    </div>
    <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
    </body></html>`;

    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    return serverError(error);
  }
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
