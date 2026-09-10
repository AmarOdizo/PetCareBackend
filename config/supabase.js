const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase URL or Key is missing. Check your .env file or Cloudflare env vars.");
    }

    supabase = createClient(supabaseUrl || '', supabaseKey || '');
  }
  return supabase;
}

// Return a proxy that lazily initializes the client on first property access.
// This way, require('./config/supabase') still works like before, but the
// client is not created until it is actually used (by which time Cloudflare
// env vars have been injected into process.env by worker.js).
module.exports = new Proxy({}, {
  get: function (_target, prop) {
    return getSupabase()[prop];
  }
});
