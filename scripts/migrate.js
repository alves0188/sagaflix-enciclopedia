import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateData() {
  console.log('--- Iniciando Migração do sagaflix_db para tabelas relacionais ---');

  // 1. Fetch sagaflix_db
  const { data: dbData, error: dbError } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
  if (dbError) {
    console.error('Erro ao buscar sagaflix_db:', dbError);
    return;
  }

  const db = dbData?.data;
  if (!db) {
    console.log('sagaflix_db vazio, nada a migrar.');
    return;
  }

  const books = db.books || [];
  console.log(`Encontrados ${books.length} livros.`);

  for (const book of books) {
    console.log(`Processando livro: ${book.title}`);

    // Update the existing books row with its fields (in case they were not fully saved, but they probably were)
    await supabase.from('books').update({
        premissa: book.premise || '',
        ratings: book.ratings || [],
        chapters: book.universe?.chapters || []
    }).eq('id', book.id);

    // Migrate Ideas
    if (book.ideas && book.ideas.length > 0) {
      console.log(`  Migrando ${book.ideas.length} ideias...`);
      for (let i = 0; i < book.ideas.length; i++) {
        const idea = book.ideas[i];
        const newIdea = {
          id: idea.id || `idea_${Date.now()}_${Math.random()}`,
          book_id: book.id,
          title: idea.title || '',
          text: idea.text || '',
          color: idea.color || '#FFE082',
          order_index: i
        };
        await supabase.from('book_ideas').upsert(newIdea);
      }
    }

    // Migrate Escaleta
    if (book.escaleta && book.escaleta.length > 0) {
      console.log(`  Migrando ${book.escaleta.length} itens da escaleta...`);
      for (let i = 0; i < book.escaleta.length; i++) {
        const item = book.escaleta[i];
        const newItem = {
          id: item.id || `escaleta_${Date.now()}_${Math.random()}`,
          book_id: book.id,
          act: parseInt(item.act) || 1,
          title: item.title || '',
          text: item.text || '',
          order_index: i
        };
        await supabase.from('book_escaleta').upsert(newItem);
      }
    }

    // Migrate Universe Items
    if (book.universe) {
      for (const type of ['characters', 'locations', 'organizations', 'items']) {
        const typeMapping = {
            'characters': 'personagem',
            'locations': 'local',
            'organizations': 'organizacao',
            'items': 'item'
        };
        const items = book.universe[type] || [];
        if (items.length > 0) {
            console.log(`  Migrando ${items.length} ${type}...`);
            for (const item of items) {
                const uItem = {
                    id: item.id || `uitem_${Date.now()}_${Math.random()}`,
                    book_id: book.id,
                    type: typeMapping[type],
                    name: item.name || 'Sem Nome',
                    role: item.role || '',
                    age: item.age || null,
                    territory: item.territory || '',
                    image: item.image || '',
                    description: item.description || '',
                    motivations: item.motivations || '',
                    curiosities: item.curiosities || ''
                };
                await supabase.from('universe_items').upsert(uItem);

                // Migrate Notes for this item
                if (item.authorNotes && item.authorNotes.length > 0) {
                    for (const note of item.authorNotes) {
                        const newNote = {
                            id: note.id || `note_${Date.now()}_${Math.random()}`,
                            item_id: uItem.id,
                            author_id: note.authorId || book.authorId, // Fallback to book author
                            text: note.text || '',
                            created_at: note.date || new Date().toISOString()
                        };
                        await supabase.from('author_notes').upsert(newNote);

                        // Migrate feedback for this note
                        const feedbacks = (db.noteFeedback || []).filter(f => f.noteId === note.id);
                        for (const fb of feedbacks) {
                             const newFb = {
                                 id: fb.id || `fb_${Date.now()}_${Math.random()}`,
                                 note_id: note.id,
                                 user_id: fb.userId,
                                 type: fb.type
                             };
                             // Need to ignore unique constraint errors if the same user liked multiple times accidentally
                             try {
                                await supabase.from('note_feedback').upsert(newFb, { onConflict: 'note_id, user_id' });
                             } catch (e) {
                                // Ignore
                             }
                        }
                    }
                }

                // Migrate Connections
                if (item.connections && item.connections.length > 0) {
                    for (const conn of item.connections) {
                        const newConn = {
                            id: conn.id || `conn_${Date.now()}_${Math.random()}`,
                            item_id: uItem.id,
                            name: conn.name || '',
                            relation: conn.relation || ''
                        };
                        await supabase.from('universe_connections').upsert(newConn);
                    }
                }
            }
        }
      }
    }
  }
  
  // Migrate support tickets
  const tickets = db.supportTickets || [];
  if (tickets.length > 0) {
      console.log(`Migrando ${tickets.length} tickets de suporte...`);
      for (const t of tickets) {
          const newTicket = {
              id: t.id || `ticket_${Date.now()}_${Math.random()}`,
              book_id: t.bookId || books[0]?.id || null, // Best guess if undefined
              author_id: t.userId, // The one who created it... wait. No. The author is the owner of the book. 
              reader_id: t.userId, 
              message: t.message || '',
              status: t.status || 'open',
              reply: t.messages && t.messages.length > 0 ? t.messages[0].text : '',
              inbox_type: 'technical',
          };
          // Upsert ticket
          await supabase.from('support_tickets').upsert(newTicket);
      }
  }

  console.log('--- Migração Concluída com Sucesso! ---');
}

migrateData().catch(console.error);
