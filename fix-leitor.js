import { createClient } from '@supabase/supabase-js';
const s = createClient('https://guecsoghyqvssdvednnv.supabase.co', 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3');
async function run() { 
  const r = await s.from('sagaflix_db').select('data').eq('id',1).single(); 
  let db = r.data.data; 
  let users = db.users || []; 
  let fiel = users.find(u => u.name === 'Leitor Fiel' || u.nickname === 'Leitor Fiel'); 
  if(fiel){ 
    fiel.pagesRead = 125; 
    fiel.finishedBooks = ['book1','book2']; 
    const bdgs = db.gamificationBadges || []; 
    const b1 = bdgs.find(b=>b.id==='bdg_1'); 
    const b10 = bdgs.find(b=>b.id==='bdg_10'); 
    fiel.badges = [b1, b10].filter(Boolean); 
    await s.from('sagaflix_db').update({data:db}).eq('id',1); 
    console.log('Fixed Leitor Fiel'); 
  } else {
    console.log('Not found');
  }
} 
run();
