import { createClient as createBrowserSupabaseClient } from '@/utils/supabase/client';
import { isSupabaseConfigured } from '@/utils/supabase/config';

export { isSupabaseConfigured };

let browserClient;

/** Singleton browser client for client components (LiveChat, Live page). */
export function getSupabase() {
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }
  return browserClient;
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabase();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);

if (!isSupabaseConfigured() && typeof window !== 'undefined') {
  console.warn(
    'Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).'
  );
}
