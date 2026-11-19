/**
 * One-time data migration: SQLite (db/custom.db) → Supabase Postgres.
 *
 * Prerequisites: `bun run db:push` (creates the Postgres schema)
 * Run:           bun scripts/migrate-to-postgres.ts
 * Re-run:        FORCE=1 bun scripts/migrate-to-postgres.ts  (wipes target first)
 *
 * Preserves every row and every original id/timestamp, so the admin
 * dashboard, orders history and accounts survive the migration intact.
 */
import { Database } from "bun:sqlite";
import { PrismaClient } from "@prisma/client";

const sqlite = new Database("/home/z/my-project/db/custom.db", { readonly: true });
const pg = new PrismaClient();

const TABLES = [
  "User", "Address", "Category", "Product", "Review", "CartItem",
  "WishlistItem", "Order", "OrderItem", "Coupon", "Banner", "SiteSetting",
] as const;

/** Columns stored as 0/1 in SQLite that are Booleans in Prisma. */
const BOOL_COLS: Record<string, string[]> = {
  Address: ["isDefault"],
  Product: ["featured"],
  SiteSetting: [
    "codEnabled", "razorpayEnabled", "wishlistEnabled",
    "reviewsEnabled", "couponsEnabled", "maintenanceMode",
  ],
};

/** Date columns that may legitimately stay null. */
const NULLABLE_DATES = new Set(["expiresAt"]);

/** DateTime columns per table (SQLite stores them as epoch-ms integers or TEXT). */
const DATE_COLS: Record<string, string[]> = {
  User: ["createdAt", "updatedAt"],
  Address: ["createdAt"],
  Category: ["createdAt", "updatedAt"],
  Product: ["createdAt", "updatedAt"],
  Review: ["createdAt"],
  CartItem: ["createdAt"],
  WishlistItem: ["createdAt"],
  Order: ["createdAt", "updatedAt"],
  Coupon: ["expiresAt", "createdAt", "updatedAt"],
  Banner: ["createdAt", "updatedAt"],
  SiteSetting: ["updatedAt"],
};

function toBool(v: unknown): boolean {
  return v === 1 || v === true || v === "1" || v === "true";
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v); // epoch millis (integer storage)
  const s = String(v).trim().replace(" ", "T");
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  return new Date(s + "Z"); // Prisma TEXT datetimes are UTC
}

function adapt(table: string, r: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...r };
  for (const c of BOOL_COLS[table] ?? []) {
    if (c in out) out[c] = toBool(out[c]);
  }
  for (const c of DATE_COLS[table] ?? []) {
    if (!(c in out)) continue;
    const v = out[c];
    if (v == null) {
      // Safety: never send null into a required timestamp column
      out[c] = NULLABLE_DATES.has(c) ? null : new Date();
    } else {
      out[c] = toDate(v);
    }
  }
  return out;
}

function rows(table: string): Record<string, unknown>[] {
  return sqlite.query(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
}

async function main() {
  const existing = await pg.user.count();
  if (existing > 0 && !process.env.FORCE) {
    console.log(`Target DB already has ${existing} users — aborting. Use FORCE=1 to overwrite.`);
    return;
  }
  if (process.env.FORCE) {
    console.log("FORCE=1 — wiping target tables…");
    await pg.orderItem.deleteMany();
    await pg.order.deleteMany();
    await pg.review.deleteMany();
    await pg.cartItem.deleteMany();
    await pg.wishlistItem.deleteMany();
    await pg.product.deleteMany();
    await pg.category.deleteMany();
    await pg.coupon.deleteMany();
    await pg.banner.deleteMany();
    await pg.address.deleteMany();
    await pg.user.deleteMany();
    await pg.siteSetting.deleteMany();
  }

  const before: Record<string, number> = {};
  for (const t of TABLES) before[t] = rows(t).length;

  // Insert in FK-safe order (parents first); ids are preserved verbatim.
  const insert = async (table: string, fn: (data: never[]) => Promise<unknown>) => {
    const data = rows(table).map((r) => adapt(table, r)) as never[];
    if (data.length) await fn(data);
  };

  await insert("User", (d) => pg.user.createMany({ data: d }));
  await insert("Address", (d) => pg.address.createMany({ data: d }));
  await insert("Category", (d) => pg.category.createMany({ data: d }));
  await insert("Product", (d) => pg.product.createMany({ data: d }));
  await insert("Review", (d) => pg.review.createMany({ data: d }));
  await insert("CartItem", (d) => pg.cartItem.createMany({ data: d }));
  await insert("WishlistItem", (d) => pg.wishlistItem.createMany({ data: d }));
  await insert("Coupon", (d) => pg.coupon.createMany({ data: d }));
  await insert("Banner", (d) => pg.banner.createMany({ data: d }));
  await insert("Order", (d) => pg.order.createMany({ data: d }));
  await insert("OrderItem", (d) => pg.orderItem.createMany({ data: d }));
  await insert("SiteSetting", (d) => pg.siteSetting.createMany({ data: d }));

  // Verify counts
  const after: Record<string, number> = {
    User: await pg.user.count(),
    Address: await pg.address.count(),
    Category: await pg.category.count(),
    Product: await pg.product.count(),
    Review: await pg.review.count(),
    CartItem: await pg.cartItem.count(),
    WishlistItem: await pg.wishlistItem.count(),
    Order: await pg.order.count(),
    OrderItem: await pg.orderItem.count(),
    Coupon: await pg.coupon.count(),
    Banner: await pg.banner.count(),
    SiteSetting: await pg.siteSetting.count(),
  };

  let ok = true;
  console.log("\nTable             SQLite → Postgres");
  for (const t of TABLES) {
    const match = before[t] === after[t];
    if (!match) ok = false;
    console.log(
      `${t.padEnd(16)} ${String(before[t]).padStart(5)} → ${String(after[t]).padStart(5)}  ${match ? "OK" : "MISMATCH"}`
    );
  }
  console.log(ok ? "\nMigration complete — all rows copied." : "\nMISMATCH detected — check above.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pg.$disconnect());
