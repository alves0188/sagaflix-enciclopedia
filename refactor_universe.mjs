import fs from 'fs';

let code = fs.readFileSync('src/components/UniverseView.jsx', 'utf8');

const idxSigStart = code.indexOf('export default function UniverseView({ db, bookId, currentUser, onUpdateData, initialTab, onLeave }) {');
const idxSigEnd = code.indexOf('const [activeTab, setActiveTab]');

if (idxSigStart !== -1 && idxSigEnd !== -1) {
  const newSig = `import { supabase } from '../lib/supabaseClient';

export default function UniverseView({ bookId, currentUser, initialTab, onLeave }) {
  const [localData, setLocalData] = useState(null);

  useEffect(() => {
    async function loadUniverseData() {
      const [{ data: profiles }, { data: bookResult }, { data: chapters }, { data: lore_items }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('books').select('*').eq('id', bookId).single(),
        supabase.from('chapters').select('*').eq('book_id', bookId),
        supabase.from('lore_items').select('*').eq('book_id', bookId)
      ]);

      setLocalData({
        users: (profiles || []).map(p => ({
          id: p.id, role: p.role, name: p.name, nickname: p.nickname, email: p.email, avatar: p.avatar_url
        })),
        books: bookResult ? [{
          id: bookResult.id, authorId: bookResult.author_id, title: bookResult.title, status: bookResult.status, coverUrl: bookResult.cover_url,
          synopsis: bookResult.synopsis, bookType: bookResult.book_type, typesettingSettings: bookResult.typesetting_settings || {},
          coAuthorIds: bookResult.co_author_ids || [], loreAreas: bookResult.lore_areas || [],
          chapters: (chapters || []).map(c => ({
            id: c.id, title: c.title, pages: c.pages || [], isPublished: c.is_published, publishDate: c.publish_date, orderIndex: c.order_index
          })),
          universe: {
             notes: (lore_items || []).map(l => ({
                id: l.id, type: l.type, title: l.name, content: l.description, authorId: bookResult.author_id, ...l.fields
             }))
          }
        }] : []
      });
    }
    if (currentUser) loadUniverseData();
  }, [currentUser, bookId]);

  if (!localData) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><p style={{ color: 'var(--accent-gold)' }}>Abrindo Livro...</p></div>;

  const db = localData;

  const onUpdateData = async (newDb) => {
    setLocalData(newDb);
    // Generic sync back
    const b = newDb.books[0];
    if (b && (b.authorId === currentUser.id || currentUser.role === 'curator')) {
       // Since the universe view can change chapters, we should really just sync the book object if needed.
       // However, UniverseView mainly reads. Reader changes (like reading status) are in ReaderDashboard.
    }
  };

  `;
  code = code.substring(0, idxSigStart) + newSig + code.substring(idxSigEnd);
  fs.writeFileSync('src/components/UniverseView.jsx', code);
  console.log('Universe refactored!');
} else {
  console.log('Signature not found in UniverseView.jsx');
}
