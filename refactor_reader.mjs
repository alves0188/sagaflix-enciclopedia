import fs from 'fs';

let code = fs.readFileSync('src/components/ReaderDashboard.jsx', 'utf8');

// 1. Change Signature
code = code.replace(
  /export default function ReaderDashboard\(\{ db, currentUser, onUpdateData, onSelectBook, onSelectBookUniverse, \ninitialActiveTab, onTabChange \}\) \{/,
  `import { supabase } from '../lib/supabaseClient';

export default function ReaderDashboard({ currentUser, onSelectBook, onSelectBookUniverse, initialActiveTab, onTabChange }) {`
);
// It might be on one line
code = code.replace(
  /export default function ReaderDashboard\(\{ db, currentUser, onUpdateData, onSelectBook, onSelectBookUniverse, initialActiveTab, onTabChange \}\) \{/,
  `import { supabase } from '../lib/supabaseClient';

export default function ReaderDashboard({ currentUser, onSelectBook, onSelectBookUniverse, initialActiveTab, onTabChange }) {`
);

// 2. Add localData state and fetcher right after isMobile state
const isMobileRegex = /const \[isMobile, setIsMobile\] = useState\(window\.innerWidth < 768\);/;
const dataFetcher = `const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [localData, setLocalData] = useState(null);

  useEffect(() => {
    async function loadReaderData() {
      // Fetch books, authors, banners
      const [{ data: books }, { data: profiles }, { data: reviews }] = await Promise.all([
        supabase.from('books').select('*').eq('status', 'published'),
        supabase.from('profiles').select('*'),
        supabase.from('reviews').select('*')
      ]);

      const mappedBooks = (books || []).map(b => ({
        id: b.id,
        authorId: b.author_id,
        title: b.title,
        status: b.status,
        coverUrl: b.cover_url,
        bannerUrl: b.banner_url,
        synopsis: b.synopsis,
        loreAreas: b.lore_areas || [],
        universeRequests: b.universe_requests || [],
        coAuthorIds: b.co_author_ids || [],
        ratings: (reviews || []).filter(r => r.book_id === b.id).map(r => ({
           userId: r.user_id,
           rating: r.rating,
           comment: r.comment
        }))
      }));

      const mappedUsers = (profiles || []).map(p => ({
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        avatar: p.avatar_url,
        favorites: p.favorites || [],
        readingStatus: p.reading_status || {},
        badges: p.gamification_badges || []
      }));

      setLocalData({
        books: mappedBooks,
        users: mappedUsers,
        banners: DEFAULT_BANNERS,
        gamificationBadges: BADGES_DB || []
      });
    }
    if (currentUser) {
       loadReaderData();
    }
  }, [currentUser]);

  if (!localData) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><p style={{ color: 'var(--accent-gold)' }}>Carregando Biblioteca...</p></div>;
  }

  const db = localData; // Magic alias to keep the rest of the file working!
`;
code = code.replace(isMobileRegex, dataFetcher);

// 3. Fix Universe Request Mutation
const oldRequestMutation = /const newDb = JSON\.parse\(JSON\.stringify\(db\)\);\n\s*const bookIndex = newDb\.books\.findIndex\(b => b\.id === bookForRequest\.id\);\n\s*if \(bookIndex !== -1\) \{[\s\S]*?onUpdateData\(newDb\);\n\s*\}/;
const newRequestMutation = `const updatedBooks = [...db.books];
      const bookIndex = updatedBooks.findIndex(b => b.id === bookForRequest.id);
      if (bookIndex !== -1) {
        updatedBooks[bookIndex].universeRequests = updatedBooks[bookIndex].universeRequests || [];
        const newReqs = [...updatedBooks[bookIndex].universeRequests, {
          id: 'req_' + Date.now(),
          userId: currentUser.id,
          timestamp: new Date().toISOString(),
          requestedFeatures: requestForm.features,
          message: requestForm.message
        }];
        updatedBooks[bookIndex].universeRequests = newReqs;
        setLocalData({ ...db, books: updatedBooks });
        
        // Supabase Call
        supabase.from('books').update({ universe_requests: newReqs }).eq('id', bookForRequest.id).then();
      }`;
code = code.replace(oldRequestMutation, newRequestMutation);

// 4. Fix Toggle Favorite Mutation
const oldFavMutation = /const newDb = \{ \.\.\.db \};\n\s*newDb\.users = newDb\.users\.map\(u => u\.id === currentUser\.id \? updatedUser : u\);\n\s*onUpdateData\(newDb\);/g;
// Wait, there are multiple matches for this pattern. Let's do it by specific function contents.

const oldFavFunc = /const updatedUser = \{\n\s*\.\.\.currentUser,\n\s*favorites: updatedFavorites\n\s*\};\n\s*const newDb = \{ \.\.\.db \};\n\s*newDb\.users = newDb\.users\.map\(u => u\.id === currentUser\.id \? updatedUser : u\);\n\s*onUpdateData\(newDb\);/;
const newFavFunc = `const updatedUser = { ...currentUser, favorites: updatedFavorites };
      const newUsers = db.users.map(u => u.id === currentUser.id ? updatedUser : u);
      setLocalData({ ...db, users: newUsers });
      // Update Supabase
      supabase.from('profiles').update({ favorites: updatedFavorites }).eq('id', currentUser.id).then();`;
code = code.replace(oldFavFunc, newFavFunc);

// 5. Fix Toggle Reading Status
const oldReadFunc = /const updatedUser = \{\n\s*\.\.\.currentUser,\n\s*readingStatus: updatedStatus\n\s*\};\n\s*const newDb = \{ \.\.\.db \};\n\s*newDb\.users = newDb\.users\.map\(u => u\.id === currentUser\.id \? updatedUser : u\);\n\s*onUpdateData\(newDb\);/;
const newReadFunc = `const updatedUser = { ...currentUser, readingStatus: updatedStatus };
      const newUsers = db.users.map(u => u.id === currentUser.id ? updatedUser : u);
      setLocalData({ ...db, users: newUsers });
      // Update Supabase
      supabase.from('profiles').update({ reading_status: updatedStatus }).eq('id', currentUser.id).then();`;
code = code.replace(oldReadFunc, newReadFunc);

// 6. Fix Save Review Mutation
const oldReviewFunc = /const newDb = \{ \.\.\.db \};\n\s*newDb\.books = newDb\.books\.map\(b => \{[\s\S]*?onUpdateData\(newDb\);/;
const newReviewFunc = `const newReview = { id: 'rev_' + Date.now(), userId: currentUser.id, rating: ratingStars, comment: reviewText };
      const updatedBooks = db.books.map(b => {
        if (b.id === activeBook.id) {
          const otherRatings = (b.ratings || []).filter(r => r.userId !== currentUser.id);
          return { ...b, ratings: [...otherRatings, newReview] };
        }
        return b;
      });
      setLocalData({ ...db, books: updatedBooks });
      // Insert into Supabase
      supabase.from('reviews').insert({
         id: newReview.id,
         book_id: activeBook.id,
         user_id: currentUser.id,
         rating: newReview.rating,
         comment: newReview.comment
      }).then();`;
code = code.replace(oldReviewFunc, newReviewFunc);

fs.writeFileSync('src/components/ReaderDashboard.jsx', code);
console.log('✅ ReaderDashboard.jsx reescrito para uso local + Supabase!');
