const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const result = dotenv.config({ path: '.env.local' });

if (result.error) {
  console.error('Dotenv error:', result.error);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Env Verification ---');
console.log('URL:', url);
console.log('Key Length:', key ? key.length : 0);
console.log('Key starts with:', key ? key.substring(0, 10) : 'N/A');

if (!url || !key) {
  console.error('Missing variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log('Connecting to Supabase...');
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Supabase Auth Error:', error.message);
  } else {
    console.log('Connection Successful! Users:', data.users.length);
  }
}

check();
