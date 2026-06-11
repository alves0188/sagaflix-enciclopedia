import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import UniverseView from './components/UniverseView';
import Reader from './components/Reader';
import CuratorDashboard from './components/CuratorDashboard';
import AuthorDashboard from './components/AuthorDashboard';
import ReaderDashboard from './components/ReaderDashboard';
import NewBookModal from './components/NewBookModal';
import { supabase, uploadImage } from './lib/supabaseClient';
import { BookOpen, LogOut, Settings, Plus, User, Bell, X, Upload, Eye, EyeOff, CheckCircle, XCircle, Menu } from 'lucide-react';

export default function App() {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sagaflix_user');
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      return null;
    }
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [currentBookId, setCurrentBookIdState] = useState(() => {
    try { return localStorage.getItem('sagaflix_bookId') || null; } catch { return null; }
  });
  const setCurrentBookId = (id) => {
    setCurrentBookIdState(id);
    if (id) localStorage.setItem('sagaflix_bookId', id);
    else localStorage.removeItem('sagaflix_bookId');
  };

  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [showNewBook, setShowNewBook] = useState(false);
  const [authView, setAuthView] = useState('login'); 
  const [showNotifications, setShowNotifications] = useState(false);
  const [focusAuthorId, setFocusAuthorId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileUploading, setProfileUploading] = useState(false);
  const [viewRoleOverride, setViewRoleOverride] = useState(null);
  const [initialUniverseTabState, setInitialUniverseTabState] = useState(() => {
    try { return localStorage.getItem('sagaflix_universeTab') || 'home'; } catch { return 'home'; }
  });
  const initialUniverseTab = initialUniverseTabState;
  const setInitialUniverseTab = (tab) => {
    setInitialUniverseTabState(tab);
    localStorage.setItem('sagaflix_universeTab', tab);
  };

  const [readerActiveTab, setReaderActiveTabState] = useState(() => {
    try { return localStorage.getItem('sagaflix_readerTab') || 'vitrine'; } catch { return 'vitrine'; }
  });
  const setReaderActiveTab = (tab) => {
    setReaderActiveTabState(tab);
    localStorage.setItem('sagaflix_readerTab', tab);
  };

  const [authorActiveTab, setAuthorActiveTabState] = useState(() => {
    try { return localStorage.getItem('sagaflix_authorTab') || 'dashboard'; } catch { return 'dashboard'; }
  });
  const setAuthorActiveTab = (tab) => {
    setAuthorActiveTabState(tab);
    localStorage.setItem('sagaflix_authorTab', tab);
  };

  const [showProfilePassword, setShowProfilePassword] = useState(false);

  // Email and password recovery states
  const params = new URLSearchParams(window.location.search);
  const verificationToken = params.get('token');
  const isVerificationRoute = window.location.pathname === '/verificar-email';
  const isResetRoute = window.location.pathname === '/recuperar-senha';

  const [verifying, setVerifying] = useState(isVerificationRoute);
  const [verifyStatus, setVerifyStatus] = useState('verifying');
  const [verifyMessage, setVerifyMessage] = useState('');
  
  const [resetTokenActive, setResetTokenActive] = useState(isResetRoute ? verificationToken : null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  // Roteamento Nativo Simples
  const path = window.location.pathname;
  let portalRole = 'reader';
  if (path.startsWith('/curador')) portalRole = 'curator';
  if (path.startsWith('/autor')) portalRole = 'author';

  const viewRole = viewRoleOverride || (currentUser ? currentUser.role : null);

  const handleVerifyEmail = async (token) => {
    try {
      const { data: dbData, error } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
      if (error || !dbData) throw new Error('Database connection failed');
      
      const db = dbData.data;
      const userIndex = db.users.findIndex(u => u.verificationToken === token);
      
      if (userIndex === -1) {
        setVerifyStatus('error');
        setVerifyMessage('Token de confirmação inválido ou expirado.');
        return;
      }

      const user = db.users[userIndex];
      const newStatus = user.role === 'author' ? 'pending_approval' : 'active';
      
      db.users[userIndex] = { ...user, status: newStatus, verificationToken: null };
      
      // Se for autor, atualizar também a requisição
      if (user.role === 'author' && db.authorRequests) {
        const reqIndex = db.authorRequests.findIndex(r => r.userId === user.id);
        if (reqIndex !== -1) {
          db.authorRequests[reqIndex].status = 'pending_approval';
        }
      }

      await supabase.from('sagaflix_db').update({ data: db }).eq('id', 1);

      setVerifyStatus('success');
      setVerifyMessage(user.role === 'author' 
        ? 'E-mail verificado com sucesso! Sua conta de autor agora foi enviada para análise da curadoria. Você receberá um e-mail quando for aprovado.' 
        : 'E-mail verificado com sucesso! Sua conta está ativa. Você já pode fazer login.'
      );
    } catch (err) {
      setVerifyStatus('error');
      setVerifyMessage('Erro de conexão ao verificar e-mail.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    
    if (newPassword !== confirmNewPassword) {
      setResetError('As senhas digitadas não coincidem.');
      return;
    }

    try {
      const res = await fetch(window.API_BASE_URL + '/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetTokenActive, password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Senha redefinida com sucesso! Você já pode logar com a nova senha.');
        window.history.replaceState({}, document.title, '/');
        setResetTokenActive(null);
      } else {
        setResetError(data.error || 'Erro ao redefinir a senha.');
      }
    } catch (err) {
      setResetError('Erro de conexão ao redefinir a senha.');
    }
  };

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
      if (error) throw error;
      const data = result.data;
      
      // Injeta o prêmio "Detetive do Ano" se não existir
      if (!data.gamificationBadges) data.gamificationBadges = [];
      if (!data.gamificationBadges.find(b => b.name === 'Detetive do ano')) {
        data.gamificationBadges.push({
          id: 'bdg_detetive_ano',
          name: 'Detetive do ano',
          description: 'Mestre da investigação: solicitou e teve acesso aprovado a mais de 100 notas secretas de autores.',
          icon: '🕵️‍♂️',
          conditionTarget: 'secretNotesApproved',
          conditionOperator: '>=',
          conditionValue: 100,
          color: '#FFCC80'
        });
        await supabase.from('sagaflix_db').update({ data: data }).eq('id', 1);
      }

      setDb(data);
      
      const saved = localStorage.getItem('sagaflix_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const latest = data.users.find(u => u.id === parsed.id);
          if (latest) {
            setCurrentUser(latest);
            localStorage.setItem('sagaflix_user', JSON.stringify(latest));
          } else {
            setCurrentUser(null);
            localStorage.removeItem('sagaflix_user');
          }
        } catch (e) {
          localStorage.removeItem('sagaflix_user');
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar dados.', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isVerificationRoute && verificationToken) {
      handleVerifyEmail(verificationToken);
    }
  }, []);

  const handleUpdateData = async (newData) => {
    setDb(newData);
    if (currentUser) {
      const latestUser = newData.users.find(u => u.id === currentUser.id);
      if (latestUser) {
        setCurrentUser(latestUser);
        localStorage.setItem('sagaflix_user', JSON.stringify(latestUser));
      }
    }
    try {
      const { error } = await supabase.from('sagaflix_db').update({ data: newData }).eq('id', 1);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao salvar.', err);
    }
  };

  const handleLogin = (user, newDb) => {
    setCurrentUser(user);
    localStorage.setItem('sagaflix_user', JSON.stringify(user));
    if (newDb) setDb(newDb);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentBookId(null);
    localStorage.removeItem('sagaflix_user');
    localStorage.removeItem('sagaflix_bookId');
    localStorage.removeItem('sagaflix_universeTab');
    localStorage.removeItem('sagaflix_readerTab');
    localStorage.removeItem('sagaflix_authorTab');
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
    setIsEditingProfile(false);
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
    localStorage.setItem('sagaflix_user', JSON.stringify(updatedUser));
    await handleUpdateData(newDb);
    setIsEditingProfile(false);
    alert('Configurações salvas com sucesso!');
  };

  const handleProfileAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfileUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setProfileForm(prev => ({ ...prev, avatar: url }));
      }
    } catch (err) {
      console.error("Erro no upload de avatar", err);
      alert(err.message || "Erro ao fazer upload da imagem.");
    }
    setProfileUploading(false);
    e.target.value = null;
  };

  if (loading || !db) return <div style={{ color: 'white', padding: '3rem', textAlign: 'center' }}>Carregando Plataforma...</div>;

  // Tela de verificação de e-mail
  if (verifying) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
        <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <BookOpen size={48} color="var(--accent-gold)" style={{ marginBottom: '1.5rem' }} />
          </div>
          
          {verifyStatus === 'verifying' && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>Confirmando seu E-mail</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Estamos ativando sua conta. Aguarde um instante...</p>
            </div>
          )}

          {verifyStatus === 'success' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle size={48} color="#4caf50" />
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#4caf50' }}>E-mail Confirmado!</h2>
              <p style={{ color: 'var(--text-main)', marginTop: '1rem', lineHeight: '1.5' }}>{verifyMessage}</p>
              <button 
                onClick={() => { window.history.replaceState({}, document.title, '/'); setVerifying(false); }} 
                className="btn-primary" 
                style={{ width: '100%', padding: '1rem', marginTop: '2rem' }}
              >
                IR PARA O LOGIN
              </button>
            </div>
          )}

          {verifyStatus === 'error' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <XCircle size={48} color="#f44336" />
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#f44336' }}>Erro na Confirmação</h2>
              <p style={{ color: 'var(--text-main)', marginTop: '1rem', lineHeight: '1.5' }}>{verifyMessage}</p>
              <button 
                onClick={() => { window.history.replaceState({}, document.title, '/'); setVerifying(false); }} 
                className="btn-secondary" 
                style={{ width: '100%', padding: '1rem', marginTop: '2rem' }}
              >
                VOLTAR AO LOGIN
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela de Redefinição de Senha
  if (resetTokenActive) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
        <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <BookOpen size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0, fontSize: '1.8rem', textAlign: 'center' }}>Nova Senha</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem', textAlign: 'center' }}>Escolha sua nova credencial de acesso</p>
          </div>

          {resetError && <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff7777', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{resetError}</div>}

          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPassword ? 'text' : 'password'} 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem 2.5rem 0.8rem 0.8rem', borderRadius: '4px' }} 
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)} 
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Confirmar Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmNewPassword ? 'text' : 'password'} 
                  value={confirmNewPassword} 
                  onChange={e => setConfirmNewPassword(e.target.value)} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem 2.5rem 0.8rem 0.8rem', borderRadius: '4px' }} 
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} 
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '1rem' }}>
              SALVAR NOVA SENHA
            </button>
          </form>

          <button 
            onClick={() => { window.history.replaceState({}, document.title, '/'); setResetTokenActive(null); }} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

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
  const isAuthorOnReaderPortal = currentUser.role === 'author' && portalRole === 'reader';
  
  if (currentUser.role !== portalRole && !isAuthorOnReaderPortal) {
    return (
      <div style={{ color: 'white', padding: '3rem', textAlign: 'center' }}>
        <h2>Acesso Negado</h2>
        <p>Seu perfil de <strong>{currentUser.role}</strong> não tem permissão para acessar o portal <strong>{portalRole}</strong>.</p>
        <button onClick={handleLogout} className="btn-primary" style={{ marginTop: '1rem' }}>Sair e tentar novamente</button>
      </div>
    );
  }

  // Se um livro estiver aberto, mostra o Universo
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
      <header style={{ 
        background: 'var(--card-bg)', 
        borderBottom: '1px solid var(--border-color)', 
        padding: isMobile ? '0.8rem 1rem' : '1rem 3rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem' }}>
          {isMobile && currentUser && currentUser.role !== 'reader' && (
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            >
              <Menu size={24} />
            </button>
          )}
          <BookOpen size={isMobile ? 24 : 32} color="var(--accent-gold)" />
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
            Sagaflix {viewRole === 'curator' ? 'Curadoria' : viewRole === 'author' ? 'Studio' : ''}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '1rem' : '2rem' }}>
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Bell size={22} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#f44336', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '10px', fontWeight: 'bold' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div style={{ position: 'absolute', top: '40px', right: isMobile ? '-100px' : '-50px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '280px', maxHeight: '400px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={handleOpenProfileModal}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-main)', border: '1px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={18} color="var(--accent-gold)" />
              )}
            </div>
            {!isMobile && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Olá, <strong style={{ color: 'var(--text-main)' }}>{currentUser.name}</strong>
                <Settings size={14} style={{ color: 'var(--accent-gold)' }} />
              </span>
            )}
            {isMobile && (
              <Settings size={18} style={{ color: 'var(--accent-gold)' }} />
            )}
          </div>
        </div>
      </header>

      {/* Áreas exclusivas por Perfil */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '1rem 0.5rem' : '2rem', 
        maxWidth: isMobile ? '100%' : '1800px', 
        margin: '0 auto', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* VIEW DO CURADOR (FASE 2) */}
        {viewRole === 'curator' && (
          <CuratorDashboard db={db} onUpdateData={handleUpdateData} currentUser={currentUser} focusAuthorId={focusAuthorId} setFocusAuthorId={setFocusAuthorId} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        )}

        {/* VIEW DO AUTOR */}
        {viewRole === 'author' && (
          <AuthorDashboard 
            db={db} 
            onUpdateData={handleUpdateData} 
            currentUser={currentUser} 
            activeTab={authorActiveTab}
            onTabChange={setAuthorActiveTab}
            onSelectBook={(bookId) => setCurrentBookId(bookId)}
            onOpenNewBook={() => setShowNewBook(true)}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        )}

        {/* VIEW DO LEITOR (VITRINE) */}
        {viewRole === 'reader' && (
          <ReaderDashboard 
            db={db} 
            currentUser={currentUser} 
            onUpdateData={handleUpdateData} 
            initialActiveTab={readerActiveTab}
            onTabChange={setReaderActiveTab}
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
          <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', width: '550px', maxWidth: '95%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0 }}>
                {isEditingProfile ? 'Editar Configurações' : 'Configurações Pessoais'}
              </h3>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            {!isEditingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', overflowY: 'auto', padding: '1rem 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '3px solid var(--accent-gold)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={60} color="var(--accent-gold)" />
                    )}
                  </div>
                  <h2 style={{ color: 'var(--text-main)', margin: '0.5rem 0 0 0', fontSize: '1.4rem' }}>{currentUser.name}</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>ID: {currentUser.id}</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  
                  {currentUser.role === 'author' && (
                    <button 
                      onClick={() => {
                        setViewRoleOverride(viewRole === 'author' ? 'reader' : 'author');
                        setShowProfileModal(false);
                      }}
                      className="btn-primary" 
                      style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'var(--accent-gold)', color: '#000' }}
                    >
                      <User size={18} /> {viewRole === 'author' ? 'Mudar para Conta de Leitor' : 'Voltar para o Estúdio (Autor)'}
                    </button>
                  )}

                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="btn-primary" 
                    style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Settings size={18} /> Configuração de Conta
                  </button>
                  <button 
                    onClick={() => {
                      setShowProfileModal(false);
                      handleLogout();
                    }}
                    style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'none', border: '1px solid #ff7777', color: '#ff7777', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 119, 119, 0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <LogOut size={18} /> Sair da Conta
                  </button>
                </div>
              </div>
            ) : (
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
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showProfilePassword ? 'text' : 'password'} 
                    value={profileForm.password || ''} 
                    onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} 
                    className="form-input" 
                    style={{ paddingRight: '2.5rem', width: '100%' }}
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowProfilePassword(!showProfilePassword)} 
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showProfilePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary">Salvar Alterações</button>
                </div>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
