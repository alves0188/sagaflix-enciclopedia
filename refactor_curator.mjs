import fs from 'fs';

let code = fs.readFileSync('src/components/CuratorDashboard.jsx', 'utf8');

const idxSigStart = code.indexOf('export default function CuratorDashboard({ db, onUpdateData, currentUser, focusAuthorId, setFocusAuthorId');
const idxSigEnd = code.indexOf('const permissions = getCuratorPermissions(currentUser);');

if (idxSigStart !== -1 && idxSigEnd !== -1) {
  const newSig = `import { supabase } from '../lib/supabaseClient';

export default function CuratorDashboard({ currentUser, focusAuthorId, setFocusAuthorId, isSidebarOpen, setIsSidebarOpen, onSelectBook, onSelectBookUniverse }) {
  const [localData, setLocalData] = useState(null);

  useEffect(() => {
    async function loadCuratorData() {
      const [{ data: profiles }, { data: books }, { data: support_tickets }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('books').select('*'),
        supabase.from('support_tickets').select('*')
      ]);

      setLocalData({
        users: (profiles || []).map(p => ({
          id: p.id, role: p.role, name: p.name, nickname: p.nickname, email: p.email, status: 'approved'
        })),
        books: (books || []).map(b => ({
          id: b.id, authorId: b.author_id, title: b.title, status: b.status, coverUrl: b.cover_url,
          synopsis: b.synopsis, bookType: b.book_type, universeRequests: b.universe_requests || [],
          coAuthorIds: b.co_author_ids || [], loreAreas: b.lore_areas || [],
          universe: { notes: [] }
        })),
        supportTickets: (support_tickets || []).map(t => ({
          id: t.id, userId: t.user_id, category: t.category, subject: t.subject, message: t.message,
          status: t.status, hasUnreadCuratorMessage: t.has_unread_curator_message, messages: t.messages || []
        })),
        gamificationBadges: [], banners: []
      });
    }
    if (currentUser) loadCuratorData();
  }, [currentUser]);

  if (!localData) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><p style={{ color: 'var(--accent-gold)' }}>Carregando Curadoria...</p></div>;

  const db = localData;

  const onUpdateData = async (newDb) => {
    setLocalData(newDb);
    // Generic sync back
    for (const b of newDb.books) {
      await supabase.from('books').update({ status: b.status }).eq('id', b.id);
    }
    for (const t of newDb.supportTickets || []) {
      await supabase.from('support_tickets').update({
        status: t.status, messages: t.messages, has_unread_curator_message: t.hasUnreadCuratorMessage
      }).eq('id', t.id);
    }
    for (const u of newDb.users) {
      if (u.role !== 'reader') {
        await supabase.from('profiles').update({ role: u.role }).eq('id', u.id);
      }
    }
  };

  `;
  code = code.substring(0, idxSigStart) + newSig + code.substring(idxSigEnd);
  fs.writeFileSync('src/components/CuratorDashboard.jsx', code);
  console.log('Curator refactored!');
} else {
  console.log('Signature not found in CuratorDashboard.jsx');
}
