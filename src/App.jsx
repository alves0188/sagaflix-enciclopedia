import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import UniverseView from './components/UniverseView';
import AuthorModal from './components/AuthorModal';
import NewBookModal from './components/NewBookModal';
import CuratorDashboard from './components/CuratorDashboard';
import AuthorDashboard from './components/AuthorDashboard';
import ReaderDashboard from './components/ReaderDashboard';
import { BookOpen, LogOut, Settings, Plus, User, Bell, X, Upload } from 'lucide-react';

export default function App() {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentBookId, setCurrentBookId] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [showNewBook, setShowNewBook] = useState(false);
  const [authView, setAuthView] = useState('login'); 
  const [showNotifications, setShowNotifications] = useState(false);
  const [focusAuthorId, setFocusAuthorId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileUploading, setProfileUploading] = useState(false);
  const [initialUniverseTab, setInitialUniverseTab] = useState('home');

  // Roteamento Nativo Simples
  const path = window.location.pathname;
  let portalRole = 'reader';
  if (path.startsWith('/curador')) portalRole = 'curator';
  if (path.startsWith('/autor')) portalRole = 'author';

  const fetchData = async () => {
    try {
      const res = await fetch(window.API_BASE_URL + '/api/data');
      const data = await res.json();
      setDb(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar dados.', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateData = async (newData) => {
    setDb(newData);
    if (currentUser) {
      const latestUser = newData.users.find(u => u.id === currentUser.id);
      if (latestUser) {
        setCurrentUser(latestUser);
      }
    }
    try {
      await fetch(window.API_BASE_URL + '/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
    } catch (err) {
      console.error('Erro ao salvar.', err);
    }
  };

  const handleLogin = (user, newDb) => {
    setCurrentUser(user);
    if (newDb) setDb(newDb);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentBookId(null);
  };

  const handleOpenProfileModal = () => {
    setProfileForm({
      name: currentUser.name || '',
      email: currentUser.email || '',
      password: currentUser.password || '',
      avatar: currentUser.avatar || '',
      bio: currentUser.bio || '',
      about: currentUser.about || '',
      location: currentUser.location || '',
      writingStyle: currentUser.writingStyle || ''
    });
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email || !profileForm.password) {
      alert('Nome, e-mail e senha são obrigatórios.');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: profileForm.name,
      email: profileForm.email,
      password: profileForm.password,
      avatar: profileForm.avatar,
      bio: profileForm.bio,
      about: profileForm.about,
      location: profileForm.location,
      writingStyle: profileForm.writingStyle
    };

    const newDb = { ...db };
    newDb.users = newDb.users.map(u => u.id === currentUser.id ? updatedUser : u);
    
    if (currentUser.role === 'curator') {
      if (!newDb.auditLogs) newDb.auditLogs = [];
      newDb.auditLogs.push({
        id: 'audit_' + Date.now() + Math.floor(Math.random() * 1000),
        curatorId: currentUser.id,
        curatorName: updatedUser.name,
        action: 'Configurações Pessoais',
        details: `Atualizou seus dados pessoais (Nome, E-mail, Avatar ou Bio)`,
        date: new Date().toLocaleString('pt-BR')
      });
    }

    setCurrentUser(updatedUser);
    await handleUpdateData(newDb);
    setShowProfileModal(false);
    alert('Configurações salvas com sucesso!');
  };

  const handleProfileAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfileUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch(window.API_BASE_URL + '/api/upload', {
        method: 'POST',
        body: uploadData
      });
      const resData = await res.json();
      if (resData.url) {
        setProfileForm(prev => ({ ...prev, avatar: resData.url }));
      }
    } catch (err) {
      console.error("Erro no upload de avatar", err);
      alert("Erro ao fazer upload da imagem.");
    }
    setProfileUploading(false);
    e.target.value = null;
  };

  if (loading || !db) return <div style={{ color: 'white', padding: '3rem', textAlign: 'center' }}>Carregando Plataforma...</div>;

  // Fluxo não logado (separado por portal)
  if (!currentUser) {
    if (authView === 'login') {
      return <Login onLogin={handleLogin} onNavigateRegister={() => setAuthView('register')} portalRole={portalRole} />;
    } else {
      return <Register onNavigateLogin={() => setAuthView('login')} onRegisterSuccess={handleLogin} portalRole={portalRole} />;
    }
  }

  // Se o usuário logou, garantir que ele está no portal certo
  // (Ex: Um leitor não pode logar na URL /curador)
  if (currentUser.role !== portalRole) {
    return (
      <div style={{ color: 'white', padding: '3rem', textAlign: 'center' }}>
        <h2>Acesso Negado</h2>
        <p>Seu perfil de <strong>{currentUser.role}</strong> não tem permissão para acessar o portal <strong>{portalRole}</strong>.</p>
        <button onClick={handleLogout} className="btn-primary" style={{ marginTop: '1rem' }}>Sair e tentar novamente</button>
      </div>
    );
  }

  // Se um livro estiver aberto, mostra o Universo
  if (currentBookId && currentUser.role !== 'curator') {
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

  const publishedBooks = db.books.filter(b => b.status === 'published'); 
  const userNotifications = db.notifications ? (
    currentUser.role === 'curator' 
      ? db.notifications 
      : db.notifications.filter(n => 
          n.authorId === currentUser.id || 
          n.userId === currentUser.id || 
          n.userId === 'all' || 
          (n.userId === 'all_authors' && currentUser.role === 'author') || 
          (n.userId === 'all_readers' && currentUser.role === 'reader')
        )
  ) : [];
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif) => {
    // Marcar a notificação como lida no DB global
    const newDb = { ...db };
    const notifIndex = newDb.notifications.findIndex(n => n.id === notif.id);
    if (notifIndex !== -1 && !newDb.notifications[notifIndex].read) {
      newDb.notifications[notifIndex].read = true;
      handleUpdateData(newDb);
    }

    if (notif.type === 'message') {
      alert(`📩 MENSAGEM DA CURADORIA:\n\n"${notif.details}"\n\nEnviado em: ${notif.date}`);
    }

    if (currentUser.role === 'curator') {
      setFocusAuthorId(notif.authorId);
    }
    setShowNotifications(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Global */}
      <header style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', padding: '1rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <BookOpen size={32} color="var(--accent-gold)" />
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0, fontSize: '1.5rem' }}>
            Sagaflix {portalRole === 'curator' ? '- CURADORIA' : portalRole === 'author' ? '- ESTÚDIO' : ''}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', position: 'relative' }}>
              <Bell size={24} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#f44336', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 'bold' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div style={{ position: 'absolute', top: '40px', right: '-50px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '300px', maxHeight: '400px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                <h4 style={{ margin: 0, padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Notificações</h4>
                {userNotifications.length === 0 ? (
                  <p style={{ padding: '1rem', color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Nenhuma notificação.</p>
                ) : (
                  userNotifications.slice().reverse().map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: n.read ? 'transparent' : 'rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(255,255,255,0.05)'}
                    >
                      <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>{n.action}</p>
                      {n.type === 'message' ? (
                        <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.3' }}>
                          {n.details}
                        </p>
                      ) : (
                        <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>{n.bookTitle}</p>
                      )}
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.date}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }} onClick={handleOpenProfileModal}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-main)', border: '1px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={20} color="var(--accent-gold)" />
              )}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Olá, <strong style={{ color: 'var(--text-main)' }}>{currentUser.name}</strong>
              <Settings size={14} style={{ color: 'var(--accent-gold)' }} />
            </span>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff7777', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      {/* Áreas exclusivas por Perfil */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
        
        {/* VIEW DO CURADOR (FASE 2) */}
        {currentUser.role === 'curator' && (
          <CuratorDashboard db={db} onUpdateData={handleUpdateData} currentUser={currentUser} focusAuthorId={focusAuthorId} setFocusAuthorId={setFocusAuthorId} />
        )}

        {/* VIEW DO AUTOR */}
        {currentUser.role === 'author' && (
          <AuthorDashboard 
            db={db} 
            onUpdateData={handleUpdateData} 
            currentUser={currentUser} 
            onSelectBook={(bookId) => setCurrentBookId(bookId)}
            onOpenNewBook={() => setShowNewBook(true)}
          />
        )}

        {/* VIEW DO LEITOR (VITRINE) */}
        {currentUser.role === 'reader' && (
          <ReaderDashboard 
            db={db} 
            currentUser={currentUser} 
            onUpdateData={handleUpdateData} 
            onSelectBook={(bookId) => {
              setInitialUniverseTab('reader');
              setCurrentBookId(bookId);
            }}
            onSelectBookUniverse={(bookId) => {
              setInitialUniverseTab('home');
              setCurrentBookId(bookId);
            }}
          />
        )}

      </main>

      {selectedAuthor && (
        <AuthorModal author={selectedAuthor} db={db} onClose={() => setSelectedAuthor(null)} />
      )}

      {showNewBook && (
        <NewBookModal 
          onClose={() => setShowNewBook(false)}
          onSave={(bookData) => {
            const newId = 'book_' + Date.now();
            const newDb = { ...db };
            newDb.books.push({
              id: newId,
              title: bookData.title,
              synopsis: bookData.synopsis,
              cover: bookData.cover,
              authorId: currentUser.id,
              status: 'draft',
              universe: {
                chapters: [],
                characters: [],
                locations: [],
                items: [],
                events: []
              }
            });
            handleUpdateData(newDb);
            setShowNewBook(false);
            setCurrentBookId(newId);
          }}
        />
      )}

      {showProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', width: '550px', maxWidth: '95%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0 }}>Configurações Pessoais</h3>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto', maxHeight: '70vh', paddingRight: '0.5rem' }}>
              
              {/* Avatar Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid var(--accent-gold)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="Preview Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={50} color="var(--accent-gold)" />
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <label className="btn-secondary" style={{ flex: 1, cursor: 'pointer', margin: 0, padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {profileUploading ? 'Enviando...' : <><Upload size={14} /> Upload Foto</>}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileAvatarUpload} />
                  </label>
                  <input 
                    type="text" 
                    value={profileForm.avatar || ''} 
                    onChange={e => setProfileForm({ ...profileForm, avatar: e.target.value })} 
                    className="form-input" 
                    placeholder="Ou cole a URL da foto..." 
                    style={{ flex: 2, fontSize: '0.8rem', padding: '0.5rem' }} 
                  />
                </div>
              </div>

              {/* Nome */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nome Completo</label>
                <input 
                  type="text" 
                  value={profileForm.name || ''} 
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                  className="form-input" 
                  required 
                />
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>E-mail (Login)</label>
                <input 
                  type="email" 
                  value={profileForm.email || ''} 
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} 
                  className="form-input" 
                  disabled={currentUser.id === 'admin'}
                  required 
                />
              </div>

              {/* Senha */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Senha</label>
                <input 
                  type="password" 
                  value={profileForm.password || ''} 
                  onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} 
                  className="form-input" 
                  required 
                />
              </div>

              {/* Cidade / Origem (Autores e Curadores) */}
              {['author', 'curator'].includes(currentUser.role) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cidade / Origem</label>
                  <input 
                    type="text" 
                    value={profileForm.location || ''} 
                    onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} 
                    className="form-input" 
                    placeholder="Ex: São Paulo, Brasil" 
                  />
                </div>
              )}

              {/* Estilo de Escrita (Apenas Autores) */}
              {currentUser.role === 'author' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estilo de Escrita</label>
                  <input 
                    type="text" 
                    value={profileForm.writingStyle || ''} 
                    onChange={e => setProfileForm({ ...profileForm, writingStyle: e.target.value })} 
                    className="form-input" 
                    placeholder="Ex: Fantasia Épica, Suspense" 
                  />
                </div>
              )}

              {/* Biografia / Sobre (Autores e Curadores) */}
              {['author', 'curator'].includes(currentUser.role) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Biografia / Apresentação</label>
                  <textarea 
                    value={currentUser.role === 'author' ? (profileForm.bio || '') : (profileForm.about || '')} 
                    onChange={e => {
                      const field = currentUser.role === 'author' ? 'bio' : 'about';
                      setProfileForm({ ...profileForm, [field]: e.target.value });
                    }} 
                    className="form-input" 
                    rows="4"
                    placeholder="Conte um pouco sobre você..." 
                  ></textarea>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowProfileModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
