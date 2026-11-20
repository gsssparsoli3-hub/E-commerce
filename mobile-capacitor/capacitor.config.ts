import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Base URL of the deployed Shoperic Next.js store.
 * Override with the STORE_URL environment variable (see .env.example).
 */
const STORE_URL = process.env.STORE_URL ?? 'https://shoperic-store.vercel.app';

const STORE_HOST = new URL(STORE_URL).hostname;

const config: CapacitorConfig = {
  appId: 'com.shoperic.app',
  appName: 'Shoperic',
  webDir: 'www',
  server: {
    url: STORE_URL,
    cleartext: false,
    allowNavigation: [
      // Store domain (and any of its subdomains)
      STORE_HOST,
      `*.${STORE_HOST}`,
      // Razorpay checkout flow (opens in an in-app browser window)
      'checkout.razorpay.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#ea580c',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ea580c',
    },
  },
};

export default config;
