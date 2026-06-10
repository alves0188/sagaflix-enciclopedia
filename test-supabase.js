import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectData() {
  const { data, error } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  
  const db = data.data;
  
  // Resumir o que tem
  console.log('--- Resumo dos Dados ---');
  console.log(`Livros (${db.books ? db.books.length : 0}):`, db.books ? db.books.map(b => b.title) : []);
  console.log(`Usuários (${db.users ? db.users.length : 0}):`, db.users ? db.users.map(u => u.name) : []);
  
  if (db.books && db.books.length > 0) {
     db.books.forEach(book => {
         console.log(`\nLivro: ${book.title}`);
         console.log(`  Personagens (${book.universe?.characters ? book.universe.characters.length : 0}):`, book.universe?.characters ? book.universe.characters.map(c => c.name) : []);
         console.log(`  Locais (${book.universe?.locations ? book.universe.locations.length : 0}):`, book.universe?.locations ? book.universe.locations.map(c => c.name) : []);
         console.log(`  Capítulos (${book.universe?.chapters ? book.universe.chapters.length : 0}):`, book.universe?.chapters ? book.universe.chapters.map(c => c.title) : []);
     });
  }
  
  console.log(`\nAudit Logs:`, db.auditLogs ? db.auditLogs.length : 0);
  console.log(`Notificações:`, db.notifications ? db.notifications.length : 0);
  console.log(`Tickets de suporte:`, db.supportTickets ? db.supportTickets.length : 0);

  // Save a backup locally just in case
  fs.writeFileSync('data_backup.json', JSON.stringify(db, null, 2));
  console.log('Backup salvo em data_backup.json');
}

inspectData();
