const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local from the parent directory (root)
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const env = {};
lines.forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', url);
console.log('Key length:', key ? key.length : 0);

if (!url || !key) {
    console.error('Missing env');
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log('Listing users...');
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Users found:', data.users.length);
        data.users.forEach(u => console.log('- ', u.email));
    }
}

test();
