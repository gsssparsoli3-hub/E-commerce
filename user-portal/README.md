# User Portal (Storefront)

Customer-facing Next.js 16 storefront for the e-commerce platform.

- Home: hero carousel (admin-managed banners), categories, featured picks, best sellers
- Shop: search, category/price/rating filters, sorting, pagination — all server-side
- Product: image gallery, stock, ratings & reviews, related products
- Cart: quantity management, coupon codes, free-shipping progress
- Checkout: saved addresses, Cash on Delivery + Razorpay online payments
- Orders: status timeline, invoice-style totals, self-service cancellation
- Wishlist, profile, address book, password change, dark mode, mobile bottom nav

## Run

```bash
cp .env.example .env   # Supabase pooler URLs + AUTH_SECRET
bun install
bun run db:push        # create/sync tables (first time only)
bun prisma/seed.ts     # optional seed (catalog, users, coupons, settings)
bun run dev            # http://localhost:3000
```

## Deploy (Vercel)

Root Directory: `user-portal`. Set `DATABASE_URL`, `DIRECT_URL` and `AUTH_SECRET`
(must match admin-portal so sessions are shared across portals).

See the repo root README for the full deployment guide.
