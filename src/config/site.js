/** Canonical production URL. */
export const LIVE_APP_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL?.trim()) ||
  'https://apt-casino-0g-production.up.railway.app/';
