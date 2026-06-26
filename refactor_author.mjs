import fs from 'fs';

let code = fs.readFileSync('src/components/AuthorDashboard.jsx', 'utf8');

// 1. Signature
code = code.replace(
  /export default function AuthorDashboard\(\{ db, onUpdateData, currentUser, onSelectBook, onOpenNewBook, forceUserId, \nonCloseForceView, activeTab: propActiveTab, onTabChange, focusAuthorId, setFocusAuthorId, isSidebarOpen, \nisSidebarOpen \} \)\s*\{/g, // This regex is broken due to formatting. Let's just do a simpler replace.
  ''
);

// We need to replace the signature carefully. Let's find the start.
const idxSigStart = code.indexOf('export default function AuthorDashboard({ db, onUpdateData');
const idxSigEnd = code.indexOf('const [localActiveTab, setLocalActiveTab]');
if (idxSigStart !== -1 && idxSigEnd !== -1) {
  const newSig = `import { supabase } from '../lib/supabaseClient';

export default function AuthorDashboard({ currentUser, onSelectBook, onOpenNewBook, forceUserId, onCloseForceView, activeTab: propActiveTab, onTabChange, focusAuthorId, setFocusAuthorId, isSidebarOpen, setIsSidebarOpen }) {
  const [localData, setLocalData] = useState(null);

  useEffect(() => {
    async function loadAuthorData() {
      const [{ data: profiles }, { data: books }, { data: support_tickets }, { data: note_requests }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('books').select('*'),
        supabase.from('support_tickets').select('*'),
        supabase.from('note_requests').select('*')
      ]);

      setLocalData({
        users: (profiles || []).map(p => ({
          id: p.id, role: p.role, name: p.name, nickname: p.nickname, email: p.email, avatar: p.avatar_url
        })),
        books: (books || []).map(b => ({
          id: b.id, authorId: b.author_id, title: b.title, status: b.status, coverUrl: b.cover_url,
          synopsis: b.synopsis, bookType: b.book_type, universeRequests: b.universe_requests || [],
          coAuthorIds: b.co_author_ids || [], loreAreas: b.lore_areas || [],
          universe: { notes: [] } // Simplification to avoid breaking UI that expects universe
        })),
        supportTickets: (support_tickets || []).map(t => ({
          id: t.id, userId: t.user_id, category: t.category, subject: t.subject, message: t.message,
          status: t.status, hasUnreadCuratorMessage: t.has_unread_curator_message, messages: t.messages || []
        })),
        noteRequests: (note_requests || []).map(n => ({
          id: n.id, userId: n.user_id, bookId: n.book_id, noteId: n.note_id, status: n.status, read: n.read, message: n.message
        }))
      });
    }
    if (currentUser) loadAuthorData();
  }, [currentUser]);

  if (!localData) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><p style={{ color: 'var(--accent-gold)' }}>Carregando Estúdio...</p></div>;

  const db = localData;

  const onUpdateData = async (newDb) => {
    setLocalData(newDb);
    // Since Author mutations are very complex (11+ usages), this function will sync the ENTIRE state back to Supabase.
    // We will do a generic sync for the most critical things updated by author: books and tickets.
    for (const b of newDb.books) {
      if (b.authorId === currentUser.id) {
        await supabase.from('books').update({ 
           title: b.title, synopsis: b.synopsis, status: b.status, cover_url: b.coverUrl,
           lore_areas: b.loreAreas, universe_requests: b.universeRequests, co_author_ids: b.coAuthorIds
        }).eq('id', b.id);
      }
    }
    for (const t of newDb.supportTickets || []) {
      if (t.userId === currentUser.id || currentUser.role === 'curator') {
         await supabase.from('support_tickets').update({
           status: t.status, messages: t.messages, has_unread_curator_message: t.hasUnreadCuratorMessage
         }).eq('id', t.id);
      }
    }
    for (const n of newDb.noteRequests || []) {
       await supabase.from('note_requests').update({
         status: n.status, read: n.read
       }).eq('id', n.id);
    }
  };

  `;
  code = code.substring(0, idxSigStart) + newSig + code.substring(idxSigEnd);
  fs.writeFileSync('src/components/AuthorDashboard.jsx', code);
  console.log('Author refactored!');
} else {
  console.log('Signature not found in AuthorDashboard.jsx');
}
