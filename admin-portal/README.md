# Admin Portal (Control Center)

Standalone Next.js 16 admin console for the e-commerce platform. Deployed separately
from the storefront; both share one Supabase PostgreSQL database.

- Dashboard: revenue, 14-day sales chart, order status breakdown, low stock, recent orders
- Products / Categories / Banners / Coupons: full CRUD with image uploads (Supabase Storage)
- Orders: search & filter, status + payment updates, stock-aware cancellation
- Customers: order stats, lifetime value, block/unblock
- Settings: branding (logo/favicon/primary color), payments (COD/Razorpay keys),
  shipping, feature toggles (wishlist/reviews/coupons/maintenance), SEO,
  admin-panel URL & store URL (cross-portal links)

Sign in with an ADMIN account (seeded: `admin@shoperic.com / Admin@123` — change it).

## Run

```bash
cp .env.example .env   # Supabase pooler URLs + AUTH_SECRET + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
bun install
bun run dev            # http://localhost:3001/admin
```

In local development the storefront (../user-portal) proxies `/admin/*` here, so the
console is also reachable at `http://localhost:3000/admin`.

## Deploy (Vercel)

Root Directory: `admin-portal`. Set `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`
(identical to user-portal) plus `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
(for image uploads to Supabase Storage).

The portal serves from `/` on Vercel and from `/admin` in local development
(`next.config.ts` handles this automatically via the `VERCEL` env var).

See the repo root README for the full deployment guide.
