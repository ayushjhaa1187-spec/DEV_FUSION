const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xrbkoizxipphccxszbrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmtvaXp4aXBwaGNjeHN6YnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc1NDY2NSwiZXhwIjoyMDkxMzMwNjY1fQ.6dYZXHh4-MJleXyF0S3SEhsEOJvFLXvZc_jAwn4TOaE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepDive() {
    // 1. Check Subscriptions Schema via RPC or a trick (select with non-existent column to see error)
    console.log('--- Checking Subscriptions Structure ---');
    const { error: subError } = await supabase.from('subscriptions').select('razorpay_plan_id').limit(1);
    if (subError) console.error('razorpay_plan_id Column Check:', subError.message);
    else console.log('razorpay_plan_id Column EXISTS');

    const { error: subError2 } = await supabase.from('subscriptions').select('plan').limit(1);
    if (subError2) console.error('plan Column Check:', subError2.message);
    else console.log('plan Column EXISTS');

    // 2. Check current user's role and applications
    console.log('\n--- Checking User and Applications ---');
    const { data: users } = await supabase.from('profiles').select('*');
    console.log('Users Roles:', users?.map(u => ({ username: u.username, role: u.role })));

    const { data: apps } = await supabase.from('mentor_applications').select('*');
    console.log('Applications:', apps?.map(a => ({ user_id: a.user_id, status: a.status })));
    
    // 3. check email integration keywords
}

deepDive();
