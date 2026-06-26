import fs from 'fs';

// 1. Refatorar Login.jsx
let loginCode = fs.readFileSync('src/components/Login.jsx', 'utf8');
loginCode = loginCode.replace(
  /const handleSubmit = async \(e\) => \{[\s\S]*?\}\s*\} catch \(err\) \{/g,
  `const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email, password
      });
      if (authError) {
        setError('E-mail ou senha incorretos.');
        return;
      }
      // O onAuthStateChange no App.jsx vai assumir daqui!
    } catch (err) {`
);
fs.writeFileSync('src/components/Login.jsx', loginCode);

// 2. Refatorar Register.jsx
let registerCode = fs.readFileSync('src/components/Register.jsx', 'utf8');
registerCode = registerCode.replace(
  /const handleSubmit = async \(e\) => \{[\s\S]*?\}\s*\} catch \(err\) \{/g,
  `const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });
      
      if (authError) {
        setError('Erro ao criar conta: ' + authError.message);
        setLoading(false);
        return;
      }

      // Cria o profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: formData.email,
        role: portalRole,
        name: formData.name,
        nickname: formData.pseudonym || formData.name,
        bio: formData.about || '',
        writing_style: formData.writingStyle || '',
        avatar_url: formData.avatar || ''
      });

      if (profileError) {
        setError('Conta criada, mas erro ao salvar perfil.');
        setLoading(false);
        return;
      }

      // O onAuthStateChange no App.jsx vai detectar e logar!
    } catch (err) {`
);
fs.writeFileSync('src/components/Register.jsx', registerCode);

// 3. Refatorar App.jsx
let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// Imports
appCode = appCode.replace(
  /import \{ useState, useEffect \} from 'react';/,
  `import { useState, useEffect } from 'react';\nimport { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';`
);

// FetchData
const oldFetchData = /const fetchData = async \(\) => \{[\s\S]*?setLoading\(false\);\n    \} catch \(err\) \{\n      console\.error\('Erro ao buscar dados\.', err\);\n      setLoading\(false\);\n    \}\n  \};/;

const newFetchData = `
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
`;

appCode = appCode.replace(oldFetchData, newFetchData);

// UseEffect init
const oldUseEffect = /useEffect\(\(\) => \{\n    fetchData\(\);[\s\S]*?\}, \[\]\);/;
const newUseEffect = `
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
appCode = appCode.replace(oldUseEffect, newUseEffect);

// HandleUpdateData (sync to supabase)
const oldHandleUpdateData = /const handleUpdateData = async \(newData\) => \{[\s\S]*?\}\s*\} catch \(err\) \{\n      console\.error\('Erro ao salvar\.', err\);\n    \}\n  \};/;
const newHandleUpdateData = `
  const handleUpdateData = async (newData) => {
    setDb(newData);
    // Em modo relacional, os componentes devem salvar diretamente.
    // Esta função fica como fallback na RAM temporariamente até reescrevermos os Dashboards.
  };
`;
appCode = appCode.replace(oldHandleUpdateData, newHandleUpdateData);

// Logout
appCode = appCode.replace(
  /const handleLogout = \(\) => \{[\s\S]*?localStorage\.removeItem\('sagaflix_authorTab'\);\n  \};/,
  `const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentBookId(null);
    localStorage.clear();
    navigate('/');
  };`
);

// Routers mapping (replaces the huge if/else block at the end)
// Wait, replacing the end block is harder via regex. Let's find the specific block.
// "if (!currentUser) {" to the end.
const routerReplacementStart = appCode.indexOf('  // Fluxo não logado (separado por portal)');
const routerReplacement = `
  // ===================== REACT ROUTER =====================
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

  // Se logado
  if (currentBookId && viewRole !== 'curator') {
    return (
      <UniverseView 
        db={db} 
        bookId={currentBookId} 
        currentUser={currentUser} 
        onUpdateData={handleUpdateData} 
        initialTab={initialUniverseTab}
        onLeave={() => setCurrentBookId(null)} 
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff', border: '1px solid #d4af37' } }} />
      {/* Header and top bars... we keep the current return structure but swap main with routes */}
      ` + appCode.substring(appCode.indexOf('<header style={{'), appCode.indexOf('<main>')) + `
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

appCode = appCode.substring(0, routerReplacementStart) + routerReplacement;

fs.writeFileSync('src/App.jsx', appCode);
console.log('✅ Refatoração híbrida concluída com sucesso!');
