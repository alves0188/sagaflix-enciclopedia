import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const generateSKU = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sku = 'LIV-';
  for (let i = 0; i < 8; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sku;
};

async function backfill() {
  const { data: dbData, error } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
  if (error || !dbData) {
    console.error('Error fetching DB', error);
    return;
  }
  
  const db = dbData.data;
  let updated = false;

  db.books.forEach(book => {
    if (!book.sku) {
      book.sku = generateSKU();
      updated = true;
    }
  });

  if (updated) {
    await supabase.from('sagaflix_db').update({ data: db }).eq('id', 1);
    console.log('SKUs backfilled successfully!');
  } else {
    console.log('No books needed backfilling.');
  }
}

backfill();
