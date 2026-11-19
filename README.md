# Full-Stack E-Commerce Platform (Monorepo)

A production-grade, fully dynamic e-commerce platform:

- **user-portal/** — customer storefront (Next.js 16)
- **admin-portal/** — complete admin control center (Next.js 16, separate deployment)
- **mobile-capacitor/** — Android/iOS app wrapping the store (Capacitor 6)
- **mobile-flutter/** — fully native mobile app (Flutter, same REST API)

All portals share **one Supabase PostgreSQL database** through one REST API per portal.
No demo data paths, no mocks — real database, real auth (JWT + bcrypt), real payments
(Razorpay with server-side HMAC signature verification).

```
E-commerce/
├── user-portal/            # Customer storefront — deploy to Vercel (Root Directory: user-portal)
│   ├── src/app/api/        # Storefront + account REST API (auth, catalog, cart, orders, payments)
│   ├── src/components/     # store/ + layout/ + shared/ views (hash-router SPA)
│   ├── prisma/             # Schema + seed (categories, products, users, orders, coupons)
│   └── public/brand/       # Default logo / favicon / banners
├── admin-portal/           # Admin console — deploy to Vercel (Root Directory: admin-portal)
│   ├── src/app/api/        # Admin REST API (stats, products, orders, users, coupons, settings, upload)
│   └── src/components/     # admin/ views (dashboard, products, orders, settings…)
├── mobile-capacitor/       # Native shell for the web store (Capacitor)
├── mobile-flutter/         # Native Flutter app (provider + service layer)
└── .zscripts/              # (sandbox-only boot scripts, not part of the repo)
```

## Demo accounts (change after first login)

| Role     | Email               | Password   |
|----------|---------------------|------------|
| Admin    | admin@shoperic.com  | Admin@123  |
| Customer | priya@example.com   | User@123   |

## What the admin controls (everything)

Settings → the everything-control, applied live across both portals:

- **General** — store name, tagline, announcement bar, support contacts, maintenance mode,
  admin-panel URL, store URL (cross-portal links)
- **Branding** — logo, favicon, primary color (applied sitewide at runtime), social links
- **Payments** — Cash on Delivery toggle, Razorpay toggle + API keys (test or live)
- **Shipping** — fee and free-shipping threshold
- **Features** — wishlist / reviews / coupons toggles
- **SEO** — title, meta description, keywords (served via Next.js metadata + JSON-LD)

Plus full CRUD for products (with Supabase Storage image uploads), categories, banners,
coupons; order management with status/payment updates and stock-aware cancellation;
customer management (block/unblock, order stats, lifetime value); dashboard with revenue,
sales chart, low stock and recent orders.

## 1. Push to GitHub

```bash
git init -b main                # (already initialized in this repo)
git add .
git commit -m "E-commerce platform: user portal + admin portal + mobile apps"
git remote add origin https://github.com/gsssparsoli3-hub/E-commerce.git
git push -u origin main         # authenticate with your GitHub account
```

`.env` files are git-ignored — secrets never leave your machine. Set them on Vercel
(see below) instead.

## 2. Deploy on Vercel (two separate projects, one repo)

Create **two** Vercel projects from the same GitHub repo:

### Project 1 — Storefront (user-portal)

1. Vercel → **Add New → Project** → import `gsssparsoli3-hub/E-commerce`
2. **Root Directory**: `user-portal` (Framework preset: Next.js — auto-detected)
3. Environment Variables (Production + Preview):

   ```
   DATABASE_URL      = postgresql://postgres.eixzqeufobqojuuoqnmj:<URL-ENCODED-PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL        = postgresql://postgres.eixzqeufobqojuuoqnmj:<URL-ENCODED-PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   AUTH_SECRET       = <long random string — openssl rand -hex 32>
   ```

4. Deploy. You get the store URL, e.g. `https://ecommerce-user-portal.vercel.app`

### Project 2 — Admin console (admin-portal)

1. Vercel → **Add New → Project** → import the same repo again
2. **Root Directory**: `admin-portal`
3. Environment Variables — same as above **plus** the Supabase Storage keys
   (used for product/banner/branding image uploads):

   ```
   DATABASE_URL              = (same as user-portal)
   DIRECT_URL                = (same as user-portal)
   AUTH_SECRET               = MUST be identical to user-portal (sessions are shared)
   SUPABASE_URL              = https://eixzqeufobqojuuoqnmj.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = sb_secret_...   (Supabase Dashboard → Settings → API)
   ```

4. Deploy. You get the admin URL, e.g. `https://ecommerce-admin-portal.vercel.app`

### 3. Connect the portals

In the admin console → **Settings → General**:

- **Admin panel URL** = your admin deployment URL (e.g. `https://ecommerce-admin-portal.vercel.app`)
  — this makes the "Admin Panel" link appear for admins in the store's account menu.
- **Store URL** = your store deployment URL — used by the admin console's "View Store" button.

> Note: if the database password contains special characters (e.g. `@`), it must be
> URL-encoded in the connection string (`@` → `%40`), or the URL will not parse.
> The transaction pooler (port 6543) requires `?pgbouncer=true` — already included above.

## 4. Payments (Razorpay)

1. Create an account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Settings → API Keys → Generate Test (or Live) Key
3. Admin console → **Settings → Payments** → enable Razorpay, paste Key ID + Secret
4. Checkout → "Pay Online" opens the official Razorpay checkout (UPI / cards / net banking).
   The signature is verified server-side (`HMAC-SHA256(order_id|payment_id)`) before the
   order is marked **PAID** — the same flow used in production.

Cash on Delivery works out of the box (toggleable by the admin).

## 5. Database setup (fresh environment)

The schema and seed live in `user-portal/prisma`. For a new Supabase project:

```bash
cd user-portal
cp .env.example .env       # fill in your Supabase pooler URLs + AUTH_SECRET
bun install                # also runs `prisma generate`
bun run db:push            # creates all tables (idempotent)
bun prisma/seed.ts         # catalogs, users, coupons, banners, settings (optional)
```

Both portals use the same `prisma/schema.prisma` — keep them in sync if you change models
(`db:push` only needs to run from one portal).

## 6. Local development

```bash
# from the repo root
bun run dev          # storefront on http://localhost:3000
bun run dev:admin    # admin console on http://localhost:3001/admin
bun run lint         # eslint for both portals
bun run db:push      # prisma db push (user-portal)
bun run db:seed      # seed the database
```

In local development the storefront proxies `/admin/*` to the admin console, so you can
preview **both portals on one origin**: open `http://localhost:3000` for the store and
`http://localhost:3000/admin` for the admin console (run `dev:admin` too).
On Vercel this proxy is disabled — each portal serves its own domain.

## Mobile apps

- **Capacitor** (`mobile-capacitor/`) — native Android/iOS shell that loads the deployed
  store URL: `bun install`, set `STORE_URL`, `npx cap add android && npx cap sync`.
  See its README.
- **Flutter** (`mobile-flutter/`) — fully native app on the same REST API
  (auth, catalog, reviews, cart, coupons, wishlist, addresses, checkout, orders).
  Set `apiBaseUrl` in `lib/config.dart`, then `flutter pub get && flutter run`.
  See its README.

## Architecture notes

- **Stack** — Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui,
  Prisma + Supabase PostgreSQL, Zustand, Recharts (admin), jose (JWT), bcryptjs
- **Auth** — bcrypt password hashing + JWT (HS256) in httpOnly cookies for the web;
  the same API accepts `Authorization: Bearer <token>` for the Flutter app.
  `AUTH_SECRET` must match across portals.
- **Money** — integer paise everywhere (₹499 = 49900); formatted with Indian digit grouping
- **Integrity** — prices, stock, coupons and totals are recomputed server-side on order
  placement; stock decrements are transactional; admin APIs require the ADMIN role
- **Uploads** — images go to a public `uploads` bucket in Supabase Storage (auto-created);
  a local-disk fallback exists for development without Supabase env vars
- **SEO** — dynamic `<title>`/meta from DB settings, OpenGraph/Twitter cards, robots.txt,
  Organization + Product JSON-LD, semantic HTML, accessible controls
- **SPA routing** — hash-based router keeps each portal on `/` while supporting deep links
  (`#/shop?category=fashion`, `#/product/slug`, admin `#/admin/orders`)
- **Modularity** — every component is small and focused; portals share one database but
  deploy, scale and fail independently
