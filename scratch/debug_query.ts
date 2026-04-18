import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testQuery(id: string) {
  console.log('Testing query for doubt ID:', id);
  const { data, error } = await supabase
    .from('doubts')
    .select(`
      *,
      author:profiles!author_id (
        id,
        username,
        full_name,
        avatar_url,
        college,
        branch,
        reputation_points
      ),
      subjects (
        id,
        name
      ),
      answers (
        id,
        content_markdown,
        is_accepted,
        created_at,
        author_id,
        author:profiles!author_id (
          id,
          username,
          full_name,
          avatar_url,
          reputation_points
        ),
        raw_votes:answer_votes (
          vote_type,
          user_id
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Query Error:', error);
  } else {
    console.log('Query Success:', !!data);
  }
}

// Get the first doubt id
async function getFirstId() {
  const { data } = await supabase.from('doubts').select('id').limit(1).single();
  return data?.id;
}

getFirstId().then(id => {
  if (id) testQuery(id);
  else console.log('No doubts found');
});
