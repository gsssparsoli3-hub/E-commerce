# Shoperic Mobile App (Flutter)

A native mobile storefront for **Shoperic**, built with Flutter. It talks to
the Shoperic Next.js REST API (mounted under `/api`) and covers the full
shopping flow: browsing, search, product details, reviews, cart, coupons,
wishlist, addresses, checkout (Cash on Delivery) and order management.

## Features

- **Auth** — register / login with email + password (JWT bearer token),
  profile editing and password change.
- **Catalog** — categories, search, sort (newest, popular, price, rating,
  discount), paginated grid with load-more, product details with image
  carousel, stock status and related products.
- **Reviews** — read published reviews and write your own (1-5 stars).
- **Cart** — quantity steppers, remove, coupon validation and live totals
  with free-shipping thresholds.
- **Wishlist** — one-tap add/remove from any product card or detail page.
- **Checkout** — saved address selection (with add/delete), COD and a
  Razorpay option (online payment is completed on the web store for now).
- **Orders** — full history with color-coded status chips, expandable
  details and cancellation while the order is still PLACED/CONFIRMED.

## Architecture

The app uses **provider** for state management on top of a thin **service
layer**:

```
lib/
├── config.dart              # apiBaseUrl / storeUrl constants
├── main.dart                # MultiProvider + MaterialApp (M3, light/dark)
├── models/                  # JSON models (Product, Order, User, ...)
├── services/api_service.dart# Single HTTP client for every endpoint
├── providers/               # ChangeNotifiers (state)
│   ├── auth_provider.dart   #   session + bearer token injection
│   ├── settings_provider.dart#  store settings + brand color
│   ├── catalog_provider.dart#   categories, home shelves, shop listing
│   └── cart_provider.dart   #   cart items, coupon, totals (paise math)
├── screens/                 # One file per screen (see list below)
└── widgets/                 # Reusable + feature widgets
```

A single `ApiService` instance is shared by all providers. `AuthProvider`
injects the bearer token into it after login, so every request is
authenticated automatically. All API failures surface as `ApiException`
with a user-friendly message that screens render via snackbars or
retry-able error states.

### Screens

| Screen | Purpose |
| --- | --- |
| `SplashPage` | Loads settings, then routes to home or auth |
| `AuthPage` | Login / Register tabs |
| `HomeShell` | Bottom navigation (Home, Shop, Cart, Wishlist, Account) with cart badge |
| `HomePage` | Announcement bar, category chips, Featured Picks, Bestsellers |
| `ShopPage` | Search, category chips, sort dropdown, paginated grid |
| `ProductDetailPage` | Carousel, pricing, quantity, Add to Cart / Buy Now, reviews, related |
| `CartPage` | Item steppers, coupon field, totals card, checkout CTA |
| `CheckoutPage` | Address radio list + add form, payment method, summary, Place Order |
| `OrdersPage` | Order history with expandable cards and cancel |
| `WishlistPage` | Grid of saved products |
| `AccountPage` | Profile edit, password change, addresses, logout |

## Getting started

### Prerequisites

- Flutter SDK >= 3.3 (Dart >= 3.3)
- A running Shoperic backend (the Next.js app) reachable from your device
  or emulator. For Android emulators use `http://10.0.2.2:3000/api` instead
  of `localhost`.

### Setup

1. Install dependencies:

   ```bash
   flutter pub get
   ```

2. Configure the API endpoint in [`lib/config.dart`](lib/config.dart):

   ```dart
   const String apiBaseUrl = 'https://your-store-domain.com/api';
   const String storeUrl = 'https://your-store-domain.com';
   ```

3. Run the app:

   ```bash
   flutter run
   ```

### Building for release

```bash
# Android APK
flutter build apk --release

# Android App Bundle (for Play Store)
flutter build appbundle --release

# iOS (requires macOS + Xcode)
flutter build ios --release
```

To sign the Android build, edit `android/key.properties` and the signing
configs in `android/app/build.gradle` (standard Flutter process — run
`flutter create .` inside `mobile-flutter` once to generate the
`android/` and `ios/` runner folders).

## Notes for developers

- **Authentication** — the app authenticates with
  `Authorization: Bearer <token>` headers. The token is returned by
  `/api/auth/login` and `/api/auth/register` and is kept in memory only
  (no persistence by design), so a cold start always begins at the login
  screen. To persist sessions, add `shared_preferences` and restore the
  token before `SplashPage` routes.
- **Prices are integer paise** — the API returns rupees x 100 (e.g.
  `129900` = ₹1,299). Always format money with `ApiService.formatINR`
  (or the `PriceText` widget), which renders Indian comma grouping
  (`₹12,99,999`) and appends paise only when needed.
- **Razorpay** — COD is fully supported. Selecting Razorpay places the
  order and shows a "complete payment on the web store" fallback. To wire
  up native payments, add the `razorpay_flutter` dependency and use the
  `{ keyId, orderId, amount }` payload already returned by
  `POST /api/orders`.
- **Order status colors** — PLACED (blue), CONFIRMED (purple), SHIPPED
  (amber), DELIVERED (green), CANCELLED (red) — see
  `lib/models/order.dart`.
