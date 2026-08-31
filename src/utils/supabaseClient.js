import { createClient } from '@supabase/supabase-js'

// These are Supabase browser-safe values (publishable/anon key).
// Keeping them here means Vercel does not require environment variables.
const url = 'https://adffavfmftrdxllxpsav.supabase.co'
const key = 'sb_publishable_sGVkQfc6MgG_9pl9Ypkysw_q-S_XHGn'

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
