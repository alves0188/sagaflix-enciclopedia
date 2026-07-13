const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_SERVICE_ROLE) {
  console.error('[Embeddings] SUPABASE_SERVICE_ROLE não está configurada.');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.warn('[Embeddings] GEMINI_API_KEY não configurada. Geração de embeddings desativada.');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateEmbeddings() {
  console.log('[Embeddings] Iniciando checagem de embeddings das obras...');
  
  try {
    // 1. Fetch books that don't have embeddings yet
    const { data: books, error } = await supabase
      .from('books')
      .select('id, title, synopsis, premise')
      .is('embedding', null);

    if (error) {
      console.error('[Embeddings] Erro ao buscar livros sem embeddings:', error);
      return;
    }

    if (!books || books.length === 0) {
      console.log('[Embeddings] Todos os livros já possuem embeddings gerados.');
      return;
    }

    console.log(`[Embeddings] Encontrados ${books.length} livros sem embeddings. Gerando...`);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    for (const book of books) {
      console.log(`[Embeddings] Gerando para: "${book.title}"`);
      const descriptor = `${book.title}. ${book.synopsis || ''}. ${book.premise || ''}`;

      try {
        const result = await model.embedContent(descriptor);
        const embedding = result.embedding.values;

        const { error: updErr } = await supabase
          .from('books')
          .update({ embedding })
          .eq('id', book.id);

        if (updErr) {
          console.error(`[Embeddings] Erro ao atualizar livro ${book.title} no Supabase:`, updErr);
        } else {
          console.log(`[Embeddings] Embedding gerado e atualizado para: "${book.title}"`);
        }
      } catch (geminiErr) {
        console.error(`[Embeddings] Erro na API do Gemini para "${book.title}":`, geminiErr);
      }
    }
    console.log('[Embeddings] Processo de geração de embeddings concluído.');
  } catch (err) {
    console.error('[Embeddings] Erro inesperado na migração de embeddings:', err);
  }
}

generateEmbeddings();
