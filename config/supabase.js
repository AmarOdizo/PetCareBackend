const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Key is missing. Check your .env file.");
}

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

module.exports = supabase;
