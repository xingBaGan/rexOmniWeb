/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_STRIPE_PRICE_ID_MONTHLY: string;
  readonly VITE_STRIPE_PRICE_ID_ANNUAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

