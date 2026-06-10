import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const defaultBadges = [
  { id: 'bdg_1', name: 'Primeira Viagem', icon: '⛵', description: 'Para quem concluiu a leitura do primeiro capítulo.', rule: 'Ler pelo menos 1 capítulo completo.' },
  { id: 'bdg_2', name: 'Rato de Biblioteca', icon: '📚', description: 'Um verdadeiro devorador de livros.', rule: 'Ler e concluir 10 livros na plataforma.' },
  { id: 'bdg_3', name: 'Maratona', icon: '🏃', description: 'Foco total! Leu sem parar por mais de 2 horas.', rule: 'Tempo de sessão único superior a 120 minutos.' },
  { id: 'bdg_4', name: 'O Inicializador', icon: '🐌', description: 'Começa muitas aventuras, mas não termina.', rule: 'Iniciar 5 livros e não finalizar nenhum.' },
  { id: 'bdg_5', name: 'Coruja Noturna', icon: '🦉', description: 'A noite é uma criança para a leitura.', rule: 'Ler a maioria das páginas entre 00:00 e 04:00.' },
  { id: 'bdg_6', name: 'Crítico de Arte', icon: '🧐', description: 'Sempre deixa sua opinião.', rule: 'Avaliar 5 obras diferentes com estrelas.' },
  { id: 'bdg_7', name: 'Fiel Escudeiro', icon: '🛡️', description: 'Lealdade máxima a um único autor.', rule: 'Ler todos os livros publicados por um único autor (mín. 3).' },
  { id: 'bdg_8', name: 'Caçador de Lore', icon: '🗺️', description: 'Não lê só a história, lê a enciclopédia inteira.', rule: 'Abrir 20 perfis de personagens ou locais na enciclopédia.' },
  { id: 'bdg_9', name: 'Explorador Sazonal', icon: '🍁', description: 'Lê de acordo com as estações e eventos.', rule: 'Concedido pela curadoria durante eventos especiais.' },
  { id: 'bdg_10', name: 'O Padrinho', icon: '👑', description: 'Um dos primeiros leitores da plataforma.', rule: 'Conta criada na primeira semana de lançamento da plataforma.' },
];

async function initBadges() {
  const { data: dbData, error } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
  if (error || !dbData) {
    console.error('Error fetching DB', error);
    return;
  }
  
  const db = dbData.data;
  
  if (!db.badges) {
    db.badges = [];
  }
  
  // Apenas insere se estiver vazio
  if (db.badges.length === 0) {
    db.badges = defaultBadges;
    await supabase.from('sagaflix_db').update({ data: db }).eq('id', 1);
    console.log('Badges initialized!');
  } else {
    console.log('Badges already exist.');
  }
}

initBadges();
