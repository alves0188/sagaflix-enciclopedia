import fs from 'fs';

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// 1. IMPORTS
appCode = appCode.replace(
  /import \{ useState, useEffect \} from 'react';/,
  `import { useState, useEffect } from 'react';\nimport { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';`
);

// 2. FETCH DATA & USE EFFECT
// Substituir tudo do fetchData até o final do useEffect, incluindo onAuthStateChange.
// Encontrar índice do fetchData
const idxFetchData = appCode.indexOf('  const fetchData = async () => {');
const idxEndUseEffect = appCode.indexOf('  const handleUpdateData = async (newData) => {');

if (idxFetchData !== -1 && idxEndUseEffect !== -1) {
  const newFetchAndUseEffect = `
  const navigate = useNavigate();
  const location = useLocation();

  const fetchData = async (user) => {
    try {
      const [{ data: profiles }, { data: books }, { data: chapters }, { data: lore_items }, { data: notifications }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('books').select('*'),
        supabase.from('chapters').select('*'),
        supabase.from('lore_items').select('*'),
        supabase.from('notifications').select('*')
      ]);

      const data = {
        users: (profiles || []).map(p => ({
          id: p.id,
          role: p.role,
          name: p.name,
          nickname: p.nickname,
          email: p.email,
          avatar: p.avatar_url,
          about: p.bio,
          writingStyle: p.writing_style,
          completedTutorials: p.completed_tutorials || []
        })),
        books: (books || []).map(b => ({
          id: b.id,
          authorId: b.author_id,
          title: b.title,
          status: b.status,
          coverUrl: b.cover_url,
          bannerUrl: b.banner_url,
          synopsis: b.synopsis,
          releaseModel: b.release_model,
          bookType: b.book_type,
          loreAreas: b.lore_areas || [],
          typesettingSettings: b.typesetting_settings || {},
          chapters: (chapters || []).filter(c => c.book_id === b.id).map(c => ({
            id: c.id,
            title: c.title,
            pages: c.pages || [],
            isPublished: c.is_published,
            publishDate: c.publish_date,
            orderIndex: c.order_index
          }))
        })),
        notifications: notifications || []
      };

      setDb(data);

      if (user) {
        const latestUser = data.users.find(u => u.id === user.id);
        setCurrentUser(latestUser);
        localStorage.setItem('sagaflix_user', JSON.stringify(latestUser));
      }
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar dados.', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchData(session.user);
      else {
        setDb({ users: [], books: [], notifications: [] }); // Empty public state
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchData(session.user);
      } else {
        setCurrentUser(null);
        setDb({ users: [], books: [], notifications: [] });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

`;
  appCode = appCode.substring(0, idxFetchData) + newFetchAndUseEffect + appCode.substring(idxEndUseEffect);
}

// 3. HANDLE LOGOUT
const idxLogoutStart = appCode.indexOf('  const handleLogout = () => {');
const idxLogoutEnd = appCode.indexOf('  const handleDeleteAccount = async () => {');
if (idxLogoutStart !== -1 && idxLogoutEnd !== -1) {
  const newLogout = `  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentBookId(null);
    localStorage.clear();
    navigate('/');
  };

`;
  appCode = appCode.substring(0, idxLogoutStart) + newLogout + appCode.substring(idxLogoutEnd);
}

// 4. ROUTER RENDER (Fluxo não logado)
const idxFluxoNaoLogado = appCode.indexOf('  // Fluxo não logado (separado por portal)');
const idxSeUmLivro = appCode.indexOf('  // Se um livro estiver aberto');

if (idxFluxoNaoLogado !== -1 && idxSeUmLivro !== -1) {
  const newAuthRouter = `  // ===================== REACT ROUTER =====================
  if (!currentUser) {
    if (authView === 'confirm_email' && confirmToken) {
      return <EmailConfirmationView token={confirmToken} onConfirm={() => navigate('/')} />;
    }
    
    return (
      <Routes>
        <Route path="/curador" element={<Login onNavigateRegister={() => setAuthView('register')} portalRole="curator" />} />
        <Route path="/autor" element={authView === 'login' ? <Login onNavigateRegister={() => setAuthView('register')} portalRole="author" /> : <Register onNavigateLogin={() => setAuthView('login')} portalRole="author" />} />
        <Route path="*" element={authView === 'login' ? <Login onNavigateRegister={() => setAuthView('register')} portalRole="reader" /> : <Register onNavigateLogin={() => setAuthView('login')} portalRole="reader" />} />
      </Routes>
    );
  }

`;
  appCode = appCode.substring(0, idxFluxoNaoLogado) + newAuthRouter + appCode.substring(idxSeUmLivro);
}

// 5. MAIN CONTENT ROUTER
const idxMainStart = appCode.indexOf('  return (');
if (idxMainStart !== -1) {
  // Pegar do idxMainStart até a tag <main>
  const strMainStart = appCode.substring(idxMainStart);
  const tagMain = strMainStart.indexOf('<main>');
  const idxFullMain = idxMainStart + tagMain;
  
  if (tagMain !== -1) {
    const headerStr = appCode.substring(idxMainStart, idxFullMain);
    const newMainStr = `
      <main style={{ flex: 1, padding: isMobile ? '0 0.5rem' : '0 2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/curador" element={currentUser.role === 'curator' || currentUser.role === 'admin' ? <CuratorDashboard db={db} currentUser={currentUser} onUpdateData={handleUpdateData} /> : <Navigate to="/" />} />
          <Route path="/autor" element={currentUser.role === 'author' || currentUser.role === 'admin' ? <AuthorDashboard db={db} currentUser={currentUser} onUpdateData={handleUpdateData} activeTab={authorActiveTab} onTabChange={setAuthorActiveTab} /> : <Navigate to="/" />} />
          <Route path="/" element={<ReaderDashboard db={db} currentUser={currentUser} onUpdateData={handleUpdateData} activeTab={readerActiveTab} onTabChange={setReaderActiveTab} onOpenBook={setCurrentBookId} isMobile={isMobile} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
`;
    appCode = appCode.substring(0, idxMainStart) + headerStr + newMainStr;
  }
}

fs.writeFileSync('src/App.jsx', appCode);
console.log('✅ App.jsx atualizado com indexOf exato.');
