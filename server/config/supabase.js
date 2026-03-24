const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;

    if (!url || url === 'YOUR_SUPABASE_URL_HERE') {
      throw new Error(
        '\n\n❌ SUPABASE_URL is not configured!\n' +
        'Please set your Supabase URL in server/.env\n' +
        'Find it at: Supabase Dashboard → Settings → API → Project URL\n'
      );
    }
    if (!key || key === 'YOUR_SUPABASE_ANON_KEY_HERE') {
      throw new Error(
        '\n\n❌ SUPABASE_KEY is not configured!\n' +
        'Please set your Supabase anon key in server/.env\n' +
        'Find it at: Supabase Dashboard → Settings → API → anon public key\n'
      );
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

module.exports = getSupabase;
