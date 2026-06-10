const fs = require('fs');

const SUPABASE_URL = 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';

async function migrate() {
  console.log('Lendo data.json local...');
  let data;
  try {
    const rawData = fs.readFileSync('data.json', 'utf8');
    data = JSON.parse(rawData);
  } catch (err) {
    console.error('Erro ao ler data.json:', err.message);
    return;
  }

  console.log('Enviando dados para o Supabase...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sagaflix_db?id=eq.1`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ data: data })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API do Supabase:', response.status, errorText);
    } else {
      console.log('✅ Dados migrados com sucesso para o Supabase!');
      console.log('Agora as avaliações e todos os dados serão salvos permanentemente.');
    }
  } catch (err) {
    console.error('Erro de conexão:', err.message);
  }
}

migrate();
