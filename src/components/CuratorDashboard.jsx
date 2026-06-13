import { useState, useEffect } from 'react';
import { User, Users, BookOpen, AlertCircle, Check, X, MessageSquare, ArrowLeft, Bell, FileText, Send, CheckCircle, ShieldAlert, BarChart2, TrendingUp, Clock, Smartphone, MapPin, Edit3, Calendar, Activity, DollarSign, Target, PieChart, Star, UserPlus, Trash2, Image, Search, LayoutDashboard, Award, Upload, Save, Edit, Plus, Ban, Download } from 'lucide-react';
import AdminPanel from './AdminPanel';
import AuthorDashboard from './AuthorDashboard';
import ReaderDashboard from './ReaderDashboard';
import HQModal from './HQModal';
import { supabase, uploadImage } from '../lib/supabaseClient';
import { sendEmail } from '../lib/emailjs';

const ROLE_PRESETS = {
  admin: {
    dashboard_access: true,
    view_authors: true,
    notifications_access: true,
    approve_books: true,
    manage_review_requests: true,
    send_messages: true,
    manage_team: true,
    manage_banners: true,
    cms_edit: true,
    cms_chapters: true,
    cms_pages: true,
    cms_characters: true,
    cms_locations: true,
    cms_organizations: true,
    cms_clues: true,
    cms_posts: true,
    cms_events: true,
    support_technical_access: true,
    support_curator_access: true,
    support_financial_access: true,
    support_other_access: true
  },
  approver: {
    dashboard_access: true,
    view_authors: true,
    notifications_access: true,
    approve_books: true,
    manage_review_requests: true,
    send_messages: true,
    manage_team: false,
    manage_banners: true,
    cms_edit: true,
    cms_chapters: true,
    cms_pages: true,
    cms_characters: true,
    cms_locations: true,
    cms_organizations: true,
    cms_clues: true,
    cms_posts: true,
    cms_events: true,
    support_technical_access: true,
    support_curator_access: true,
    support_financial_access: true,
    support_other_access: true
  },
  redator: {
    dashboard_access: true,
    view_authors: true,
    notifications_access: false,
    approve_books: false,
    manage_review_requests: false,
    send_messages: false,
    manage_team: false,
    manage_banners: false,
    cms_edit: false,
    cms_chapters: true,
    cms_pages: true,
    cms_characters: true,
    cms_locations: true,
    cms_organizations: true,
    cms_clues: true,
    cms_posts: true,
    cms_events: true,
    support_technical_access: false,
    support_curator_access: true,
    support_financial_access: false,
    support_other_access: true
  },
  revisor: {
    dashboard_access: false,
    view_authors: true,
    notifications_access: false,
    approve_books: false,
    manage_review_requests: false,
    send_messages: false,
    manage_team: false,
    manage_banners: false,
    cms_edit: false,
    cms_chapters: true,
    cms_pages: false,
    cms_characters: false,
    cms_locations: false,
    cms_organizations: false,
    cms_clues: false,
    cms_posts: false,
    cms_events: false,
    support_technical_access: false,
    support_curator_access: false,
    support_financial_access: false,
    support_other_access: false
  }
};

const getCuratorPermissions = (user) => {
  if (!user) return ROLE_PRESETS.revisor;
  const role = user.curatorRole || 'admin';
  const preset = ROLE_PRESETS[role] || ROLE_PRESETS.admin;
  return { ...preset, ...(user.permissions || {}) };
};

export default function CuratorDashboard({ db, onUpdateData, currentUser, focusAuthorId, setFocusAuthorId, isSidebarOpen, setIsSidebarOpen, onSelectBook, onSelectBookUniverse }) {
  const permissions = getCuratorPermissions(currentUser);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashTab, setDashTab] = useState('geral');
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showHqModal, setShowHqModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [viewingAuthorDashId, setViewingAuthorDashId] = useState(null);
  
  const [msgTarget, setMsgTarget] = useState('all');
  const [msgText, setMsgText] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [authorSearchText, setAuthorSearchText] = useState('');
  
  // Modais de Gestão de Usuários
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({ name: '', email: '', phone: '', role: 'author', avatar: '', bio: '', incompleteProfile: false });
  const [selectedReaderDossier, setSelectedReaderDossier] = useState(null);
  const [authorIdSearchText, setAuthorIdSearchText] = useState('');
  const [authorLetterFilter, setAuthorLetterFilter] = useState('');

  // ESTADOS DO INBOX/CHAMADOS DE SUPORTE
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [supportStatusFilter, setSupportStatusFilter] = useState('open'); // 'open' | 'resolved' | 'all'
  const [supportSearchText, setSupportSearchText] = useState('');
  const [supportCategoryFilter, setSupportCategoryFilter] = useState('all'); // 'all' | 'technical' | 'curator' | 'financial' | 'other'

  // ESTADOS DA EQUIPE DE CURADORES E AUDITORIA
  const [equipeSubTab, setEquipeSubTab] = useState('membros');
  const [showCuratorModal, setShowCuratorModal] = useState(false);
  const [editingCurator, setEditingCurator] = useState(null);
  const [curatorForm, setCuratorForm] = useState({ name: '', email: '', password: '', curatorRole: 'approver' });
  const [auditSearchText, setAuditSearchText] = useState('');
  const [auditCuratorFilter, setAuditCuratorFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // ESTADOS DO GERENCIADOR DE BANNERS
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerFormData, setBannerFormData] = useState({ id: '', title: '', description: '', imageUrl: '', actionUrl: '', actionText: '' });
  const [bannerUploading, setBannerUploading] = useState(false);

  // ESTADOS DA GAMIFICAÇÃO
  const [gamificacaoSubTab, setGamificacaoSubTab] = useState('badges');
  const [editingBadge, setEditingBadge] = useState(null);
  const [badgeForm, setBadgeForm] = useState({ id: '', name: '', description: '', icon: '', minPages: 0 });
  const [badgeUploading, setBadgeUploading] = useState(false);

  useEffect(() => {
    if (focusAuthorId) {
      const author = db.users.find(u => u.id === focusAuthorId);
      if (author) {
        setSelectedAuthor(author);
        setSelectedBook(null);
      }
      if (setFocusAuthorId) setFocusAuthorId(null);
    }
  }, [focusAuthorId, db, setFocusAuthorId]);

  // REDIRECIONAMENTO DE ABAS POR PERMISSÕES
  useEffect(() => {
    const perms = getCuratorPermissions(currentUser);
    const tabs = ['dashboard', 'autores', 'leitores', 'novos_pedidos', 'reprovados', 'notifications', 'curadoria', 'revisoes', 'mensagens', 'banners', 'gamificacao', 'equipe'];
    
    const isAllowed = (tab) => {
      if (tab === 'dashboard') return perms.dashboard_access;
      if (tab === 'autores') return perms.view_authors;
      if (tab === 'notifications') return perms.notifications_access;
      if (tab === 'curadoria') return perms.approve_books;
      if (tab === 'revisoes') return perms.manage_review_requests;
      if (tab === 'mensagens') return perms.send_messages;
      if (tab === 'banners') return perms.manage_banners;
      if (tab === 'equipe') return perms.manage_team;
      if (tab === 'leitores') return perms.view_authors;
      if (tab === 'novos_pedidos') return perms.approve_books;
      if (tab === 'reprovados') return perms.approve_books;
      if (tab === 'gamificacao') return perms.dashboard_access; // Mesma permissão do hasAccess
      return false;
    };

    if (!isAllowed(activeTab)) {
      const fallbackTab = tabs.find(isAllowed);
      if (fallbackTab) {
        setActiveTab(fallbackTab);
      }
    }
  }, [currentUser, activeTab]);

  const authors = db.users.filter(u => u.role === 'author' && !['pending_approval', 'pending_email', 'pending', 'rejected'].includes(u.status));
  const readers = db.users.filter(u => u.role === 'reader');
  const notifications = db.notifications || [];

  // FUNÇÃO AUXILIAR DE LOG DE CURADORIA
  const logCuratorAction = (action, details, targetDb = db) => {
    const newDb = { ...targetDb };
    if (!newDb.auditLogs) newDb.auditLogs = [];
    newDb.auditLogs.push({
      id: 'audit_' + Date.now() + Math.floor(Math.random() * 1000),
      curatorId: currentUser.id,
      curatorName: (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)),
      action: action,
      details: details,
      date: new Date().toLocaleString('pt-BR')
    });
    return newDb;
  };

  const handleEditBanner = (banner) => {
    setEditingBanner(banner);
    setBannerFormData({
      id: banner.id,
      title: banner.title || '',
      description: banner.description || '',
      imageUrl: banner.imageUrl || '',
      actionUrl: banner.actionUrl || '',
      actionText: banner.actionText || 'Ler Agora'
    });
  };

  const handleNewBanner = () => {
    setEditingBanner('new');
    setBannerFormData({
      id: 'banner_' + Date.now(),
      title: '',
      description: '',
      imageUrl: '',
      actionUrl: '',
      actionText: 'Ler Agora'
    });
  };

  const handleDeleteBanner = (bannerId) => {
    if (window.confirm("Deseja realmente excluir este banner?")) {
      let newDb = { ...db };
      const bannerToDelete = (newDb.banners || []).find(b => b.id === bannerId);
      newDb.banners = (newDb.banners || []).filter(b => b.id !== bannerId);
      
      newDb = logCuratorAction(
        'Exclusão de Banner',
        `Removeu o banner "${bannerToDelete ? bannerToDelete.title : bannerId}"`,
        newDb
      );
      onUpdateData(newDb);
      alert("Banner excluído com sucesso!");
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBannerUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setBannerFormData(prev => ({ ...prev, imageUrl: url }));
      }
    } catch (err) {
      console.error("Erro no upload do banner", err);
      alert(err.message || "Erro ao fazer upload da imagem do banner.");
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSaveBanner = (e) => {
    e.preventDefault();
    if (!bannerFormData.title || !bannerFormData.imageUrl) {
      alert("Por favor, preencha o título e a imagem do banner.");
      return;
    }

    let newDb = { ...db };
    if (!newDb.banners) newDb.banners = [];

    const isNew = editingBanner === 'new';
    
    if (isNew) {
      newDb.banners.push({ ...bannerFormData });
      newDb = logCuratorAction(
        'Criação de Banner',
        `Criou o banner "${bannerFormData.title}"`,
        newDb
      );
    } else {
      newDb.banners = newDb.banners.map(b => b.id === bannerFormData.id ? { ...bannerFormData } : b);
      newDb = logCuratorAction(
        'Edição de Banner',
        `Editou o banner "${bannerFormData.title}"`,
        newDb
      );
    }

    onUpdateData(newDb);
    setEditingBanner(null);
    alert(isNew ? "Banner criado com sucesso!" : "Banner editado com sucesso!");
  };

  const renderBanners = () => {
    return (
      <div style={{ padding: '2rem', color: 'var(--text-main)', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--accent-gold)', margin: '0 0 0.5rem 0' }}>Banners da Vitrine</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gerencie os destaques no topo do painel do leitor.</p>
          </div>
          <button onClick={() => {
            setEditingBanner(true);
            setBannerFormData({ id: 'bn_' + Date.now(), title: '', description: '', imageUrl: '', actionUrl: '', actionText: 'Começar a Ler' });
          }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Novo Banner
          </button>
        </div>

        {editingBanner && (
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', fontFamily: "'Playfair Display', serif" }}>{bannerFormData.id.startsWith('bn_') ? 'Novo Banner' : 'Editar Banner'}</h3>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Título</label>
                  <input type="text" value={bannerFormData.title} onChange={e => setBannerFormData({...bannerFormData, title: e.target.value})} className="form-input" placeholder="Ex: Lançamento do Ano" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Descrição</label>
                  <textarea value={bannerFormData.description} onChange={e => setBannerFormData({...bannerFormData, description: e.target.value})} className="form-input" placeholder="Breve texto sobre o banner" style={{ width: '100%', height: '80px', resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ação (Link ou ID do Livro)</label>
                    <input type="text" value={bannerFormData.actionUrl} onChange={e => setBannerFormData({...bannerFormData, actionUrl: e.target.value})} className="form-input" placeholder="Ex: book_12345" style={{ width: '100%' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Texto do Botão</label>
                    <input type="text" value={bannerFormData.actionText} onChange={e => setBannerFormData({...bannerFormData, actionText: e.target.value})} className="form-input" placeholder="Ex: Começar a Ler" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
              
              <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Imagem (Paisagem recomendada)</label>
                <div style={{ flex: 1, border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                  {bannerFormData.imageUrl ? (
                    <>
                      <img src={bannerFormData.imageUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                        <label style={{ cursor: 'pointer', color: '#fff', background: 'var(--accent-gold)', padding: '0.5rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Upload size={16} /> Trocar Imagem
                          <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUploadBannerImage(e.target.files[0])} disabled={bannerUploading} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      {bannerUploading ? <div className="loading-spinner" style={{ width: '24px', height: '24px', borderTopColor: 'var(--accent-gold)' }}></div> : <Image size={32} opacity={0.5} />}
                      <span style={{ fontSize: '0.9rem' }}>{bannerUploading ? 'Enviando...' : 'Fazer Upload'}</span>
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUploadBannerImage(e.target.files[0])} disabled={bannerUploading} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button onClick={() => setEditingBanner(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSaveBanner} className="btn-primary" disabled={bannerUploading || !bannerFormData.title || !bannerFormData.imageUrl}>
                <Save size={16} /> Salvar Banner
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {(db.banners || []).map((banner, idx) => (
            <div key={banner.id} style={{ display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ width: '300px', height: '160px', flexShrink: 0, position: 'relative' }}>
                <img src={banner.imageUrl} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.7)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
                  Ordem: {idx + 1}
                </div>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{banner.title}</h3>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{banner.description}</p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--accent-gold)' }}>Ação: {banner.actionUrl}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
                  <span style={{ color: 'var(--text-muted)' }}>Botão: {banner.actionText}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', borderLeft: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)', justifyContent: 'center', gap: '0.5rem' }}>
                <button onClick={() => setEditingBanner(banner)} style={{ background: 'none', border: 'none', color: '#2196F3', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }} title="Editar">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDeleteBanner(banner.id)} style={{ background: 'none', border: 'none', color: '#F44336', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }} title="Excluir">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {(!db.banners || db.banners.length === 0) && (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
              <Image size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Nenhum banner cadastrado. Os banners padrão serão exibidos para os leitores.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const togglePermission = (key) => {
    setCuratorForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const handleRolePresetChange = (role) => {
    const preset = ROLE_PRESETS[role] || ROLE_PRESETS.admin;
    setCuratorForm(prev => ({
      ...prev,
      curatorRole: role,
      permissions: { ...preset }
    }));
  };

  const handleSaveCurator = (e) => {
    e.preventDefault();
    if (!curatorForm.name || !curatorForm.email || !curatorForm.password) {
      alert('Preencha todos os campos!');
      return;
    }
    
    let newDb = { ...db };
    const selectedRole = curatorForm.curatorRole || 'approver';
    
    if (editingCurator) {
      const emailExists = newDb.users.some(u => u.email.toLowerCase() === curatorForm.email.toLowerCase() && u.id !== editingCurator.id);
      if (emailExists) {
        alert('Este e-mail já está em uso por outro usuário.');
        return;
      }
      
      if (editingCurator.id === 'admin') {
        curatorForm.email = 'admin';
      }

      newDb.users = newDb.users.map(u => {
        if (u.id === editingCurator.id) {
          return { 
            ...u, 
            name: curatorForm.name, 
            email: curatorForm.email, 
            password: curatorForm.password,
            curatorRole: editingCurator.id === 'admin' ? 'admin' : selectedRole,
            permissions: curatorForm.permissions
          };
        }
        return u;
      });

      newDb = logCuratorAction(
        'Edição de Curador',
        `Editou dados do curador "${curatorForm.name}" (${curatorForm.email}) - Perfil: ${editingCurator.id === 'admin' ? 'admin' : selectedRole}`,
        newDb
      );
      alert('Dados do curador atualizados!');
    } else {
      const emailExists = newDb.users.some(u => u.email.toLowerCase() === curatorForm.email.toLowerCase());
      if (emailExists) {
        alert('Este e-mail já está cadastrado.');
        return;
      }
      
      const newCuratorId = 'curator_' + Date.now();
      const newCurator = {
        id: newCuratorId,
        role: 'curator',
        curatorRole: selectedRole,
        name: curatorForm.name,
        email: curatorForm.email,
        password: curatorForm.password,
        permissions: curatorForm.permissions
      };
      
      newDb.users.push(newCurator);
      newDb = logCuratorAction(
        'Criação de Curador',
        `Adicionou o curador "${curatorForm.name}" (${curatorForm.email}) - Perfil: ${selectedRole}`,
        newDb
      );
      alert('Novo curador adicionado com sucesso!');
    }

    onUpdateData(newDb);
    setShowCuratorModal(false);
    setEditingCurator(null);
    setCuratorForm({ name: '', email: '', password: '', curatorRole: 'approver', permissions: { ...ROLE_PRESETS.approver } });
  };

  const handleDeleteCurator = (curatorId) => {
    if (curatorId === 'admin') {
      alert('O Administrador Principal (admin) não pode ser excluído.');
      return;
    }
    if (curatorId === currentUser.id) {
      alert('Você não pode excluir a si mesmo.');
      return;
    }
    
    const curator = db.users.find(u => u.id === curatorId);
    if (!curator) return;
    
    if (window.confirm(`Tem certeza de que deseja remover o curador "${curator.name}"? Ele perderá acesso ao painel.`)) {
      let newDb = { ...db };
      newDb.users = newDb.users.filter(u => u.id !== curatorId);
      
      newDb = logCuratorAction(
        'Exclusão de Curador',
        `Removeu o curador "${curator.name}" (${curator.email}) da equipe`,
        newDb
      );
      
      onUpdateData(newDb);
      alert('Curador removido com sucesso.');
    }
  };

  const renderEquipe = () => {
    const curatorsList = db.users.filter(u => u.role === 'curator');
    const auditLogs = db.auditLogs || [];
    
    const filteredLogs = auditLogs.filter(log => {
      const matchesSearch = log.details.toLowerCase().includes(auditSearchText.toLowerCase()) || 
                            log.action.toLowerCase().includes(auditSearchText.toLowerCase());
      const matchesCurator = auditCuratorFilter === 'all' ? true : log.curatorId === auditCuratorFilter;
      
      let matchesAction = true;
      if (auditActionFilter !== 'all') {
        if (auditActionFilter === 'approvals') {
          matchesAction = log.action.includes('Aprovação') || log.action.includes('Pedido Aceito') || log.action.includes('Pedido Rejeitado') || log.action.includes('Aprovou');
        } else if (auditActionFilter === 'messages') {
          matchesAction = log.action.includes('Mensagem') || log.action.includes('Envio de Mensagem');
        } else if (auditActionFilter === 'cms') {
          matchesAction = log.action.includes('CMS');
        } else if (auditActionFilter === 'team') {
          matchesAction = log.action.includes('Curador');
        }
      }
      
      return matchesSearch && matchesCurator && matchesAction;
    });

    const subTabStyle = (isActive) => ({
      padding: '0.8rem 1.5rem', 
      background: isActive ? 'var(--card-bg)' : 'transparent',
      color: isActive ? 'var(--accent-gold)' : 'var(--text-main)',
      border: '1px solid var(--border-color)', 
      borderBottom: isActive ? '3px solid var(--accent-gold)' : 'none',
      cursor: 'pointer', 
      fontWeight: 'bold', 
      borderRadius: '8px 8px 0 0', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem'
    });

    return (
      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Equipe de Curadoria</h2>
          {equipeSubTab === 'membros' && (
            <button 
              className="btn-primary" 
              onClick={() => {
                setEditingCurator(null);
                setCuratorForm({ 
                  name: '', 
                  email: '', 
                  password: '', 
                  curatorRole: 'approver', 
                  permissions: { ...ROLE_PRESETS.approver } 
                });
                setShowCuratorModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <UserPlus size={16} /> Adicionar Curador
            </button>
          )}
        </div>

        {/* Sub-Navegação */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', gap: '0.5rem' }}>
          <button onClick={() => setEquipeSubTab('membros')} style={subTabStyle(equipeSubTab === 'membros')}><Users size={16}/> Membros da Equipe</button>
          <button onClick={() => setEquipeSubTab('logs')} style={subTabStyle(equipeSubTab === 'logs')}><Activity size={16}/> Histórico de Auditoria</button>
        </div>

        {/* ================= ABA MEMBROS ================= */}
        {equipeSubTab === 'membros' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {curatorsList.map(curator => {
              const isSelf = curator.id === currentUser.id;
              const isAdmin = curator.id === 'admin';
              
              return (
                <div 
                  key={curator.id} 
                  style={{ 
                    background: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    padding: '1.8rem', 
                    position: 'relative',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.2rem', border: '3px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    {curator.avatar ? (
                      <img src={curator.avatar} alt={curator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={40} color="var(--accent-gold)" />
                    )}
                  </div>
                  
                  <h3 style={{ margin: '0 0 0.3rem 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>
                    {curator.name} {isSelf && <span style={{ fontSize: '0.75rem', background: 'var(--accent-gold)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '10px', marginLeft: '0.5rem', fontWeight: 'bold' }}>Você</span>}
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{curator.email}</p>
                  
                  {/* Badge de Perfil de Acesso */}
                  {(() => {
                    const role = curator.curatorRole || 'admin';
                    let label = 'Administrador';
                    let badgeColor = 'rgba(212, 175, 55, 0.15)'; // Gold for admin
                    let textColor = 'var(--accent-gold)';
                    
                    if (role === 'approver') {
                      label = 'Aprovador';
                      badgeColor = 'rgba(76, 175, 80, 0.15)'; // Green for approver
                      textColor = '#4CAF50';
                    } else if (role === 'redator') {
                      label = 'Redator';
                      badgeColor = 'rgba(33, 150, 243, 0.15)'; // Blue for redator
                      textColor = '#2196F3';
                    } else if (role === 'revisor') {
                      label = 'Revisor de Textos';
                      badgeColor = 'rgba(156, 39, 176, 0.15)'; // Purple for revisor
                      textColor = '#9C27B0';
                    }
                    
                    return (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        background: badgeColor, 
                        color: textColor, 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: '12px', 
                        fontWeight: 'bold', 
                        marginBottom: '1.5rem',
                        border: `1px solid ${textColor}33`
                      }}>
                        {label}
                      </span>
                    );
                  })()}
                  
                  <div style={{ display: 'flex', gap: '0.8rem', width: '100%', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button 
                      onClick={() => {
                        setEditingCurator(curator);
                        setCuratorForm({ 
                          name: curator.name, 
                          email: curator.email, 
                          password: curator.password,
                          curatorRole: curator.curatorRole || 'approver',
                          permissions: { 
                            ...(ROLE_PRESETS[curator.curatorRole || 'approver'] || ROLE_PRESETS.admin),
                            ...(curator.permissions || {}) 
                          }
                        });
                        setShowCuratorModal(true);
                      }}
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                    >
                      Editar
                    </button>
                    {!isAdmin && !isSelf && (
                      <button 
                        onClick={() => handleDeleteCurator(curator.id)}
                        className="btn-secondary" 
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', color: '#ff4444', borderColor: 'rgba(255, 68, 68, 0.2)' }}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= ABA AUDIT LOGS ================= */}
        {equipeSubTab === 'logs' && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent-gold)', fontFamily: "'Playfair Display', serif" }}>Histórico Completo de Auditoria</h3>
            
            {/* Linha de Filtros */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <input 
                type="text" 
                placeholder="Pesquisar por descrição..." 
                value={auditSearchText}
                onChange={e => setAuditSearchText(e.target.value)}
                style={{ flex: '2', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', minWidth: '250px' }}
              />
              <select 
                value={auditCuratorFilter} 
                onChange={e => setAuditCuratorFilter(e.target.value)}
                style={{ flex: '1', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', minWidth: '150px' }}
              >
                <option value="all">Todos os Curadores</option>
                {curatorsList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select 
                value={auditActionFilter} 
                onChange={e => setAuditActionFilter(e.target.value)}
                style={{ flex: '1', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', minWidth: '150px' }}
              >
                <option value="all">Todas as Ações</option>
                <option value="approvals">Aprovações e Revisões</option>
                <option value="messages">Centro de Mensagens</option>
                <option value="cms">Alterações de Livro (CMS)</option>
                <option value="team">Gestão da Equipe</option>
              </select>
            </div>

            {/* Tabela de Logs */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <th style={{ padding: '1rem 0.5rem', fontWeight: '500', width: '150px' }}>Data e Hora</th>
                    <th style={{ padding: '1rem 0.5rem', fontWeight: '500', width: '200px' }}>Curador</th>
                    <th style={{ padding: '1rem 0.5rem', fontWeight: '500', width: '180px' }}>Ação</th>
                    <th style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>Detalhes do Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum registro de auditoria encontrado.</td>
                    </tr>
                  ) : (
                    filteredLogs.slice().reverse().map(log => {
                      let badgeColor = '#555';
                      if (log.action.includes('Aprovação') || log.action.includes('Aceito') || log.action.includes('Aprovou')) badgeColor = '#4CAF50';
                      else if (log.action.includes('Rejeitado') || log.action.includes('Pedido Rejeitado')) badgeColor = '#f44336';
                      else if (log.action.includes('Mensagem') || log.action.includes('Envio')) badgeColor = '#2196F3';
                      else if (log.action.includes('CMS')) badgeColor = '#ff9800';
                      else if (log.action.includes('Curador')) badgeColor = '#9C27B0';
                      
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{log.date}</td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <strong style={{ color: 'var(--text-main)' }}>{log.curatorName}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {log.curatorId}</span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{ background: badgeColor, color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem', color: 'var(--text-main)' }}>
                            {log.details}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Curador (Novo / Edição) */}
        {showCuratorModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', width: '850px', maxWidth: '95%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', marginTop: 0, marginBottom: '0.5rem' }}>
                {editingCurator ? 'Editar Curador' : 'Adicionar Novo Curador'}
              </h3>
              
              <form onSubmit={handleSaveCurator} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                  {/* Coluna da Esquerda: Dados do Curador */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nome Completo</label>
                      <input 
                        type="text" 
                        value={curatorForm.name} 
                        onChange={e => setCuratorForm({ ...curatorForm, name: e.target.value })} 
                        className="form-input" 
                        placeholder="Ex: Mariana Silva" 
                        required 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>E-mail (Login)</label>
                      <input 
                        type="email" 
                        value={curatorForm.email} 
                        onChange={e => setCuratorForm({ ...curatorForm, email: e.target.value })} 
                        className="form-input" 
                        placeholder="Ex: mariana@sagaflix.com" 
                        disabled={editingCurator && editingCurator.id === 'admin'}
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Senha de Acesso</label>
                      <input 
                        type="password" 
                        value={curatorForm.password} 
                        onChange={e => setCuratorForm({ ...curatorForm, password: e.target.value })} 
                        className="form-input" 
                        placeholder="Defina a senha" 
                        required 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Perfil de Acesso</label>
                      <select 
                        value={curatorForm.curatorRole || 'approver'} 
                        onChange={e => handleRolePresetChange(e.target.value)}
                        className="form-input"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.8rem' }}
                        disabled={editingCurator && editingCurator.id === 'admin'}
                      >
                        <option value="admin">Administrador Geral</option>
                        <option value="approver">Aprovador (Curador de Obras)</option>
                        <option value="redator">Redator (Leitor do Universo)</option>
                        <option value="revisor">Revisor de Textos (Leitor de Capítulos)</option>
                      </select>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Escolher um perfil preenche as permissões padrão ao lado.</span>
                    </div>
                  </div>

                  {/* Coluna da Direita: Permissões Liga e Desliga */}
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: '400px', overflowY: 'auto' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-gold)' }}>Definir Permissões</h4>
                    
                    <div>
                      <h5 style={{ margin: '0 0 0.6rem 0', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem', fontSize: '0.85rem', fontWeight: 'bold' }}>Painel Geral (Abas)</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.dashboard_access ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('dashboard_access')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Dashboard</span>
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.view_authors ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('view_authors')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Ver Autores</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.notifications_access ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('notifications_access')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Notificações</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.approve_books ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('approve_books')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Curadoria</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.manage_review_requests ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('manage_review_requests')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Revisões</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.send_messages ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('send_messages')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Mensagens</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.manage_team ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('manage_team')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Equipe (Gerir)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.manage_banners ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('manage_banners')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Banners (Gerir)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 0.6rem 0', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem', fontSize: '0.85rem', fontWeight: 'bold' }}>Categorias de Suporte (Sessão de Atendimento)</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.support_technical_access ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('support_technical_access')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>ðŸ› ï¸ Suporte Técnico</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.support_curator_access ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('support_curator_access')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>📖 Curadoria</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.support_financial_access ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('support_financial_access')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>💰 Financeiro</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.support_other_access ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('support_other_access')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>â“ Outros Assuntos</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 0.6rem 0', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem', fontSize: '0.85rem', fontWeight: 'bold' }}>CMS do Livro</h5>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: '0.8rem', background: 'rgba(212, 175, 55, 0.05)', padding: '0.4rem', borderRadius: '4px' }}>
                        <input 
                          type="checkbox" 
                          checked={curatorForm.permissions?.cms_edit ?? true} 
                          disabled={editingCurator && editingCurator.id === 'admin'}
                          onChange={() => togglePermission('cms_edit')}
                          style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>Habilitar Escrita / Edição</span>
                      </label>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.cms_chapters ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('cms_chapters')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Capítulos</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.cms_pages ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('cms_pages')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Apresentações</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.cms_characters ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('cms_characters')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Personagens</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.cms_locations ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('cms_locations')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Locais</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.cms_organizations ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('cms_organizations')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Organizações</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.cms_clues ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('cms_clues')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Complementos</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.cms_posts ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('cms_posts')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Blog / Notícias</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={curatorForm.permissions?.cms_events ?? true} 
                            disabled={editingCurator && editingCurator.id === 'admin'}
                            onChange={() => togglePermission('cms_events')}
                            style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Eventos / Tags</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      setShowCuratorModal(false);
                      setEditingCurator(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleUpdateBookStatus = (bookId, newStatus) => {
    const newDb = { ...db };
    const bookIndex = newDb.books.findIndex(b => b.id === bookId);
    if (bookIndex >= 0) {
      const book = newDb.books[bookIndex];
      const bookTitle = book.title;
      book.status = newStatus;
      
      // Calcular datas de agendamento de capítulos ao publicar
      if (newStatus === 'published') {
        const releaseMode = book.releaseMode || 'all';
        const intervalDays = parseInt(book.releaseIntervalDays) || 2;
        const targetWeekday = book.releaseWeekday !== undefined ? parseInt(book.releaseWeekday) : 1; // Padrão: Segunda (1)
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const formatDate = (date) => {
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };

        if (book.universe && book.universe.chapters) {
          book.universe.chapters = book.universe.chapters.map((ch, i) => {
            let chDate = new Date(today);
            
            if (releaseMode === 'daily') {
              chDate.setDate(today.getDate() + i);
            } else if (releaseMode === 'interval') {
              chDate.setDate(today.getDate() + i * intervalDays);
            } else if (releaseMode === 'weekly') {
              const currentWeekday = today.getDay();
              let daysToAdd = targetWeekday - currentWeekday;
              if (daysToAdd < 0) {
                daysToAdd += 7;
              }
              const firstRelease = new Date(today);
              firstRelease.setDate(today.getDate() + daysToAdd);
              
              chDate = new Date(firstRelease);
              chDate.setDate(firstRelease.getDate() + i * 7);
            } else if (releaseMode === 'monthly') {
              chDate.setMonth(today.getMonth() + i);
            } else {
              // Imediato: Tudo hoje
              chDate = new Date(today);
            }
            
            return {
              ...ch,
              publishDate: formatDate(chDate)
            };
          });
        }
      }
      
      const actionText = newStatus === 'published' ? 'Aprovação de Livro' : 'Alteração de Status';
      const detailText = newStatus === 'published'
        ? `Aprovou a publicação do livro "${bookTitle}"`
        : `Reverteu o livro "${bookTitle}" para rascunho`;
        
      const loggedDb = logCuratorAction(actionText, detailText, newDb);
      onUpdateData(loggedDb);
    }
  };

  const handleMarkNotificationRead = (notifId) => {
    const newDb = { ...db };
    const notif = newDb.notifications.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      onUpdateData(newDb);
    }
  };

  const handleAcceptRequest = (notif) => {
    let newDb = { ...db };
    const bookIndex = newDb.books.findIndex(b => b.id === notif.bookId);
    if (bookIndex >= 0) {
      newDb.books[bookIndex].status = 'draft';
    }
    const notifIndex = newDb.notifications.findIndex(n => n.id === notif.id);
    if (notifIndex >= 0) {
      newDb.notifications[notifIndex].read = true;
    }
    const loggedDb = logCuratorAction(
      'Pedido Aceito',
      `Aceitou o pedido de revisão do autor "${notif.authorName}" para o livro "${notif.bookTitle}" (Voltou para Rascunho)`,
      newDb
    );
    onUpdateData(loggedDb);
    alert(`Pedido aceito! O livro '${notif.bookTitle}' voltou para Rascunho para que o autor possa editá-lo.`);
  };

  const handleRejectRequest = (notif) => {
    let newDb = { ...db };
    const notifIndex = newDb.notifications.findIndex(n => n.id === notif.id);
    if (notifIndex >= 0) {
      newDb.notifications[notifIndex].read = true;
    }
    const loggedDb = logCuratorAction(
      'Pedido Rejeitado',
      `Rejeitou o pedido de revisão do autor "${notif.authorName}" para o livro "${notif.bookTitle}"`,
      newDb
    );
    onUpdateData(loggedDb);
    alert('Pedido rejeitado.');
  };

  const handleSendMessage = () => {
    if (!msgText.trim()) return;

    let newDb = { ...db };
    const newNotif = {
      id: Date.now().toString(),
      type: 'message',
      action: 'Nova Mensagem da Curadoria',
      details: msgText,
      date: new Date().toLocaleString(),
      read: false,
      userId: msgTarget // 'all', 'all_authors', 'all_readers', or specific ID
    };

    newDb.notifications = [...(newDb.notifications || []), newNotif];

    let targetName = 'Todos os Usuários';
    if (msgTarget === 'all_authors') targetName = 'Todos os Autores';
    else if (msgTarget === 'all_readers') targetName = 'Todos os Leitores';
    else if (msgTarget !== 'all') {
      const user = newDb.users.find(u => u.id === msgTarget);
      targetName = user ? user.name : msgTarget;
    }

    newDb = logCuratorAction(
      'Envio de Mensagem',
      `Enviou mensagem para "${targetName}": "${msgText}"`,
      newDb
    );

    onUpdateData(newDb);
    setMsgText('');
    alert('Mensagem enviada com sucesso!');
  };

  const navItemStyle = (isActive) => ({
    background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
    color: isActive ? 'var(--accent-gold)' : 'var(--text-main)',
    border: 'none',
    borderRight: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
    padding: '1rem 1.5rem',
    textAlign: 'left',
    cursor: 'pointer',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    fontSize: '1rem',
    width: '100%'
  });

  const hasAccess = (tab) => {
    const perms = getCuratorPermissions(currentUser);
    if (tab === 'dashboard') return perms.dashboard_access;
    if (tab === 'autores') return perms.view_authors;
    if (tab === 'notifications') return perms.notifications_access;
    if (tab === 'curadoria') return perms.approve_books;
    if (tab === 'revisoes') return perms.manage_review_requests;
    if (tab === 'mensagens') return perms.send_messages;
    if (tab === 'banners') return perms.manage_banners;
    if (tab === 'equipe') return perms.manage_team;
    if (tab === 'gamificacao') return perms.dashboard_access; // Curadores com acesso ao painel podem gerenciar
    return false;
  };

  // Dados reais para Analytics
  const totalViews = db.books.reduce((sum, book) => sum + (book.views || 0), 0);
  
  const topBooks = [...db.books]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map(book => {
      const author = db.users.find(u => u.id === book.authorId);
      return { id: book.id, title: book.title, views: book.views || 0, author: author?.name || 'Desconhecido' };
    });

  const ANALYTICS = {
    overview: {
      totalViews: totalViews.toLocaleString(),
      avgSessionTime: "Recurso em desenv.",
      newPubsWeek: 0,
    },
    topBooks: topBooks.length > 0 ? topBooks : [ { id: 'vazio', title: "Nenhuma obra", views: 0 } ],
    growth: {
      cac: "R$ 0,00",
      kFactor: "0.0",
      conversionRate: "0%",
    },
    retention: {
      dau_mau: "0%",
      churn: "0%",
      dropOff: [
        { chapter: "Cap 1", rate: "0%" },
        { chapter: "Cap 2", rate: "0%" },
        { chapter: "Cap 3", rate: "0%" },
        { chapter: "Cap 4+", rate: "0%" },
      ]
    },
    universe: {
      adoptionRate: "0%",
      retentionDiff: "0%",
      nps: "0",
      concentration: "Sem dados"
    },
    monetization: {
      ltv: "R$ 0,00",
      arpu: "R$ 0,00",
      premiumConversion: "0%"
    }
  };

  // ========== RENDERIZAÇÃO DAS ABAS ==========
  
  const renderDenuncias = () => (
    <div>
      <div className="curator-section-header">
        <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <ShieldAlert size={24} /> Denúncias da Comunidade
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Capítulos reportados por leitores</p>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '2rem', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Nenhuma denúncia no momento</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Quando os leitores reportarem problemas em capítulos, eles aparecerão aqui para análise da moderação.</p>
      </div>
    </div>
  );

  const renderDashboardGeral = () => {
    
    const subTabStyle = (isActive) => ({
      padding: '0.8rem 1.5rem', background: isActive ? 'var(--card-bg)' : 'transparent',
      color: isActive ? 'var(--accent-gold)' : 'var(--text-main)',
      border: '1px solid var(--border-color)', borderBottom: isActive ? '3px solid var(--accent-gold)' : 'none',
      cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem'
    });

    return (
      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Analytics e BI</h2>
        </div>

        {/* Sub-Navegação */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', gap: '0.5rem', overflowX: 'auto' }}>
          <button onClick={() => setDashTab('geral')} style={subTabStyle(dashTab === 'geral')}><PieChart size={16}/> Visão Geral</button>
          <button onClick={() => setDashTab('marketing')} style={subTabStyle(dashTab === 'marketing')}><Target size={16}/> Growth & Monetização</button>
          <button onClick={() => setDashTab('engajamento')} style={subTabStyle(dashTab === 'engajamento')}><Activity size={16}/> Retenção & Engajamento</button>
          <button onClick={() => setDashTab('universo')} style={subTabStyle(dashTab === 'universo')}><Star size={16}/> Universo & Creators</button>
        </div>

        {/* ================= ABA GERAL ================= */}
        {dashTab === 'geral' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)' }}><Users size={18} /> <strong>Total de Usuários</strong></div>
                <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem' }}>{authors.length + readers.length}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{authors.length} Autores | {readers.length} Leitores</span>
              </div>
              <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4CAF50' }}><TrendingUp size={18} /> <strong>Views Totais</strong></div>
                <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem' }}>{ANALYTICS.overview.totalViews}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Somatório de todos os livros</span>
              </div>
              <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2196F3' }}><Clock size={18} /> <strong>Retenção Média</strong></div>
                <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem' }}>{ANALYTICS.overview.avgSessionTime}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Por sessão diária</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
              <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)' }}><TrendingUp size={20} /> Top Livros (Popularidade)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {ANALYTICS.topBooks.map((book, idx) => {
                    const maxViews = ANALYTICS.topBooks[0].views;
                    const percentage = (book.views / maxViews) * 100;
                    return (
                      <div key={book.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                          <strong>{idx + 1}. {book.title}</strong><span style={{ color: 'var(--text-muted)' }}>{book.views.toLocaleString()} views</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percentage}%`, background: idx === 0 ? 'var(--accent-gold)' : '#555', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Livros Melhores Classificados */}
              <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)' }}><Star size={20} fill="var(--accent-gold)" color="var(--accent-gold)" /> Livros Melhores Classificados</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(() => {
                    const ratedBooks = db.books
                      .filter(b => b.status === 'published')
                      .map(b => {
                        const ratings = b.ratings || [];
                        const count = ratings.length;
                        const avg = count > 0 
                          ? ratings.reduce((sum, r) => sum + r.stars, 0) / count 
                          : 0;
                        return { ...b, avgRating: avg, ratingCount: count };
                      })
                      .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount);

                    if (ratedBooks.length === 0) {
                      return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>Nenhuma obra publicada no sistema ainda.</p>;
                    }

                    return ratedBooks.map((book, idx) => {
                      const author = db.users.find(u => u.id === book.authorId);
                      return (
                        <div key={book.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                          <div style={{ width: '40px', height: '55px', borderRadius: '4px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                            {book.cover ? (
                              <img src={book.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}><BookOpen size={16} /></div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {idx + 1}. {book.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              por {author?.name || 'Desconhecido'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                            <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              â­ {book.avgRating.toFixed(1)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {book.ratingCount === 1 ? '1 avaliação' : `${book.ratingCount} avaliações`}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA MARKETING & GROWTH ================= */}
        {dashTab === 'marketing' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4CAF50' }}><Target size={20} /> Atração (Growth)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>CAC (Custo de Aquisição)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{ANALYTICS.growth.cac} <span style={{fontSize:'0.9rem', fontWeight:'normal', color:'#4CAF50'}}>↓ 12% M/M</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>K-Factor (Virabilidade)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{ANALYTICS.growth.kFactor}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Acima de 1.0 = Crescimento Exponencial</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Conversão (Landing Page)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{ANALYTICS.growth.conversionRate}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD700' }}><DollarSign size={20} /> Monetização (Funil)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>LTV (Lifetime Value)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{ANALYTICS.monetization.ltv}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>ARPU (Receita Média por Usuário)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{ANALYTICS.monetization.arpu}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Conversão para Premium</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4CAF50' }}>{ANALYTICS.monetization.premiumConversion}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA ENGAJAMENTO ================= */}
        {dashTab === 'engajamento' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2196F3' }}><Activity size={20} /> Saúde da Base</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>DAU / MAU (Usuários Ativos)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{ANALYTICS.retention.dau_mau}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Indica formação de hábito diário</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Churn Rate (Evasão Mensal)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f44336' }}>{ANALYTICS.retention.churn}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f44336' }}>Alerta de Drop-off (Abandono)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Porcentagem de leitores que desistem da obra neste ponto.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {ANALYTICS.retention.dropOff.map(item => (
                  <div key={item.chapter}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                      <strong>{item.chapter}</strong><span style={{ color: item.chapter === 'Cap 2' ? '#f44336' : 'var(--text-muted)' }}>{item.rate}</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: item.rate, background: item.chapter === 'Cap 2' ? '#f44336' : '#555', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA UNIVERSO & CREATORS ================= */}
        {dashTab === 'universo' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)' }}><Star size={20} /> O Diferencial: Universo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Adoção da Enciclopédia</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{ANALYTICS.universe.adoptionRate}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Leitores que interagem com Personagens/Locais</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Correlação Universo vs Retenção</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4CAF50' }}>{ANALYTICS.universe.retentionDiff} retenção</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Leitores que consomem os Extras abandonam menos as obras do que os que leem apenas o texto.</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9C27B0' }}><Users size={20} /> Creator Economy</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>NPS do Autor (Net Promoter Score)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4CAF50' }}>{ANALYTICS.universe.nps} <span style={{fontSize:'1rem'}}>Zona de Excelência</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Concentração de Audiência</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{ANALYTICS.universe.concentration}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Indica necessidade de promover mais autores da cauda longa.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAutores = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const filteredAuthors = authors.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(authorSearchText.toLowerCase());
      const matchesId = authorIdSearchText ? (a.id && a.id.toString().includes(authorIdSearchText)) : true;
      const matchesLetter = authorLetterFilter ? a.name.toUpperCase().startsWith(authorLetterFilter) : true;
      return matchesSearch && matchesId && matchesLetter;
    });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Autores da Plataforma</h2>
            <button className="btn-primary" onClick={() => {
              setEditingUser(null);
              setUserFormData({ name: '', email: '', phone: '', role: 'author', avatar: '', bio: '', incompleteProfile: false });
              setShowUserForm(true);
            }}>+ Novo Autor</button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Pesquisar por ID..." 
              value={authorIdSearchText}
              onChange={e => setAuthorIdSearchText(e.target.value)}
              style={{ padding: '0.8rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', minWidth: '180px' }}
            />
            <input 
              type="text" 
              placeholder="Pesquisar por nome..." 
              value={authorSearchText}
              onChange={e => setAuthorSearchText(e.target.value)}
              style={{ padding: '0.8rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', minWidth: '250px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => setAuthorLetterFilter('')} 
            style={{ padding: '0.4rem 0.8rem', background: authorLetterFilter === '' ? 'var(--accent-gold)' : 'var(--card-bg)', color: authorLetterFilter === '' ? '#000' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Todos
          </button>
          {alphabet.map(letter => (
            <button 
              key={letter}
              onClick={() => setAuthorLetterFilter(letter)} 
              style={{ padding: '0.4rem 0.8rem', background: authorLetterFilter === letter ? 'var(--accent-gold)' : 'var(--card-bg)', color: authorLetterFilter === letter ? '#000' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {letter}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
          {filteredAuthors.map(author => {
          const authorNotifs = notifications.filter(n => n.authorId === author.id && !n.read);
          const hasPendingRequests = authorNotifs.some(n => n.type === 'request');
          
          return (
            <div 
              key={author.id} 
              onClick={() => setSelectedAuthor(author)}
              style={{ 
                background: 'var(--card-bg)', border: '1px solid var(--border-color)', 
                borderRadius: '8px', padding: '1.5rem', cursor: 'pointer', 
                transition: 'transform 0.2s', position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}
            >
              {authorNotifs.length > 0 && (
                <div style={{ 
                  position: 'absolute', top: '-10px', right: '-10px', 
                  background: hasPendingRequests ? '#f44336' : '#ff9800', 
                  color: '#fff', width: '24px', height: '24px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                }}>
                  {authorNotifs.length}
                </div>
              )}

              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', border: '2px solid var(--accent-gold)' }}>
                {author.avatar ? (
                  <img src={author.avatar} alt={(author.displayMode === 'name' ? author.name : (author.nickname || author.name))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={48} color="var(--accent-gold)" style={{ margin: '16px' }} />
                )}
              </div>
              <h3 style={{ margin: '0 0 0.2rem 0', color: 'var(--text-main)', textAlign: 'center' }}>{(author.displayMode === 'name' ? author.name : (author.nickname || author.name))}</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontFamily: 'monospace', background: 'rgba(212, 175, 55, 0.1)', padding: '0.1rem 0.5rem', borderRadius: '4px', marginBottom: '0.5rem', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                ID: {author.id}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{author.email}</p>
              
              {hasPendingRequests && (
                <div style={{ marginTop: '1rem', color: '#f44336', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={14} /> Pedidos Pendentes
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', width: '100%' }}>
                <button className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }} onClick={(e) => {
                  e.stopPropagation();
                  setEditingUser(author);
                  setUserFormData({ ...author });
                  setShowUserForm(true);
                }}>
                  Editar
                </button>
                <button className="btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem', color: '#f44336', borderColor: 'rgba(244, 67, 54, 0.3)' }} onClick={(e) => {
                  e.stopPropagation();
                  if(window.confirm('Tem certeza que deseja revogar o acesso deste autor? Ele será movido para Reprovados, mas manterá seus livros e acesso como leitor.')) {
                    let newDb = { ...db };
                    const userIndex = newDb.users.findIndex(u => u.id === author.id);
                    if (userIndex !== -1) {
                      newDb.users[userIndex].role = 'reader';
                      newDb.users[userIndex].status = 'rejected';
                    }
                    let hasRequest = false;
                    if (newDb.authorRequests) {
                      const reqIndex = newDb.authorRequests.findIndex(r => r.userId === author.id);
                      if (reqIndex !== -1) {
                        newDb.authorRequests[reqIndex].status = 'rejected';
                        hasRequest = true;
                      }
                    }
                    if (!hasRequest) {
                      newDb.authorRequests = newDb.authorRequests || [];
                      newDb.authorRequests.push({
                        id: 'req_revoked_' + Date.now(),
                        userId: author.id,
                        status: 'rejected',
                        bookTitle: 'Acesso de Autor Revogado',
                        synopsis: 'Acesso de autor foi revogado pela curadoria.',
                        createdAt: new Date().toISOString()
                      });
                    }
                    onUpdateData(newDb);
                  }
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )})}
        </div>
      </div>
    );
  };

  // ========== VIEW: AUTHOR DASHBOARD (Sobrepõe tudo) ==========
  if (viewingAuthorDashId) {
    return (
      <AuthorDashboard 
        db={db}
        onUpdateData={onUpdateData}
        currentUser={currentUser}
        onSelectBook={setSelectedBook}
        onOpenNewBook={() => {}}
        forceUserId={viewingAuthorDashId}
        onCloseForceView={() => setViewingAuthorDashId(null)}
      />
    );
  }

  if (selectedBook) {
    const handleUpdateUniverse = (newUniverse) => {
      const newDb = { ...db };
      const bookIndex = newDb.books.findIndex(b => b.id === selectedBook.id);
      newDb.books[bookIndex].universe = newUniverse;
      onUpdateData(newDb);
    };

    const handleUpdateBook = (newBookProps) => {
      const newDb = { ...db };
      const bookIndex = newDb.books.findIndex(b => b.id === selectedBook.id);
      newDb.books[bookIndex] = { ...newDb.books[bookIndex], ...newBookProps };
      onUpdateData(newDb);
      setSelectedBook({ ...selectedBook, ...newBookProps });
    };

    const handleDownloadBackup = () => {
      if (!selectedBook.universe || !selectedBook.universe.chapters || selectedBook.universe.chapters.length === 0) {
        alert("Não há capítulos salvos para fazer backup.");
        return;
      }
      let content = `=========================================\n`;
      content += `LIVRO: ${selectedBook.title}\n`;
      content += `=========================================\n\n`;
      if (selectedBook.synopsis) {
        content += `SINOPSE:\n${selectedBook.synopsis}\n\n`;
      }
      
      const chapters = selectedBook.universe.chapters;
      chapters.forEach(ch => {
        content += `\n=========================================\n`;
        content += `${ch.title || 'Capítulo sem título'}\n`;
        content += `=========================================\n\n`;
        
        if (ch.pages) {
          ch.pages.forEach(p => {
            if (p.subtheme && !/^in.cio$/i.test(p.subtheme)) {
               content += `--- ${p.subtheme} ---\n\n`;
            }
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = p.text || '';
            content += tempDiv.innerText + `\n\n`;
          });
        }
      });

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Backup_${selectedBook.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div style={{ height: 'calc(100vh - 120px)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem 2rem', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setSelectedBook(null)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif" }}>Acessando CMS: {selectedBook.title}</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={handleDownloadBackup} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
              <Download size={16} /> Exportar Backup (.txt)
            </button>
            <span style={{ color: 'var(--text-muted)' }}>Status: <strong>{selectedBook.status.toUpperCase()}</strong></span>
            {permissions.approve_books && selectedBook.status === 'pending' && (
              <button onClick={() => handleUpdateBookStatus(selectedBook.id, 'published')} className="btn-primary" style={{ background: '#4CAF50' }}>
                <Check size={16} /> Aprovar Publicação
              </button>
            )}
            {permissions.approve_books && selectedBook.status === 'published' && (
              <button onClick={() => handleUpdateBookStatus(selectedBook.id, 'draft')} className="btn-secondary" style={{ color: '#ff9800', borderColor: '#ff9800' }}>
                Reverter para Rascunho
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AdminPanel 
            data={selectedBook.universe || {}} 
            onUpdate={handleUpdateUniverse} 
            bookId={selectedBook.id} 
            currentBook={selectedBook} 
            onUpdateBook={handleUpdateBook} 
            currentUser={currentUser}
            onLogChange={(action, details) => {
              const loggedDb = logCuratorAction(`CMS: ${action}`, `No livro "${selectedBook.title}": ${details}`, db);
              onUpdateData(loggedDb);
            }}
            isReadOnly={!permissions.cms_edit}
            restrictedTabs={(() => {
              const allowed = [];
              if (permissions.cms_chapters) allowed.push('chapters');
              if (permissions.cms_pages) allowed.push('pages');
              if (permissions.cms_characters) allowed.push('characters');
              if (permissions.cms_locations) allowed.push('locations');
              if (permissions.cms_organizations) allowed.push('organizations');
              if (permissions.cms_clues) allowed.push('clues');
              if (permissions.cms_posts) allowed.push('posts');
              if (permissions.cms_events) allowed.push('events');
              if (permissions.cms_edit) allowed.push('synopsis');
              allowed.push('reviews'); // Sempre visível para curador com acesso ao CMS
              return allowed;
            })()}
          />
        </div>
      </div>
    );
  }

  // ========== VIEW: PERFIL DO AUTOR (Sobrepõe abas, mantido para legado) ==========
  if (selectedAuthor) {
    const authorBooks = db.books.filter(b => b.authorId === selectedAuthor.id);
    const authorNotifs = notifications.filter(n => n.authorId === selectedAuthor.id).reverse();

    return (
      <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setSelectedAuthor(null)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>Perfil: {(selectedAuthor.displayMode === 'name' ? selectedAuthor.name : (selectedAuthor.nickname || selectedAuthor.name))}</h2>
          <button onClick={() => setViewingAuthorDashId(selectedAuthor.id)} className="btn-primary" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard size={16} /> Acessar Dashboard do Autor
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 2fr 1.5fr', gap: '2rem', flex: 1, overflowY: 'hidden' }}>
          
          {/* Coluna 1: Informações do Perfil */}
          <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', border: '3px solid var(--accent-gold)' }}>
              {selectedAuthor.avatar ? (
                <img src={selectedAuthor.avatar} alt={(selectedAuthor.displayMode === 'name' ? selectedAuthor.name : (selectedAuthor.nickname || selectedAuthor.name))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={80} color="var(--accent-gold)" style={{ margin: '20px' }} />
              )}
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', textAlign: 'center', fontSize: '1.5rem' }}>{(selectedAuthor.displayMode === 'name' ? selectedAuthor.name : (selectedAuthor.nickname || selectedAuthor.name))}</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>{selectedAuthor.email}</p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                <MapPin size={18} color="var(--accent-gold)" style={{ marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cidade / Origem</strong>
                  <span style={{ fontSize: '0.9rem' }}>{selectedAuthor.location || 'São Paulo, Brasil'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                <Edit3 size={18} color="var(--accent-gold)" style={{ marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estilo de Escrita</strong>
                  <span style={{ fontSize: '0.9rem' }}>{selectedAuthor.writingStyle || 'Fantasia Épica & Ficção Histórica'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                <Calendar size={18} color="var(--accent-gold)" style={{ marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Membro desde</strong>
                  <span style={{ fontSize: '0.9rem' }}>{selectedAuthor.joinDate || 'Janeiro de 2026'}</span>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Biografia</strong>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0, color: 'var(--text-main)' }}>
                  {selectedAuthor.bio || 'Autor apaixonado por criar mundos imersivos e complexos. Busca explorar a psique humana através de narrativas de fantasia sombria e aventuras épicas.'}
                </p>
              </div>
            </div>
          </div>

          {/* Coluna 2: Obras */}
          <div style={{ overflowY: 'auto', paddingRight: '1rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Obras do Autor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {authorBooks.map(book => (
                <div key={book.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '2/3', width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {book.cover ? (
                      <>
                        <img 
                          src={book.cover} 
                          alt="" 
                          style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                            filter: 'blur(10px)', 
                            opacity: 0.35, 
                            zIndex: 0 
                          }} 
                        />
                        <img 
                          src={book.cover} 
                          alt={book.title} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain', 
                            zIndex: 1 
                          }} 
                        />
                      </>
                    ) : (
                      <BookOpen size={32} color="rgba(255,255,255,0.1)" />
                    )}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--text-main)' }}>{book.title}</h4>
                    {book.sku && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px', display: 'inline-block' }}>
                        SKU: {book.sku}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: '0.8rem', color: book.status === 'published' ? '#4CAF50' : book.status === 'pending' ? '#ff9800' : 'var(--text-muted)' }}>
                      Status: {book.status.toUpperCase()}
                    </p>
                    <button onClick={() => setSelectedBook(book)} className="btn-secondary" style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', fontSize: '0.8rem' }}>
                      Acessar CMS do Livro
                    </button>
                  </div>
                </div>
              ))}
              {authorBooks.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhuma obra cadastrada.</p>}
            </div>
          </div>

          {/* Logs */}
          <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Registro de Atividades</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {authorNotifs.map(notif => (
                <div key={notif.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: notif.type === 'request' ? '3px solid #2196F3' : '3px solid var(--accent-gold)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notif.date}</span>
                    {notif.type === 'request' && !notif.read && (
                      <span style={{ fontSize: '0.7rem', background: '#2196F3', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>Novo Pedido</span>
                    )}
                  </div>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>{notif.action}</strong>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Livro: {notif.bookTitle}</p>
                  
                  {notif.type === 'request' && (
                    <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.9rem' }}>
                      {(() => {
                        try {
                          const reqData = JSON.parse(notif.details);
                          return (
                            <>
                              <p style={{ margin: '0 0 0.5rem 0' }}><strong>O que:</strong> {reqData.what}</p>
                              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Por que:</strong> {reqData.why}</p>
                              {reqData.impact && <p style={{ margin: 0 }}><strong>Impacto:</strong> {reqData.impact}</p>}
                            </>
                          );
                        } catch (e) {
                          return <p style={{ margin: 0 }}>{notif.details}</p>;
                        }
                      })()}
                      
                      {!notif.read && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          <button onClick={() => handleAcceptRequest(notif)} style={{ flex: 1, background: '#4CAF50', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}><Check size={14}/> Aceitar</button>
                          <button onClick={() => handleRejectRequest(notif)} style={{ flex: 1, background: '#f44336', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}><X size={14}/> Rejeitar</button>
                        </div>
                      )}
                    </div>
                  )}

                  {notif.type !== 'request' && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-main)' }}>{notif.details}</p>
                  )}
                </div>
              ))}
              {authorNotifs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhuma atividade registrada.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }


  const renderNotifications = () => {
    return (
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', marginBottom: '2rem' }}>Notificações por Autor</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {authors.map(author => {
            const logs = notifications.filter(n => n.authorId === author.id && n.type !== 'request').reverse();
            if (logs.length === 0) return null;
            return (
              <div key={author.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  {author.avatar ? <img src={author.avatar} alt="" style={{width:'40px', height:'40px', borderRadius:'50%'}}/> : <User size={40} />}
                  <h3 style={{ margin: 0 }}>{(author.displayMode === 'name' ? author.name : (author.nickname || author.name))}</h3>
                  <button onClick={() => setSelectedAuthor(author)} className="btn-secondary" style={{ marginLeft: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Ver Perfil Completo</button>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {logs.slice(0, 5).map(log => (
                    <div key={log.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                      <strong style={{ color: 'var(--accent-gold)' }}>{log.action}</strong> no livro <span style={{ color: 'var(--text-main)' }}>{log.bookTitle}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '1rem', fontSize: '0.8rem' }}>{log.date}</span>
                      <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)' }}>{log.details}</p>
                    </div>
                  ))}
                  {logs.length > 5 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>+ {logs.length - 5} logs anteriores (acesse o perfil para ver tudo)</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCuradoria = () => {
    const pendingBooks = db.books.filter(b => b.status === 'pending');
    
    return (
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', marginBottom: '2rem' }}>Aprovação de Livros (Curadoria)</h2>
        {pendingBooks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum livro aguardando aprovação no momento.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {authors.map(author => {
              const authorPending = pendingBooks.filter(b => b.authorId === author.id);
              if (authorPending.length === 0) return null;
              
              return (
                <div key={author.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-gold)' }}>Autor: {(author.displayMode === 'name' ? author.name : (author.nickname || author.name))}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {authorPending.map(book => (
                      <div key={book.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 0.2rem 0' }}>{book.title}</h4>
                        {book.sku && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px', display: 'inline-block' }}>
                            SKU: {book.sku}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                          <button onClick={() => setSelectedBook(book)} className="btn-secondary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem' }}>
                            Acessar CMS do Livro
                          </button>
                          <button onClick={() => handleUpdateBookStatus(book.id, 'published')} className="btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', background: '#4CAF50' }}>
                            Aprovar Publicação
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderRevisoes = () => {
    const pendingRequests = notifications.filter(n => n.type === 'request' && !n.read).reverse();

    return (
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', marginBottom: '2rem' }}>Pedidos de Revisão/Alteração</h2>
        {pendingRequests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum pedido de alteração pendente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {authors.map(author => {
              const authorRequests = pendingRequests.filter(r => r.authorId === author.id);
              if (authorRequests.length === 0) return null;

              return (
                <div key={author.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-gold)' }}>Autor: {(author.displayMode === 'name' ? author.name : (author.nickname || author.name))}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {authorRequests.map(notif => (
                      <div key={notif.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <strong style={{ color: 'var(--text-main)' }}>Livro: {notif.bookTitle}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notif.date}</span>
                        </div>
                        {(() => {
                          try {
                            const reqData = JSON.parse(notif.details);
                            return (
                              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                                <p style={{ margin: '0 0 0.5rem 0' }}><strong>O que:</strong> {reqData.what}</p>
                                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Por que:</strong> {reqData.why}</p>
                                {reqData.impact && <p style={{ margin: 0 }}><strong>Impacto:</strong> {reqData.impact}</p>}
                              </div>
                            );
                          } catch (e) {
                            return <p style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{notif.details}</p>;
                          }
                        })()}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={() => handleAcceptRequest(notif)} style={{ flex: 1, background: '#4CAF50', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}><Check size={16}/> Aceitar Pedido (Reverter para Rascunho)</button>
                          <button onClick={() => handleRejectRequest(notif)} style={{ flex: 1, background: '#f44336', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}><X size={16}/> Rejeitar Pedido</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMensagens = () => {
    const allTickets = db.supportTickets || [];
    
    const getCategoryDetails = (cat) => {
      const cats = {
        technical: { label: 'ðŸ› ï¸ Suporte Técnico', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)' },
        curator: { label: '📖 Curadoria / Obras', color: 'var(--accent-gold)', bg: 'rgba(212, 175, 55, 0.1)' },
        financial: { label: '💰 Financeiro', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' },
        other: { label: 'â“ Outros Assuntos', color: '#9e9e9e', bg: 'rgba(158, 158, 158, 0.1)' }
      };
      return cats[cat] || cats.other;
    };

    const permittedTickets = allTickets.filter(t => {
      if (currentUser.id === 'admin') return true;
      if (t.category === 'technical') return permissions.support_technical_access ?? true;
      if (t.category === 'curator') return permissions.support_curator_access ?? true;
      if (t.category === 'financial') return permissions.support_financial_access ?? true;
      if (t.category === 'other') return permissions.support_other_access ?? true;
      return true;
    });

    const filteredTickets = permittedTickets.filter(t => {
      // 1. Filtrar por Status (Aberto, Resolvido)
      if (supportStatusFilter !== 'all' && t.status !== supportStatusFilter) return false;

      // 2. Filtrar por Categoria (Tópico)
      if (supportCategoryFilter !== 'all' && t.category !== supportCategoryFilter) return false;

      // 3. Filtrar por Busca de Texto (Assunto, Autor ou Corpo da Mensagem)
      if (supportSearchText.trim()) {
        const query = supportSearchText.toLowerCase();
        const subjectMatch = t.subject?.toLowerCase().includes(query);
        const authorMatch = t.authorName?.toLowerCase().includes(query);
        const messageMatch = t.message?.toLowerCase().includes(query);
        if (!subjectMatch && !authorMatch && !messageMatch) return false;
      }

      return true;
    });

    const selectedTicket = filteredTickets.find(t => t.id === selectedTicketId);

    const handleSendTicketReply = () => {
      if (!ticketReplyText.trim() || !selectedTicket) return;

      const newReply = {
        id: 'reply_' + Date.now() + Math.floor(Math.random() * 1000),
        senderId: currentUser.id,
        senderName: (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)),
        message: ticketReplyText,
        createdAt: new Date().toLocaleString('pt-BR')
      };

      let newDb = { ...db };
      
      newDb.supportTickets = (newDb.supportTickets || []).map(t => {
        if (t.id === selectedTicket.id) {
          return {
            ...t,
            replies: [...(t.replies || []), newReply]
          };
        }
        return t;
      });

      const newNotif = {
        id: 'notif_' + Date.now() + Math.floor(Math.random() * 1000),
        type: 'message',
        action: 'Resposta de Suporte',
        details: `O(A) curador(a) ${(currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name))} respondeu ao chamado de suporte "${selectedTicket.subject}":\n\n"${ticketReplyText}"`,
        date: new Date().toLocaleString('pt-BR'),
        read: false,
        userId: selectedTicket.authorId
      };
      newDb.notifications = [...(newDb.notifications || []), newNotif];

      newDb = logCuratorAction(
        'Resposta de Chamado',
        `Respondeu ao chamado "${selectedTicket.subject}" de ${selectedTicket.authorName}`,
        newDb
      );

      onUpdateData(newDb);
      setTicketReplyText('');
      alert("Resposta enviada com sucesso!");
    };

    const handleToggleTicketStatus = (ticket) => {
      const newStatus = ticket.status === 'open' ? 'resolved' : 'open';
      let newDb = { ...db };

      newDb.supportTickets = (newDb.supportTickets || []).map(t => {
        if (t.id === ticket.id) {
          return { ...t, status: newStatus };
        }
        return t;
      });

      const newNotif = {
        id: 'notif_' + Date.now() + Math.floor(Math.random() * 1000),
        type: 'message',
        action: 'Status de Chamado Alterado',
        details: `O chamado de suporte "${ticket.subject}" foi marcado como ${newStatus === 'open' ? 'Reaberto' : 'Resolvido'} por ${(currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name))}.`,
        date: new Date().toLocaleString('pt-BR'),
        read: false,
        userId: ticket.authorId
      };
      newDb.notifications = [...(newDb.notifications || []), newNotif];

      newDb = logCuratorAction(
        newStatus === 'resolved' ? 'Chamado Resolvido' : 'Chamado Reaberto',
        `${newStatus === 'resolved' ? 'Resolveu' : 'Reabriu'} o chamado "${ticket.subject}" de ${ticket.authorName}`,
        newDb
      );

      onUpdateData(newDb);
      alert(`Chamado marcado como ${newStatus === 'resolved' ? 'Resolvido' : 'Aberto'}!`);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Central de Chamados e Suporte</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gerencie e responda às dúvidas dos autores conforme sua área de atuação.</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.3rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setSupportStatusFilter('open')}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                background: supportStatusFilter === 'open' ? 'var(--accent-gold)' : 'transparent',
                color: supportStatusFilter === 'open' ? '#000' : 'var(--text-main)',
                transition: 'all 0.2s'
              }}
            >
              Abertos
            </button>
            <button 
              onClick={() => setSupportStatusFilter('resolved')}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                background: supportStatusFilter === 'resolved' ? '#4CAF50' : 'transparent',
                color: supportStatusFilter === 'resolved' ? '#fff' : 'var(--text-main)',
                transition: 'all 0.2s'
              }}
            >
              Resolvidos
            </button>
            <button 
              onClick={() => setSupportStatusFilter('all')}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                background: supportStatusFilter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: 'var(--text-main)',
                transition: 'all 0.2s'
              }}
            >
              Todos
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '500px' }}>
          <div style={{ width: '320px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Caixa de Entrada</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', background: 'rgba(212, 175, 55, 0.1)', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>
                {filteredTickets.length}
              </span>
            </div>

            {/* FILTROS E BUSCA DE TICKET */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(0,0,0,0.1)' }}>
              {/* Campo de Busca por assunto / autor */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Buscar assunto ou autor..."
                  value={supportSearchText}
                  onChange={e => setSupportSearchText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 2.2rem 0.6rem 0.8rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                />
                <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                {supportSearchText && (
                  <button
                    onClick={() => setSupportSearchText('')}
                    style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filtro de Categoria/Tópico */}
              <div>
                <select
                  value={supportCategoryFilter}
                  onChange={e => setSupportCategoryFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">📂 Todos os Tópicos</option>
                  <option value="technical">ðŸ› ï¸ Suporte Técnico</option>
                  <option value="curator">📖 Curadoria / Obras</option>
                  <option value="financial">💰 Financeiro</option>
                  <option value="other">â“ Outros Assuntos</option>
                </select>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {filteredTickets.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Nenhum chamado {supportStatusFilter === 'open' ? 'aberto' : supportStatusFilter === 'resolved' ? 'resolvido' : ''} nesta categoria.
                </div>
              ) : (
                filteredTickets.slice().reverse().map(t => {
                  const cat = getCategoryDetails(t.category);
                  const isSelected = t.id === selectedTicketId;
                  return (
                    <div 
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      style={{
                        padding: '1.2rem',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(255,255,255,0.02)' : 'transparent',
                        borderLeft: isSelected ? '4px solid var(--accent-gold)' : '4px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', background: cat.bg, color: cat.color, padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>{cat.label}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: t.status === 'open' ? 'var(--accent-gold)' : '#4CAF50',
                          fontWeight: 'bold'
                        }}>
                          {t.status === 'open' ? 'Aberto' : 'Resolvido'}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>De: {t.authorName}</span>
                        <span>{t.createdAt.split(',')[0]}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedTicket ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>{selectedTicket.subject}</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Autor: <strong>{selectedTicket.authorName} (ID: {selectedTicket.authorId})</strong></span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Categoria: <strong style={{ color: getCategoryDetails(selectedTicket.category).color }}>{getCategoryDetails(selectedTicket.category).label}</strong></span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enviado em: <strong>{selectedTicket.createdAt}</strong></span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleToggleTicketStatus(selectedTicket)}
                      className={selectedTicket.status === 'open' ? 'btn-secondary' : 'btn-primary'}
                      style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                      {selectedTicket.status === 'open' ? '🔒 Marcar como Resolvido' : '🔓 Reabrir Chamado'}
                    </button>
                    <span style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      background: selectedTicket.status === 'open' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                      color: selectedTicket.status === 'open' ? 'var(--accent-gold)' : '#4CAF50'
                    }}>
                      {selectedTicket.status === 'open' ? 'CHAMADO ABERTO' : 'RESOLVIDO'}
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ alignSelf: 'flex-start', maxWidth: '80%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.4rem' }}>{selectedTicket.authorName} (Autor)</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{selectedTicket.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.4rem' }}>{selectedTicket.createdAt}</div>
                  </div>

                  {(selectedTicket.replies || []).map(reply => {
                    const isCurator = reply.senderId !== selectedTicket.authorId;
                    return (
                      <div 
                        key={reply.id}
                        style={{
                          alignSelf: isCurator ? 'flex-end' : 'flex-start',
                          maxWidth: '80%',
                          background: isCurator ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                          border: isCurator ? '1px solid rgba(212,175,55,0.2)' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '1rem'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: isCurator ? '#2196F3' : 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                          {reply.senderName} {isCurator ? '(Curadoria)' : '(Autor)'}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{reply.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.4rem' }}>{reply.createdAt}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  {selectedTicket.status === 'open' ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <textarea
                        value={ticketReplyText}
                        onChange={e => setTicketReplyText(e.target.value)}
                        placeholder="Escreva uma resposta para o autor..."
                        rows="2"
                        style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                      />
                      <button 
                        onClick={handleSendTicketReply}
                        disabled={!ticketReplyText.trim()}
                        className="btn-primary" 
                        style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', opacity: ticketReplyText.trim() ? 1 : 0.5 }}
                      >
                        <Send size={16} /> Responder
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem' }}>
                      Este chamado foi resolvido e encerrado. Se necessário, reabra o chamado para continuar conversando.
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '3rem', textAlign: 'center' }}>
                <MessageSquare size={48} style={{ opacity: 0.15, marginBottom: '1.5rem' }} />
                <p style={{ margin: 0, fontSize: '1.05rem' }}>Selecione um chamado na barra lateral para ver o atendimento ou filtrar por status.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLeitores = () => {
    const leitores = db.users.filter(u => u.role === 'reader');
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Gestão de Leitores</h2>
          <button className="btn-primary" onClick={() => {
            setEditingUser(null);
            setUserFormData({ name: '', email: '', phone: '', role: 'reader', avatar: '', bio: '', incompleteProfile: false });
            setShowUserForm(true);
          }}>+ Novo Perfil</button>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Nome</th>
                <th style={{ padding: '1rem' }}>E-mail</th>
                <th style={{ padding: '1rem' }}>Telefone</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {leitores.map(leitor => (
                <tr key={leitor.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>{leitor.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{leitor.email}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{leitor.phone || 'Não inf.'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', background: leitor.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)', color: leitor.status === 'active' ? '#4CAF50' : '#ff9800' }}>
                      {leitor.status === 'active' ? 'Ativo' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setSelectedReaderDossier(leitor)}>
                      Ver Dossiê
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => {
                      setEditingUser(leitor);
                      setUserFormData({ ...leitor });
                      setShowUserForm(true);
                    }}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#f44336', borderColor: 'rgba(244, 67, 54, 0.3)' }} onClick={() => {
                      if(window.confirm('Tem certeza que deseja deletar este leitor?')) {
                        onUpdateData({ ...db, users: db.users.filter(u => u.id !== leitor.id) });
                      }
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {leitores.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum leitor cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleUpdateAuthorStatus = async (userId, newStatus) => {
    try {
      const { data: dbData, error } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
      if (error || !dbData) throw error;
      const newDb = dbData.data;
      
      let userEmail = '';
      let userName = '';
      const userIndex = newDb.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        newDb.users[userIndex].status = newStatus;
        if (newStatus === 'active') {
          newDb.users[userIndex].role = 'author';
        }
        userEmail = newDb.users[userIndex].email;
        userName = newDb.users[userIndex].name;
      }
      
      if (newDb.authorRequests) {
        const reqIndex = newDb.authorRequests.findIndex(r => r.userId === userId);
        if (reqIndex !== -1) {
          newDb.authorRequests[reqIndex].status = newStatus;
        }
      }

      await supabase.from('sagaflix_db').update({ data: newDb }).eq('id', 1);

      if (newStatus === 'active' && userEmail) {
        const subject = 'Parabéns! Você agora é um Autor Oficial da Sagaflix! 🎉';
        const message = `Olá ${userName},\n\nÉ com imensa alegria que anunciamos que o seu perfil e a sua obra foram APROVADOS pela nossa Curadoria! A partir de agora, você pode acessar o Sagaflix Estúdio e começar a publicar seus capítulos para milhares de leitores. Acesse: https://sagaflix-enciclopedia.vercel.app/autor\n\n⚠️ AVISO IMPORTANTE: REGRAS DE CONVÍVIO\nA Sagaflix é um instrumento de divulgação de cultura, imaginação e conhecimento. Nossa comunidade é composta por indivíduos com desejos, crenças, instintos e gostos literários muito distintos.\n\nPara garantirmos a harmonia da nossa plataforma, lembramos que NÃO TOLERAMOS qualquer tipo de insulto, discurso de ódio ou assédio entre usuários (seja nas avaliações, mensagens ou comentários). Todo autor deve estar preparado para receber opiniões e críticas construtivas sobre sua obra com maturidade.\n\nQualquer violação às regras de respeito descritas em nossos Termos de Uso resultará em punições severas, podendo chegar ao banimento definitivo e o encaminhamento dos dados do infrator para medidas judiciais cabíveis por parte da pessoa ofendida. A Sagaflix atua como provedora de hospedagem e não se responsabiliza pelas opiniões individuais emitidas por seus usuários, mas será implacável na remoção de contas tóxicas.\n\nBem-vindo à sua nova casa literária. Escreva com o coração, e respeite a jornada dos seus colegas de página.\n\nAbraços,\nEquipe de Curadoria Sagaflix`;
        await sendEmail(userEmail, subject, message);
      } else if (newStatus === 'rejected' && userEmail) {
        const subject = 'Atualização do seu cadastro na Sagaflix';
        const message = `Olá ${userName},\n\nInfelizmente seu perfil não foi aprovado pela nossa curadoria neste momento.\n\nSe você tiver alguma dúvida em relação a esta decisão ou desejar uma réplica da nossa avaliação, por favor, entre em contato com nosso suporte através do e-mail suporte@sagaflix.com.br\n\nEquipe Sagaflix`;
        await sendEmail(userEmail, subject, message);
      }

      alert('Status atualizado com sucesso!');
      window.location.reload();
    } catch (err) {
      alert('Erro ao atualizar autor: ' + err.message);
    }
  };

  const renderGamificacao = () => {
    const badges = db.gamificationBadges || [];
    const leitores = db.users.filter(u => u.role === 'reader');
    
    // Sort top 100 readers by pagesRead
    const topLeitores = [...leitores].sort((a, b) => (b.pagesRead || 0) - (a.pagesRead || 0)).slice(0, 100);

    const subTabStyle = (isActive) => ({
      padding: '0.8rem 1.5rem',
      background: 'transparent',
      border: 'none',
      borderBottom: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
      color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
      fontWeight: isActive ? 'bold' : 'normal',
      cursor: 'pointer',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease'
    });

    return (
      <div className="curator-gamificacao-section animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Gamificação e Engajamento</h2>
        </div>

        {/* Sub-abas */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => setGamificacaoSubTab('badges')} style={subTabStyle(gamificacaoSubTab === 'badges')}>
            <Award size={16} /> Gestão de Títulos (Badges)
          </button>
          <button onClick={() => setGamificacaoSubTab('ranking')} style={subTabStyle(gamificacaoSubTab === 'ranking')}>
            <TrendingUp size={16} /> Top 100 Leitores
          </button>
          <button onClick={() => setGamificacaoSubTab('config')} style={subTabStyle(gamificacaoSubTab === 'config')}>
            <ShieldAlert size={16} /> Anti-Fraude (Anti-Cheat)
          </button>
        </div>

        {gamificacaoSubTab === 'badges' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Crie e gerencie os títulos que os leitores podem desbloquear (ex: Inicializador, Leitor Fiel).</p>
              <button className="btn-primary" onClick={() => {
                setBadgeForm({ id: '', name: '', description: '', rule: '', icon: 'ðŸ†' });
                setEditingBadge(true);
              }}>+ Novo Título</button>
            </div>
            
            {badges.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <Star size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Nenhum título cadastrado</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Crie os 10 títulos principais para incentivar os leitores!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {badges.map((badge, idx) => (
                  <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontSize: '24px' }}>
                      {badge.icon ? (
                        badge.icon.startsWith('http') || badge.icon.startsWith('/') || badge.icon.startsWith('data:') 
                          ? <img src={badge.icon} alt={badge.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                          : <span>{badge.icon}</span>
                      ) : <Award size={24} color="var(--accent-gold)" />}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--accent-gold)' }}>{badge.name}</h4>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{badge.description}</p>
                      <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.6rem', borderRadius: '4px', color: '#aaa' }}>
                        <strong>Diretriz/Regra:</strong> {badge.rule || 'Atribuição manual'}
                      </div>
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => {
                          setBadgeForm({ ...badge });
                          setEditingBadge(true);
                        }}>Editar</button>
                        <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir o título "${badge.name}"?`)) {
                             const newBadges = (db.gamificationBadges || []).filter(b => b.id !== badge.id);
                             onUpdateData({ ...db, gamificationBadges: newBadges });
                          }
                        }}>Excluir</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editingBadge && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'var(--bg-color)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent-gold)' }}>{badgeForm.id ? 'Editar Título' : 'Novo Título'}</h3>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome do Título</label>
                    <input type="text" className="input-field" value={badgeForm.name || ''} onChange={e => setBadgeForm({...badgeForm, name: e.target.value})} placeholder="Ex: Leitor Ãvido" />
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Descrição</label>
                    <textarea className="input-field" value={badgeForm.description || ''} onChange={e => setBadgeForm({...badgeForm, description: e.target.value})} placeholder="Parabéns, você leu 10 livros..." style={{ minHeight: '80px' }}></textarea>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Diretriz/Regra (Informativo para o Leitor)</label>
                    <input type="text" className="input-field" value={badgeForm.rule || ''} onChange={e => setBadgeForm({...badgeForm, rule: e.target.value})} placeholder="Ex: Ler 10 livros" />
                  </div>

                  <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Construtor de Regra (Automático)</h4>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Alvo da Métrica</label>
                        <select className="input-field" value={badgeForm.conditionTarget || ''} onChange={e => setBadgeForm({...badgeForm, conditionTarget: e.target.value})}>
                          <option value="">(Nenhum / Manual)</option>
                          <option value="pagesRead">Páginas Lidas</option>
                          <option value="booksRead">Livros Lidos (Validados)</option>
                          <option value="dossiersReadComplex">Dossiês Lidos (Regra Complexa)</option>
                          <option value="secretNotesApproved">Notas Secretas Aprovadas</option>
                        </select>
                      </div>
                      <div style={{ width: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Condição</label>
                        <select className="input-field" value={badgeForm.conditionOperator || '>='} onChange={e => setBadgeForm({...badgeForm, conditionOperator: e.target.value})}>
                          <option value=">=">Maior/Igual a</option>
                          <option value="==">Igual a</option>
                        </select>
                      </div>
                      <div style={{ width: '100px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Valor</label>
                        <input type="number" className="input-field" value={badgeForm.conditionValue || 0} onChange={e => setBadgeForm({...badgeForm, conditionValue: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Ãcone (Emoji ou URL da Imagem)</label>
                    <input type="text" className="input-field" value={badgeForm.icon || ''} onChange={e => setBadgeForm({...badgeForm, icon: e.target.value})} placeholder="Ex: ðŸ† ou https://link.com/img.png" />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => setEditingBadge(false)}>Cancelar</button>
                    <button className="btn-primary" onClick={() => {
                       if (!badgeForm.name) return alert('O nome é obrigatório!');
                       let newBadges;
                       if (badgeForm.id) {
                          newBadges = (db.gamificationBadges || []).map(b => b.id === badgeForm.id ? badgeForm : b);
                       } else {
                          newBadges = [...(db.gamificationBadges || []), { ...badgeForm, id: 'bdg_' + Date.now() }];
                       }
                       onUpdateData({ ...db, gamificationBadges: newBadges });
                       setEditingBadge(false);
                    }}>Salvar Título</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {gamificacaoSubTab === 'config' && (
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '600px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-gold)' }}>Configuração Anti-Fraude (Anti-Cheat)</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
              Para evitar que leitores simplesmente pulem as páginas rapidamente para ganhar títulos de "X livros lidos", o sistema exige um tempo mínimo de leitura baseado na quantidade de palavras.
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Tolerância de Leitura Rápida (%)</label>
              <input 
                type="number" 
                className="input-field" 
                value={db.antiCheatMargin || 40} 
                onChange={e => onUpdateData({ ...db, antiCheatMargin: parseInt(e.target.value) || 40 })} 
                style={{ width: '150px' }}
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Ex: Se a média de leitura de um livro for de 5 horas, configurar 40% significa que a leitura só será validada para os prêmios se o usuário passar no mínimo 2 horas lendo.
              </p>
            </div>
          </div>
        )}

        {gamificacaoSubTab === 'ranking' && (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Os 100 leitores mais engajados da plataforma com base em páginas lidas.</p>
            
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', width: '60px', textAlign: 'center' }}>Pos</th>
                    <th style={{ padding: '1rem' }}>Leitor (Nickname)</th>
                    <th style={{ padding: '1rem' }}>Páginas Lidas</th>
                    <th style={{ padding: '1rem' }}>Livros Lidos</th>
                    <th style={{ padding: '1rem' }}>Títulos Desbloqueados</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {topLeitores.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum leitor com progresso computado.</td></tr>
                  ) : (
                    topLeitores.map((leitor, idx) => (
                      <tr key={leitor.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: idx < 3 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                          #{idx + 1}
                        </td>
                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={16} color="var(--text-muted)" />
                          {leitor.nickname || leitor.name}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--accent-gold)' }}>{leitor.pagesRead || 0} pgs</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{(leitor.finishedBooks || []).length} obras</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {(leitor.badges || []).slice(0, 3).map((b, i) => (
                              <span key={i} title={b.name} style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-gold)', display: 'inline-block' }}></span>
                            ))}
                            {(leitor.badges || []).length > 3 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{(leitor.badges.length - 3)}</span>}
                            {(leitor.badges || []).length === 0 && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} onClick={() => {
                            const newPages = window.prompt("Páginas lidas:", leitor.pagesRead || 0);
                            if (newPages === null) return;
                            const newBooks = window.prompt("Obras lidas:", (leitor.finishedBooks || []).length);
                            if (newBooks === null) return;
                            
                            const updatedLeitor = { ...leitor, pagesRead: parseInt(newPages) || 0 };
                            const currentBooksLen = (leitor.finishedBooks || []).length;
                            const targetBooksLen = parseInt(newBooks) || 0;
                            if (targetBooksLen > currentBooksLen) {
                               updatedLeitor.finishedBooks = [...(leitor.finishedBooks || [])];
                               for(let i = 0; i < targetBooksLen - currentBooksLen; i++) updatedLeitor.finishedBooks.push('manual_book_' + Date.now() + i);
                            } else if (targetBooksLen < currentBooksLen) {
                               updatedLeitor.finishedBooks = (leitor.finishedBooks || []).slice(0, targetBooksLen);
                            }
                            
                            const autoBadges = [...(updatedLeitor.badges || [])];
                            const checkAndAdd = (badgeId) => {
                               if (!autoBadges.find(b => b.id === badgeId)) {
                                  const bdg = (db.gamificationBadges || []).find(b => b.id === badgeId);
                                  if (bdg) autoBadges.push(bdg);
                               }
                            };
                            
                            if (updatedLeitor.pagesRead >= 1) checkAndAdd('bdg_1');
                            if (updatedLeitor.finishedBooks?.length >= 10) checkAndAdd('bdg_2');
                            if (updatedLeitor.name === 'Leitor Fiel' || updatedLeitor.nickname === 'Leitor Fiel') checkAndAdd('bdg_10');
                            
                            updatedLeitor.badges = autoBadges;
                            const newUsers = db.users.map(u => u.id === updatedLeitor.id ? updatedLeitor : u);
                            onUpdateData({ ...db, users: newUsers });
                          }}>Editar Métricas</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRequestDetails = (isReprovado = false) => {
    const user = db.users.find(u => u.id === selectedRequest.userId);
    if (!user) return <div style={{color:'red'}}>Erro: Usuário não encontrado.</div>;
    
    return (
      <div style={{ height: '100%', overflowY: 'auto', paddingRight: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setSelectedRequest(null)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: isReprovado ? '#f44336' : 'var(--accent-gold)' }}>
            {isReprovado ? 'Análise de Candidato Reprovado' : 'Detalhes do Pedido'}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Coluna 1: Perfil do Autor */}
          <div style={{ flex: '1', minWidth: '300px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Perfil do Candidato</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent-gold)', overflow: 'hidden' }}>
                {user.avatar ? <img src={user.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="Avatar" /> : <User size={48} color="var(--accent-gold)" style={{margin:'16px'}}/>}
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem' }}>{user.name}</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Idade</strong>
                <span>{user.age || 'Não informada'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gêneros Favoritos</strong>
                <span>{user.tastes || 'Não informado'}</span>
              </div>
            </div>

            <div>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Biografia</strong>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0, color: 'var(--text-main)', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                {user.about || 'Biografia não informada pelo autor.'}
              </p>
            </div>
          </div>

          {/* Coluna 2: Dados da Obra e Ações */}
          <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
              <h3 style={{ color: 'var(--accent-gold)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Obra Submetida</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Título da Obra</strong>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedRequest.bookTitle}</span>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sinopse</strong>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0, color: 'var(--text-main)', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                  {selectedRequest.synopsis}
                </p>
              </div>
              
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Manuscrito (Texto de Amostra)</strong>
                {selectedRequest.sampleText ? (
                  <a href={selectedRequest.sampleText} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <FileText size={16} /> Baixar / Ler Manuscrito
                  </a>
                ) : (
                  <span style={{ color: '#f44336' }}>Nenhum manuscrito enviado.</span>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', textAlign: 'center' }}>Decisão da Curadoria</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" style={{ flex: 1, background: '#4CAF50', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }} onClick={() => { handleUpdateAuthorStatus(user.id, 'active'); setSelectedRequest(null); }}>
                  <Check size={20} style={{display:'inline-block', verticalAlign:'middle', marginRight:'8px'}} />
                  {isReprovado ? 'Reverter Recusa e Aprovar' : 'Aprovar Autor'}
                </button>
                {!isReprovado && (
                  <button className="btn-secondary" style={{ flex: 1, color: '#f44336', borderColor: 'rgba(244,67,54,0.3)', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }} onClick={() => { handleUpdateAuthorStatus(user.id, 'rejected'); setSelectedRequest(null); }}>
                    <X size={20} style={{display:'inline-block', verticalAlign:'middle', marginRight:'8px'}} />
                    Recusar Autor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNovosPedidos = () => {
    if (selectedRequest) return renderRequestDetails(false);

    const pedidos = (db.authorRequests || []).filter(r => r.status === 'pending_approval' || r.status === 'pending');
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Aprovação de Autores</h2>
        </div>
        {pedidos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum autor aguardando aprovação no momento.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {pedidos.map(req => {
              const user = db.users.find(u => u.id === req.userId);
              if (!user) return null;
              return (
                <div key={req.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-gold)' }}>{user.name}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>Email:</strong> {user.email}</p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>Obra:</strong> {req.bookTitle}</p>
                  </div>
                  <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setSelectedRequest(req)}>
                    Analisar Perfil Completo
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderReprovados = () => {
    if (selectedRequest) return renderRequestDetails(true);

    const reprovados = (db.authorRequests || []).filter(r => r.status === 'rejected');
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#f44336', margin: 0 }}>Candidatos Reprovados</h2>
        </div>
        {reprovados.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>A lixeira está vazia. Nenhum candidato reprovado no momento.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {reprovados.map(req => {
              const user = db.users.find(u => u.id === req.userId);
              if (!user) return null;
              return (
                <div key={req.id} style={{ background: 'var(--card-bg)', border: '1px solid #f4433655', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <Ban size={24} color="#f44336" />
                      <h3 style={{ margin: 0, color: '#f44336' }}>{user.name}</h3>
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>Email:</strong> {user.email}</p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>Obra:</strong> {req.bookTitle}</p>
                  </div>
                  <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', background: '#4CAF50' }} onClick={() => setSelectedRequest(req)}>
                    Analisar Perfil Completo
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="curator-dashboard-container" style={{ display: 'flex', height: 'calc(100vh - 120px)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
      
      {/* Sidebar de Curadoria */}
      <div className="curator-sidebar" style={{ width: '260px', background: '#1a1c20', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '2rem 0', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 1.5rem' }}>
          <ShieldAlert size={24} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold' }}>Painel Curadoria</h2>
        </div>

        {hasAccess('dashboard') && <button onClick={() => setActiveTab('dashboard')} style={navItemStyle(activeTab === 'dashboard')}><BarChart2 size={18}/> Dashboard</button>}
        {hasAccess('autores') && <button onClick={() => setActiveTab('autores')} style={navItemStyle(activeTab === 'autores')}><Users size={18}/> Autores</button>}
        {hasAccess('autores') && <button onClick={() => setActiveTab('leitores')} style={navItemStyle(activeTab === 'leitores')}><Users size={18}/> Leitores</button>}
        {hasAccess('curadoria') && <button onClick={() => setActiveTab('novos_pedidos')} style={navItemStyle(activeTab === 'novos_pedidos')}><UserPlus size={18}/> Novos Pedidos</button>}
        {hasAccess('curadoria') && <button onClick={() => setActiveTab('reprovados')} style={navItemStyle(activeTab === 'reprovados')}><Ban size={18} color={activeTab === 'reprovados' ? '#000' : '#f44336'}/> Reprovados</button>}
        {hasAccess('curadoria') && <button onClick={() => setActiveTab('denuncias')} style={navItemStyle(activeTab === 'denuncias')}><ShieldAlert size={18} color={activeTab === 'denuncias' ? '#000' : '#ff9800'}/> Denúncias</button>}
        {hasAccess('notifications') && <button onClick={() => setActiveTab('notifications')} style={navItemStyle(activeTab === 'notifications')}><Bell size={18}/> Notificações</button>}
        {hasAccess('curadoria') && <button onClick={() => setActiveTab('curadoria')} style={navItemStyle(activeTab === 'curadoria')}><CheckCircle size={18}/> Curadoria</button>}
        {hasAccess('revisoes') && <button onClick={() => setActiveTab('revisoes')} style={navItemStyle(activeTab === 'revisoes')}><FileText size={18}/> Revisões</button>}
        {hasAccess('mensagens') && <button onClick={() => setActiveTab('mensagens')} style={navItemStyle(activeTab === 'mensagens')}><MessageSquare size={18}/> Mensagens</button>}
        {hasAccess('banners') && <button onClick={() => setActiveTab('banners')} style={navItemStyle(activeTab === 'banners')}><Image size={18}/> Banners</button>}
        {hasAccess('curadoria') && <button onClick={() => setActiveTab('gamificacao')} style={navItemStyle(activeTab === 'gamificacao')}><Star size={18}/> Gamificação</button>}
        {hasAccess('equipe') && <button onClick={() => setActiveTab('equipe')} style={navItemStyle(activeTab === 'equipe')}><UserPlus size={18}/> Equipe</button>}

        <div style={{ flex: 1 }}></div>
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setShowHqModal(true)} style={navItemStyle(false)}><Image size={18} color="var(--accent-gold)"/> <span style={{ color: 'var(--accent-gold)' }}>Em breve HQ's</span></button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '3rem', background: 'var(--bg-main)' }}>
        {activeTab === 'dashboard' && hasAccess('dashboard') && renderDashboardGeral()}
        {activeTab === 'autores' && hasAccess('autores') && renderAutores()}
        {activeTab === 'leitores' && hasAccess('autores') && renderLeitores()}
        {activeTab === 'novos_pedidos' && hasAccess('curadoria') && renderNovosPedidos()}
        {activeTab === 'reprovados' && hasAccess('curadoria') && renderReprovados()}
        {activeTab === 'denuncias' && hasAccess('curadoria') && renderDenuncias()}
        {activeTab === 'notifications' && hasAccess('notifications') && renderNotifications()}
        {activeTab === 'curadoria' && hasAccess('curadoria') && renderCuradoria()}
        {activeTab === 'revisoes' && hasAccess('revisoes') && renderRevisoes()}
        {activeTab === 'mensagens' && hasAccess('mensagens') && renderMensagens()}
        {activeTab === 'banners' && hasAccess('banners') && renderBanners()}
        {activeTab === 'gamificacao' && hasAccess('curadoria') && renderGamificacao()}
        {activeTab === 'equipe' && hasAccess('equipe') && renderEquipe()}
      </div>

      {showUserForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif" }}>{editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
              <button onClick={() => setShowUserForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome*</label>
                <input type="text" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>E-mail*</label>
                <input type="email" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Telefone</label>
                <input type="text" value={userFormData.phone || ''} onChange={e => setUserFormData({...userFormData, phone: e.target.value})} className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Papel (Role)</label>
                <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})} className="form-input">
                  <option value="reader">Leitor</option>
                  <option value="author">Autor</option>
                  <option value="curator">Curador</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Biografia (Opcional)</label>
                <textarea value={userFormData.bio || ''} onChange={e => setUserFormData({...userFormData, bio: e.target.value})} className="form-input" style={{ minHeight: '80px' }}></textarea>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="incomplete" checked={userFormData.incompleteProfile} onChange={e => setUserFormData({...userFormData, incompleteProfile: e.target.checked})} />
                <label htmlFor="incomplete" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Marcar perfil como incompleto (Para o usuário preencher depois)</label>
              </div>
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => {
                if (!userFormData.name || !userFormData.email) {
                  if (!window.confirm('Nome ou E-mail estão vazios. Deseja forçar a criação com dados incompletos?')) return;
                }
                const updatedUsers = [...(db.users || [])];
                if (editingUser) {
                  const index = updatedUsers.findIndex(u => u.id === editingUser.id);
                  if (index > -1) {
                    updatedUsers[index] = { ...updatedUsers[index], ...userFormData };
                  }
                } else {
                  updatedUsers.push({
                    id: 'usr_' + Date.now(),
                    ...userFormData,
                    status: 'active',
                    registeredAt: new Date().toISOString(),
                    badges: [],
                    readPages: 0
                  });
                }
                onUpdateData({ ...db, users: updatedUsers });
                setShowUserForm(false);
              }}>
                {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReaderDossier && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'var(--bg-color)', zIndex: 99999, overflowY: 'auto' }}>
          <button onClick={() => setSelectedReaderDossier(null)} style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 100000, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={24} />
          </button>
          <ReaderDashboard db={db} currentUser={selectedReaderDossier} onUpdateData={onUpdateData} onSelectBook={onSelectBook} onSelectBookUniverse={onSelectBookUniverse} />
        </div>
      )}

      <HQModal isOpen={showHqModal} onClose={() => setShowHqModal(false)} />
    </div>
  );
}
