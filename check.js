import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
  if (error) console.error(error);
  else {
    const db = data.data;
    console.log('Users count:', db.users.length);
    console.log('Author Requests:', db.authorRequests ? db.authorRequests.length : 'undefined');
    if (db.authorRequests) {
        console.log(db.authorRequests.map(r => r.status));
    }
  }
}
check();
