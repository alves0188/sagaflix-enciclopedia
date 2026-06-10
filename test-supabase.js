import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('Fetching Supabase...');
  const { data, error } = await supabase.from('sagaflix_db').select('*');
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Success fetching data:', JSON.stringify(data));
  }
}

test();
