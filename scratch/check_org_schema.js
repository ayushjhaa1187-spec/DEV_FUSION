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

async function checkSchema() {
    console.log('Fetching sample record from organizations...');
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching orgs:', error.message);
    } else {
        console.log('Sample Data (keys):', data.length > 0 ? Object.keys(data[0]) : 'No records found to introspect.');
    }
    
    console.log('Checking columns via RPC (if available) or raw select...');
    // If we can't get a sample, it's hard to know the columns without Postgres introspection.
}

checkSchema();
