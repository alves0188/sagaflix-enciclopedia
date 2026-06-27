const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const onSaveTarget = `            onSave={async (bookData) => {
              const newId = 'book_' + Date.now();
              
              const newBook = {
                id: newId,
                title: bookData.title,
                synopsis: bookData.synopsis,
                cover_url: bookData.cover,
                author_id: currentUser.id,
                status: 'draft',
                sku: bookData.sku,
                distribution_mode: bookData.distributionMode,
                book_type: bookData.bookType || 'complete',
                universe_requests: [],
                co_author_ids: [],
                lore_areas: [],
                genres: [],
                escaleta_groups: [],
                trash: [],
                ratings: [],
                typesetting_settings: {},
                universe: {
                  home: false,
                  characters: false,
                  locations: false,
                  organizations: false,
                  clues: false,
                  events: false,
                  charactersData: [],
                  locationsData: [],
                  organizationsData: [],
                  cluesData: [],
                  items: [],
                  events: []
                },
                ideas: [],
                escaleta: []
              };
              try {
                const { data, error } = await supabase.from('books').insert(newBook).select().single();
                if (error) throw error;
                toast.success("Livro criado!");
                setShowNewBook(false);
                setCurrentBookId(data.id);
              } catch (err) {
                toast.error("Erro ao criar livro.");
              }
            }}`;

const onSaveRep = `            onSave={async (bookData) => {
              const newId = 'book_' + Date.now();
              
              const newBook = {
                id: newId,
                title: bookData.title,
                synopsis: bookData.synopsis,
                cover: bookData.cover,
                author_id: currentUser.id,
                status: 'draft',
                sku: bookData.sku,
                distribution_mode: bookData.distributionMode,
                book_type: bookData.workType || 'complete',
                universe_requests: [],
                co_authors: [],
                lore_areas: [],
                genres: [],
                ratings: [],
                typesetting_settings: {},
                chapters: []
              };
              try {
                const { data, error } = await supabase.from('books').insert(newBook).select().single();
                if (error) throw error;
                toast.success("Livro criado!");
                setShowNewBook(false);
                setCurrentBookId(data.id);
                // Temporarily inject the new book into the legacy db object to show it immediately
                setDb(prev => prev ? { ...prev, books: [...(prev.books || []), newBook] } : prev);
              } catch (err) {
                console.error(err);
                toast.error("Erro ao criar livro. Detalhes no console.");
              }
            }}`;

content = content.replace(onSaveTarget, onSaveRep);
fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx onSave patched successfully');
