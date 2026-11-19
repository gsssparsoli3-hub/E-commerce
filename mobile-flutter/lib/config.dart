/// Central configuration for the Shoperic mobile app.
///
/// Point [apiBaseUrl] at your Shoperic deployment. It must include the `/api`
/// prefix and must NOT end with a slash, e.g. `https://shop.example.com/api`.
const String apiBaseUrl = 'https://your-store-domain.com/api';

/// Public URL of the web store (no trailing slash).
///
/// Used for flows that are web-only for now, e.g. completing a Razorpay
/// online payment that was started from the app.
const String storeUrl = 'https://your-store-domain.com';
