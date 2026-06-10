import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanDashboards() {
  const { data: result, error: fetchError } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
  if (fetchError) {
    console.error('Error fetching data:', fetchError);
    return;
  }
  
  const db = result.data;
  
  // Limpar os históricos
  db.auditLogs = [];
  db.notifications = [];
  db.supportTickets = [];
  db.authorRequests = [];
  
  console.log('Dados limpos. Atualizando o Supabase...');
  
  const { error: updateError } = await supabase.from('sagaflix_db').update({ data: db }).eq('id', 1);
  if (updateError) {
    console.error('Erro ao atualizar Supabase:', updateError);
  } else {
    console.log('✅ Histórico das dashboards limpo com sucesso no Supabase!');
  }
}

cleanDashboards();
