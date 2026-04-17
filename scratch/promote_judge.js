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

async function promote() {
    console.log('Logging in as judge@skillbridge.edu...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'judge@skillbridge.edu',
        password: 'skillbridge2026'
    });

    if (authError) {
        console.error('Auth Error:', authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log('Logged in! User ID:', userId);

    console.log('Attempting to update role to organization...');
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'organization' })
        .eq('id', userId)
        .select();

    if (error) {
        console.error('Update Error:', error.message);
    } else {
        console.log('Update Success!', data);
        
        console.log('Initializing Organization record...');
        const { error: orgError } = await supabase
            .from('organizations')
            .upsert({
                id: userId,
                admin_id: userId,
                name: 'SkillBridge Test Org',
                slug: 'skillbridge-test-org',
                is_verified: true,
                plan: 'campus_starter'
            });
            
        if (orgError) {
            console.error('Org Init Error:', orgError.message);
        } else {
            console.log('Organization Initialized Successfully!');
        }
    }
}

promote();
