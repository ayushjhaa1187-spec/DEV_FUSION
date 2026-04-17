const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function test() {
    console.log('Querying non-student profiles...');
    const { data, error } = await supabase.from('profiles').select('username, role, full_name').neq('role', 'student');
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Profiles found:', data.length);
        data.forEach(p => console.log('- ', p.username, '(', p.role, ')'));
    }
}

test();
