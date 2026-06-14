import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Search, Plus, Trash2, Edit2, ShieldAlert, ArrowLeft, ArrowUp, ArrowDown, Save, FileText, Image, ChevronRight, ChevronDown, Bold, Layout, Layers, Tag, Eye, Lightbulb, Star, Book, Upload, X, MessageSquare, Heart, Menu, Info, Settings, Bell } from 'lucide-react';
import CustomEditor from './CustomEditor';
import JoditEditor from 'jodit-react';
import DossierEditor from './DossierEditor';
import PagesConfig from './PagesConfig';
import SynopsisConfig from './SynopsisConfig';
import BookIdeasBoard from './BookIdeasBoard';
import { uploadImage } from '../lib/supabaseClient';
import { useHashHistory } from '../hooks/useHashHistory';

const editorConfig = {
  readonly: false,
  theme: 'dark',
  height: 600,
  askBeforePasteHTML: true,
  askBeforePasteFromWord: true,
  style: {
    background: 'var(--card-bg)',
    color: 'var(--text-main)',
    fontSize: '1.1rem',
    lineHeight: '1.8'
  },
  buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'paragraph', 'align', '|', 'quote', '|', 'undo', 'redo']
};

export default function AdminPanel({ data, onUpdate, bookId, currentBook, onUpdateBook, currentUser, onLogChange, isReadOnly = false, restrictedTabs = null }) {
  const [activeList, setActiveList] = useState('chapters'); // Default to chapters
  const [editingItem, setEditingItem] = useState(null);
  const handleCloseEdit = useHashHistory(!!editingItem, 'editando', () => setEditingItem(null));
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [activeSubthemeStr, setActiveSubthemeStr] = useState('');
  const [activePageIdxWithinSubtheme, setActivePageIdxWithinSubtheme] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({ what: '', why: '', impact: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showMobileIdeas, setShowMobileIdeas] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const localEditorConfig = {
    ...editorConfig,
    readonly: isReadOnly
  };

  // Auto-save logic
  const autoSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!editingItem || editingItem === 'new' || isReadOnly) return;
    if (Object.keys(formData).length === 0) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const listKey = getListKey(formData.type);
      
      const currentItem = (data[listKey] || []).find(i => i.id === formData.id);
      if (JSON.stringify(currentItem) === JSON.stringify(formData)) return;

      const updatedList = (data[listKey] || []).map(item => item.id === formData.id ? formData : item);
      onUpdate({ ...data, [listKey]: updatedList });
    }, 2000);

    return () => clearTimeout(autoSaveTimeoutRef.current);
  }, [formData, editingItem, isReadOnly, data, onUpdate]);

  const isSerialPublishing = currentBook?.publicationStatus === 'ongoing' && currentBook?.status === 'published';
  const canCreateNew = !isReadOnly && (currentBook?.status === 'draft' || isSerialPublishing || currentUser?.role === 'curator');
  
  let isLockedBy24h = false;
  // O capítulo só bloqueia se não for rascunho e já tiver passado 24h desde a publicação.
  // Rascunhos nunca travam.
  if (isSerialPublishing && currentUser?.role !== 'curator' && editingItem && editingItem !== 'new' && formData?.status !== 'draft') {
    // Usar publishedAt se existir, senão fallback para createdAt para arquivos antigos.
    const dateToCheck = formData?.publishedAt || formData?.createdAt;
    if (dateToCheck) {
      const lockDate = new Date(dateToCheck);
      const diffHours = (new Date() - lockDate) / (1000 * 60 * 60);
      if (diffHours > 24) isLockedBy24h = true;
    } else {
      isLockedBy24h = true; // Arquivos antigos sem data
    }
  }

  const canEditChapter = !isReadOnly && (currentBook?.status === 'draft' || (isSerialPublishing && !isLockedBy24h) || currentUser?.role === 'curator');
  const canViewChapter = isReadOnly || canEditChapter || (isSerialPublishing && isLockedBy24h);
  const effectiveReadOnly = !canEditChapter;
  const isChapterLike = ['chapter', 'prologue', 'preface', 'index', 'dedication', 'acknowledgements', 'epilogue'].includes(formData.type || 'chapter');

  const uniqueSubthemes = isChapterLike ? Array.from(new Set((formData.pages || []).map(p => p.subtheme || ''))) : [];
  const activeSubthemePages = isChapterLike ? (formData.pages || []).map((p, idx) => ({ ...p, globalIdx: idx })).filter(p => (p.subtheme || '') === (activeSubthemeStr || '')) : [];

  const getListKey = (type) => {
    if (type === 'personagem') return 'characters';
    if (type === 'local') return 'locations';
    if (type === 'pista') return 'clues';
    if (type === 'post') return 'posts';
    if (['chapter', 'prologue', 'preface', 'index', 'dedication', 'acknowledgements', 'epilogue'].includes(type)) return 'chapters';
    if (type === 'evento') return 'events';
    return 'organizations';
  };

  const isTabVisible = (tabKey) => {
    if (tabKey === 'posts') return false; // Hiding blog posts tab temporarily as requested
    
    if (currentBook?.bookType === 'short_story') {
      const hiddenForShortStory = ['pages', 'characters', 'locations', 'organizations', 'clues', 'events', 'requests'];
      if (hiddenForShortStory.includes(tabKey)) return false;
    }

    if (!restrictedTabs) return true;
    if (tabKey === 'ideias') return true; // Ideias board is always visible unless specifically restricted
    if (tabKey === 'synopsis') return true; // Configurações should be visible
    return restrictedTabs.includes(tabKey);
  };

  const handleEdit = (item, type) => {
    setEditingItem(item.id);
    setFormData({ ...item, type });
    if (type === 'chapter') {
      const firstSubtheme = item.pages && item.pages.length > 0 ? (item.pages[0].subtheme || '') : '';
      setActiveSubthemeStr(firstSubtheme);
      setActivePageIdxWithinSubtheme(0);
    }
  };

  const handleNew = () => {
    if (isReadOnly) return;
    setEditingItem('new');
    let type = 'personagem';
    if (activeList === 'locations') type = 'local';
    if (activeList === 'clues') type = 'pista';
    if (activeList === 'organizations') type = 'organizacao';
    if (activeList === 'posts') type = 'post';
    if (activeList === 'chapters') type = 'chapter';
    if (activeList === 'events') type = 'evento';
    
    const baseInitialData = { id: Date.now().toString(), type, createdAt: new Date().toISOString(), status: 'draft' };
    if (type === 'pista') {
      setFormData({ ...baseInitialData, name: '', image: '', found: '', wrong_view: '', reality: '', gallery: [] });
    } else if (type === 'post') {
      setFormData({ ...baseInitialData, title: '', content: '', image: '', date: new Date().toLocaleDateString('pt-BR') });
    } else if (type === 'chapter') {
      setFormData({ ...baseInitialData, title: '', pages: [{ subtheme: 'Novo Subtema', text: '', image: '' }] });
      setActiveSubthemeStr('Novo Subtema');
      setActivePageIdxWithinSubtheme(0);
    } else if (type === 'evento') {
      setFormData({ ...baseInitialData, name: '', content: '', tags: '' });
    } else {
      setFormData({ ...baseInitialData, name: '', role: '', territory: '', age: '', image: '', description: '', motivations: '', curiosities: '', connections: [], gallery: [], customFields: [], privateNotes: '' });
    }
  };

  const moveToTrash = (itemType, itemData, parentId = null) => {
    const trashItem = {
      id: 'trash_' + Date.now() + Math.floor(Math.random() * 1000),
      itemType,
      itemData,
      parentId,
      deletedAt: new Date().toISOString()
    };
    const updatedBook = {
      ...currentBook,
      trash: [...(currentBook.trash || []), trashItem]
    };
    onUpdateBook(updatedBook);
  };

  const handleDelete = (id, type) => {
    if (isReadOnly) return;
    if (window.confirm('Tem certeza que deseja excluir? Ele será movido para a Lixeira.')) {
      const listKey = getListKey(type);
      const deletedItem = (data[listKey] || []).find(item => item.id === id);
      if (deletedItem) {
        moveToTrash(type, deletedItem);
      }
      const updatedList = (data[listKey] || []).filter(item => item.id !== id);
      
      if (onLogChange && deletedItem) {
        const typeNames = { chapters: 'capítulo', characters: 'personagem', locations: 'local', organizations: 'organização', clues: 'complemento', items: 'item', events: 'evento/tag', posts: 'notícia/post' };
        const typeName = typeNames[listKey] || 'registro';
        onLogChange(`Excluiu ${typeName}`, deletedItem.name || deletedItem.title || `ID: ${id}`);
      }

      onUpdate({ ...data, [listKey]: updatedList });
      if (editingItem === id) handleCloseEdit();
    }
  };

  const handleSave = () => {
    if (isReadOnly) return;
    const listKey = getListKey(formData.type);
    let updatedList;
    
    if (editingItem === 'new') {
      updatedList = [...(data[listKey] || []), formData];
      setEditingItem(formData.id);
      if (onLogChange) {
        const typeNames = { chapters: 'capítulo', characters: 'personagem', locations: 'local', organizations: 'organização', clues: 'complemento', items: 'item', events: 'evento/tag', posts: 'notícia/post' };
        const typeName = typeNames[activeList] || 'registro';
        onLogChange(`Criou novo(a) ${typeName}`, formData.name || formData.title || 'Sem título');
      }
    } else {
      updatedList = (data[listKey] || []).map(item => item.id === formData.id ? formData : item);
      if (onLogChange) {
        const typeNames = { chapters: 'capítulo', characters: 'personagem', locations: 'local', organizations: 'organização', clues: 'complemento', items: 'item', events: 'evento/tag', posts: 'notícia/post' };
        const typeName = typeNames[activeList] || 'registro';
        onLogChange(`Editou ${typeName}`, formData.name || formData.title || 'Sem título');
      }
    }

    onUpdate({ ...data, [listKey]: updatedList });
  };

  const handleTogglePublishStatus = () => {
    if (isReadOnly || effectiveReadOnly) return;
    
    if (formData.status === 'draft') {
      const updated = { ...formData, status: 'published', publishedAt: new Date().toISOString() };
      setFormData(updated);
      
      const listKey = getListKey(formData.type);
      let updatedList;
      if (editingItem === 'new') {
        updatedList = [...(data[listKey] || []), updated];
        setEditingItem(updated.id);
      } else {
        updatedList = (data[listKey] || []).map(item => item.id === updated.id ? updated : item);
      }
      onUpdate({ ...data, [listKey]: updatedList });
      
    } else {
      const updated = { ...formData, status: 'draft' };
      setFormData(updated);
      
      const listKey = getListKey(formData.type);
      let updatedList = (data[listKey] || []).map(item => item.id === updated.id ? updated : item);
      onUpdate({ ...data, [listKey]: updatedList });
    }
  };

  const handleChange = (e) => {
    if (isReadOnly) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e, fieldName, isGallery = false) => {
    if (isReadOnly) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    let newGalleryUrls = [];

    for (const file of files) {
      try {
        const url = await uploadImage(file);
        if (url) {
          if (isGallery) {
            newGalleryUrls.push(url);
          } else {
            setFormData(prev => ({ ...prev, [fieldName]: url }));
            break; 
          }
        }
      } catch (err) {
        console.error("Erro no upload", err);
        alert(err.message || "Erro ao fazer upload da imagem: " + file.name);
      }
    }

    if (isGallery && newGalleryUrls.length > 0) {
      setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), ...newGalleryUrls] }));
    }

    setUploading(false);
    e.target.value = null;
  };

  const handleFeatureImageUpload = async (e, sectionKey) => {
    if (isReadOnly) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        const fallbackPages = {
          characters: { title: "Personagens", author: "Habitantes do Universo", category: "Conheça os protagonistas e antagonistas", description: "Explore os perfis, motivações e segredos de cada personagem desta história.", image: "/characters_cover.png" },
          locations: { title: "Locais e Territórios", author: "Geografia do Mundo", category: "Onde tudo acontece", description: "Navegue pelos cenários da história. Descubra as zonas seguras, os territórios perigosos e os esconderijos.", image: "/locations_cover.png" },
          organizations: { title: "Organizações", author: "Estruturas de Poder", category: "Facções, Comércios e Instituições", description: "Entenda a engrenagem que move este mundo. De pequenos grupos a grandes impérios.", image: "/org_cover.png" },
          clues: { title: "Complementos", author: "Dossiês Complementares", category: "Complementos e Extras", description: "Explore informações, materiais e arquivos complementares que enriquecem o universo da obra.", image: "/clues_cover.png" }
        };

        const currentPages = { ...(data.pages || fallbackPages) };
        if (currentPages[sectionKey]) {
          currentPages[sectionKey] = { ...currentPages[sectionKey], image: url };
        }
        
        onUpdate({ ...data, pages: currentPages });
        
        if (onLogChange) {
          const sectionNames = { characters: 'Personagens', locations: 'Locais', organizations: 'Organizações', clues: 'Complementos' };
          const secName = sectionNames[sectionKey] || sectionKey;
          onLogChange(`Alterou imagem de destaque`, `Seção: ${secName}`);
        }
        alert("Imagem de destaque atualizada com sucesso!");
      }
    } catch (err) {
      console.error("Erro no upload da imagem de destaque", err);
      alert(err.message || "Erro ao fazer upload da imagem de destaque.");
    }
    setUploading(false);
    e.target.value = null;
  };

  const handlePageChange = (index, field, value) => {
    if (isReadOnly) return;
    const newPages = [...(formData.pages || [])];
    newPages[index] = { ...newPages[index], [field]: value };
    setFormData({ ...formData, pages: newPages });
  };

  const handleSendRequest = () => {
    if (isReadOnly) return;
    if (!requestData.what || !requestData.why) {
      alert("Preencha os campos obrigatórios.");
      return;
    }
    if (onLogChange) {
      onLogChange('Pediu alteração', JSON.stringify(requestData), 'request');
    }
    setShowRequestModal(false);
    setRequestData({ what: '', why: '', impact: '' });
    alert("Pedido enviado para a curadoria com sucesso!");
  };

  const handleAddPage = () => {
    if (isReadOnly) return;
    setFormData({ ...formData, pages: [...(formData.pages || []), { subtheme: '', text: '', image: '' }] });
  };

  const handleRemovePage = (index) => {
    if (isReadOnly) return;
    const newPages = formData.pages.filter((_, i) => i !== index);
    setFormData({ ...formData, pages: newPages });
  };

  const handlePageImageUpload = async (e, pageIndex) => {
    if (isReadOnly) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        handlePageChange(pageIndex, 'image', url);
      }
    } catch (err) {
      console.error("Erro no upload", err);
      alert(err.message || "Erro ao fazer upload da imagem");
    }
    setUploading(false);
    e.target.value = null;
  };

  const handleAddSubtheme = () => {
    if (isReadOnly) return;
    const newSubName = `Novo Subtema ${uniqueSubthemes.length + 1}`;
    setFormData({ ...formData, pages: [...(formData.pages || []), { subtheme: newSubName, text: '', image: '' }] });
    setActiveSubthemeStr(newSubName);
    setActivePageIdxWithinSubtheme(0);
  };

  const handleAddPageToSubtheme = () => {
    if (isReadOnly) return;
    setFormData({ ...formData, pages: [...(formData.pages || []), { subtheme: activeSubthemeStr, text: '', image: '' }] });
    setActivePageIdxWithinSubtheme(activeSubthemePages.length);
  };

  const handleRemoveGlobalPage = (globalIdx) => {
    if (isReadOnly) return;
    if (window.confirm('Tem certeza que deseja excluir esta sessão inteira? Ela será movida para a Lixeira.')) {
      const deletedPage = formData.pages[globalIdx];
      if (deletedPage) {
        moveToTrash('session', deletedPage, formData.id);
      }

      const newPages = formData.pages.filter((_, i) => i !== globalIdx);
      setFormData({ ...formData, pages: newPages });
      setActivePageIdxWithinSubtheme(Math.max(0, activePageIdxWithinSubtheme - 1));
    }
  };

  const handleSubthemeNameChange = (newName) => {
    if (isReadOnly) return;
    const oldName = activeSubthemeStr;
    const newPages = (formData.pages || []).map(p => {
      if ((p.subtheme || '') === oldName) {
        return { ...p, subtheme: newName };
      }
      return p;
    });
    setFormData({ ...formData, pages: newPages });
    setActiveSubthemeStr(newName);
  };

  const handleDeleteReview = (userId) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      const updatedRatings = (currentBook.ratings || []).filter(r => r.userId !== userId);
      const updatedBook = {
        ...currentBook,
        ratings: updatedRatings
      };
      
      onUpdateBook(updatedBook);
      
      if (onLogChange) {
        const deletedReview = (currentBook.ratings || []).find(r => r.userId === userId);
        onLogChange('Moderou avaliação', `Removeu avaliação de ${deletedReview?.userName || userId} (Nota: ${deletedReview?.stars})`);
      }
      alert('Avaliação removida com sucesso!');
    }
  };

  const handleRestoreFromTrash = (trashItem) => {
    if (isReadOnly) return;
    if (trashItem.itemType === 'session') {
      const parentChapter = (data.chapters || []).find(c => c.id === trashItem.parentId);
      if (!parentChapter) {
        alert('O capítulo dessa sessão foi excluído. Restaure o capítulo primeiro.');
        return;
      }
      const updatedChapter = { ...parentChapter, pages: [...(parentChapter.pages || []), trashItem.itemData] };
      const updatedChapters = (data.chapters || []).map(c => c.id === updatedChapter.id ? updatedChapter : c);
      onUpdate({ ...data, chapters: updatedChapters });
    } else {
      const listKey = getListKey(trashItem.itemType);
      const updatedList = [...(data[listKey] || []), trashItem.itemData];
      onUpdate({ ...data, [listKey]: updatedList });
    }
    
    const updatedTrash = (currentBook.trash || []).filter(t => t.id !== trashItem.id);
    onUpdateBook({ ...currentBook, trash: updatedTrash });
    alert('Item restaurado com sucesso!');
  };

  const handleDeletePermanently = (id) => {
    if (isReadOnly) return;
    if (window.confirm('Tem certeza que deseja excluir DEFINITIVAMENTE? Esta ação não pode ser desfeita.')) {
      const updatedTrash = (currentBook.trash || []).filter(t => t.id !== id);
      onUpdateBook({ ...currentBook, trash: updatedTrash });
    }
  };

  const renderTrashTab = () => {
    const trashItems = currentBook?.trash || [];
    return (
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', marginBottom: '2rem' }}>Lixeira</h2>
        {trashItems.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>A lixeira está vazia.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Nome / Título</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Data de Exclusão</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {trashItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{item.itemType === 'session' ? 'Sessão' : item.itemType}</td>
                  <td style={{ padding: '1rem' }}>{item.itemData?.name || item.itemData?.title || 'Sem título'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(item.deletedAt).toLocaleString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => handleRestoreFromTrash(item)} style={{ background: 'rgba(76, 175, 80, 0.1)', border: 'none', color: '#4caf50', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '4px', marginRight: '0.5rem' }}>Restaurar</button>
                    <button onClick={() => handleDeletePermanently(item.id)} style={{ background: 'rgba(255, 68, 68, 0.1)', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '4px' }}>Excluir Definitivamente</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const handleApproveNote = (noteId) => {
    const updatedNotes = (data.notes || []).map(n => n.id === noteId ? { ...n, status: 'accepted' } : n);
    onUpdate({ ...data, notes: updatedNotes });
  };

  const handleRejectNote = (noteId) => {
    const updatedNotes = (data.notes || []).map(n => n.id === noteId ? { ...n, status: 'rejected' } : n);
    onUpdate({ ...data, notes: updatedNotes });
  };

  const renderRequestsTab = () => {
    const requests = currentBook?.universeRequests || [];
    return (
      <div className="admin-content-card" style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', minHeight: '100%', border: '1px solid var(--border-color)' }}>
        <h1 className="admin-content-title" style={{ fontSize: '1.8rem', fontFamily: "'Playfair Display', serif", margin: '0 0 1.5rem 0' }}>Pedidos dos Fãs</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Leitores que solicitaram a criação de áreas do Universo Expandido para esta obra.</p>
        
        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            Nenhum pedido recebido ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map(req => (
              <div key={req.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--accent-gold)' }}>Solicitação de Leitor</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(req.timestamp).toLocaleDateString()}</span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Áreas de Interesse: </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {req.requestedFeatures.map(f => (
                      <span key={f} style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent-gold)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {f === 'characters' ? 'Personagens' : f === 'locations' ? 'Locais' : f === 'organizations' ? 'Organizações' : f === 'clues' ? 'Complementos' : 'Eventos'}
                      </span>
                    ))}
                  </div>
                </div>
                {req.message && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '4px', fontStyle: 'italic', fontSize: '0.95rem' }}>
                    "{req.message}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNotesTab = () => {
    const notes = data.notes || [];
    const pendingNotes = notes.filter(n => n.status === 'pending');
    const acceptedNotes = notes.filter(n => n.status === 'accepted');

    return (
      <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', minHeight: '100%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: "'Playfair Display', serif", margin: '0 0 0.5rem 0' }}>Notas dos Leitores</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Aprove ou rejeite comentários feitos pelos leitores em trechos do livro.</p>
        </div>

        {pendingNotes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            Nenhuma nota pendente de aprovação.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {pendingNotes.map(n => (
              <div key={n.id} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', borderLeft: '4px solid #ff9800' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{n.userName} <span style={{ opacity: 0.5, fontSize: '0.8rem', fontWeight: 'normal' }}>- {new Date(n.createdAt).toLocaleDateString()}</span></div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleApproveNote(n.id)} style={{ padding: '0.4rem 0.8rem', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Aceitar</button>
                    <button onClick={() => handleRejectNote(n.id)} style={{ padding: '0.4rem 0.8rem', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Rejeitar</button>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem', fontStyle: 'italic' }}>
                  Trecho de referência: Capítulo {n.chapterId}, Subtema: {n.subthemeStr}
                </div>
                <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>"{n.text}"</div>
              </div>
            ))}
          </div>
        )}

        {acceptedNotes.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontFamily: "'Playfair Display', serif", borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Notas Aprovadas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {acceptedNotes.map(n => (
                <div key={n.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 'bold' }}>{n.userName}</div>
                    <div style={{ opacity: 0.7, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Heart size={14} /> {n.likes?.length || 0} curtidas</div>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>{n.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReviewsTab = () => {
    const ratings = currentBook?.ratings || [];
    const count = ratings.length;
    const avg = count > 0 
      ? (ratings.reduce((sum, r) => sum + r.stars, 0) / count).toFixed(1)
      : '0.0';

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      if (distribution[r.stars] !== undefined) {
        distribution[r.stars]++;
      }
    });

    const isCurator = currentUser?.role === 'curator';

    return (
      <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', minHeight: '100%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: "'Playfair Display', serif", margin: '0 0 0.5rem 0' }}>Avaliações & Recomendações</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Opiniões e avaliações do público sobre a obra <strong>{currentBook?.title}</strong>.</p>
        </div>

        {/* Tutorial Box */}
        <div style={{ 
          background: 'rgba(212, 175, 55, 0.05)', 
          border: '1px solid rgba(212, 175, 55, 0.2)', 
          borderRadius: '8px', 
          padding: '1.2rem', 
          fontSize: '0.9rem',
          lineHeight: 1.5,
          color: '#e2d4b7'
        }}>
          <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '1rem' }}>
            ⭐ Central de Avaliações e Feedback dos Leitores
          </div>
          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Para que serve:</strong> Acompanhar as notas médias, a distribuição de estrelas e os comentários/críticas dos leitores que estão acompanhando a obra.</p>
          <p style={{ margin: 0 }}><strong>Onde o leitor acessa:</strong> Os leitores avaliam o livro no modal final de leitura ou pela vitrine. A média e a quantidade de avaliações são expostas em destaque nos cards da vitrine principal para novos leitores.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '2px solid var(--accent-gold)' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{avg}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.2rem' }}>de 5.0</span>
            </div>
            <div>
              <div style={{ display: 'flex', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>
                {Array.from({ length: Math.round(Number(avg)) }).map((_, i) => <Star key={i} size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />)}
                {Array.from({ length: 5 - Math.round(Number(avg)) }).map((_, i) => <Star key={i} size={18} fill="none" color="var(--accent-gold)" />)}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{count === 1 ? '1 avaliação' : `${count} avaliações`}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Média acumulada do livro</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[5, 4, 3, 2, 1].map(stars => {
              const starsCount = distribution[stars];
              const pct = count > 0 ? (starsCount / count) * 100 : 0;
              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' }}>
                  <span style={{ width: '60px', color: 'var(--text-muted)', textAlign: 'right' }}>{stars} estrela{stars > 1 ? 's' : ''}</span>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-gold)', borderRadius: '4px' }}></div>
                  </div>
                  <span style={{ width: '30px', color: 'var(--text-main)', fontWeight: 'bold' }}>{starsCount}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", margin: 0 }}>Comentários Recentes</h2>
          {count === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              Nenhuma avaliação recebida ainda para este livro.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Leitor</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Avaliação</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Comentário (Máx. 12 char)</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Data</th>
                  {isCurator && !isReadOnly && <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Moderação</th>}
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>{rating.userName}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ display: 'flex', color: 'var(--accent-gold)' }}>
                        {Array.from({ length: rating.stars }).map((_, i) => <Star key={i} size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />)}
                        {Array.from({ length: 5 - rating.stars }).map((_, i) => <Star key={i} size={14} fill="none" color="var(--accent-gold)" />)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {rating.comment ? (
                        <span style={{ 
                          background: 'rgba(212,175,55,0.08)', 
                          border: '1px solid rgba(212,175,55,0.2)', 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '4px', 
                          color: 'var(--accent-gold)', 
                          fontWeight: 'bold',
                          fontSize: '0.85rem'
                        }}>
                          {rating.comment}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Sem comentário</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{rating.date}</td>
                    {isCurator && !isReadOnly && (
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDeleteReview(rating.userId)}
                          style={{ background: 'rgba(255, 68, 68, 0.1)', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Excluir Avaliação"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderSectionTutorial = (listKey) => {
    const tutorials = {
      chapters: {
        title: "📖 Capítulos e Lançamentos",
        purpose: "Escrever a história principal dividida em capítulos e sessões. Cada sessão representa um trecho ou subtema que pode ser ilustrado com uma imagem específica de cena.",
        where: "No leitor de livros (Modo Leitura). Quando o leitor avança na leitura das sessões, a respectiva ilustração de cena aparece no painel lateral direito.",
        imageDim: "Ilustrações de sessão/capítulo: Qualquer proporção (idealmente paisagem ou conceitual para preencher o painel lateral)."
      },
      characters: {
        title: "👥 Dossiê de Personagens",
        purpose: "Criar a galeria de personagens da sua história. Permite detalhar dados pessoais, biografia, conexões de relacionamento e curiosidades para engajar o leitor.",
        where: "Na aba 'Personagens' do Universo do livro. O leitor clica no card do personagem para abrir o dossiê completo. A listagem é ordenada automaticamente pela importância de cena.",
        imageDim: "Capa de Destaque da Seção (botão acima): Proporção 2:3 (800x1200px). Fotos de identificação no dossiê: Proporção 1:1 (quadrada, ex: 400x400px)."
      },
      locations: {
        title: "📍 Dossiê de Locais e Ambientação",
        purpose: "Registrar os pontos de encontro, territórios, edifícios ou geografias onde se passam as cenas. Útil para estruturar a ambientação do cenário e os frequentadores.",
        where: "Na aba 'Locais' do Universo do livro. O leitor clica no local para abrir a ficha de ambientação e conferir as curiosidades e segredos.",
        imageDim: "Capa de Destaque da Seção (botão acima): Proporção 2:3 (800x1200px). Fotos de identificação do local: Qualquer proporção (idealmente paisagem)."
      },
      organizations: {
        title: "🏢 Dossiê de Organizações e Grupos",
        purpose: "Mapear corporações, clãs, facções, empresas ou órgãos públicos do seu mundo fictício. Serve para o leitor entender as estruturas de poder, objetivos e afiliações.",
        where: "Na aba 'Organizações' do Universo. O leitor confere a estrutura da entidade e a lista de membros e afiliados vinculados.",
        imageDim: "Capa de Destaque da Seção (botão acima): Proporção 2:3 (800x1200px). Foto da organização (brasão/sede): Qualquer proporção."
      },
      clues: {
        title: "🔮 Dossiê de Complementos e Lore Extra",
        purpose: "Seção livre e adaptável para enriquecer o lore do seu livro com segredos, grimórios, itens mágicos, diários ou lendas específicas do gênero literário da sua obra.",
        where: "Na aba 'Complementos' do Universo. Os leitores que gostam de explorar detalhes profundos da história acessam esses dossiês extras para desvendar mistérios e curiosidades.",
        imageDim: "Capa de Destaque da Seção (botão acima): Proporção 2:3 (800x1200px). Imagem do complemento (item/artefato): Qualquer proporção."
      },
      events: {
        title: "📅 Ocorrências e Tags de Linha do Tempo",
        purpose: "Registrar eventos importantes da história (ex: reuniões, crimes, festas, incidentes). Ao associar tags com os nomes exatos de personagens ou locais, o sistema realiza o cruzamento de dados automaticamente.",
        where: "Como post-its azuis dinâmicos anexados no canto das fichas técnicas dos personagens ou locais correspondentes, enriquecendo o dossiê deles com ocorrências em que participaram.",
        imageDim: "Não possui imagens. O foco desta seção é puramente textual e relacional."
      }
    };

    const tut = tutorials[listKey];
    if (!tut) return null;

    return (
      <div style={{ 
        background: 'rgba(212, 175, 55, 0.05)', 
        border: '1px solid rgba(212, 175, 55, 0.2)', 
        borderRadius: '8px', 
        padding: '1.2rem', 
        marginBottom: '2rem',
        fontSize: '0.9rem',
        lineHeight: 1.5,
        color: '#e2d4b7'
      }}>
        <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '1rem' }}>
          {tut.title}
        </div>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>Para que serve:</strong> {tut.purpose}</p>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>Onde o leitor acessa:</strong> {tut.where}</p>
        <p style={{ margin: 0 }}><strong>Diretrizes de Imagens:</strong> {tut.imageDim}</p>
      </div>
    );
  };

  const navItemStyle = (isActive) => ({
    background: isActive ? 'var(--accent-gold)' : 'transparent',
    color: isActive ? '#000' : 'var(--text-muted)',
    border: isActive ? 'none' : '1px solid var(--border-color)',
    padding: '1rem 1.5rem',
    textAlign: 'left',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.3s',
    margin: '0 1.5rem 0.5rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  });

  const formFieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100%', width: '100%', color: 'var(--text-main)', background: 'var(--bg-color)', position: 'relative' }}>
      
      {/* Botão Mobile para abrir menu nas outras abas */}
      {!['characters', 'locations', 'organizations', 'posts', 'events', 'chapters', 'clues'].includes(activeList) && (
        <button 
          className="mobile-only admin-mobile-menu-btn"
          onClick={() => setIsSidebarOpen(true)}
          style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000, background: 'var(--accent-gold)', color: '#000', border: 'none', padding: '0.5rem', borderRadius: '4px' }}
        >
          <Menu size={24} />
        </button>
      )}

      {/* Overlay escuro quando o menu tá aberto no mobile */}
      {isSidebarOpen && (
        <div 
          className="mobile-only admin-mobile-overlay"
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998 }}
        />
      )}

      {/* Left Sidebar: CMS Menu */}
      <div className={`author-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ width: '260px', borderRight: '1px solid var(--border-color)', backgroundColor: '#1a1c20', display: 'flex', flexDirection: 'column', padding: '2rem 0', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={24} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>CMS</h2>
          </div>
          <button className="mobile-only admin-mobile-close-btn" onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#fff' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ borderBottom: '1px solid var(--border-color)', margin: '0 1.5rem 2rem 1.5rem' }}></div>

        {!isReadOnly && isTabVisible('synopsis') && (
          <button style={{...navItemStyle(activeList === 'synopsis'), background: activeList === 'synopsis' ? 'var(--accent-gold)' : 'rgba(212, 175, 55, 0.1)', color: activeList === 'synopsis' ? '#000' : 'var(--accent-gold)'}} onClick={() => {setActiveList('synopsis'); setEditingItem(null);}}>
            <Settings size={18} /> Configurações da Obra
          </button>
        )}

        {isTabVisible('chapters') && (
          <button style={navItemStyle(activeList === 'chapters')} onClick={() => {setActiveList('chapters'); setEditingItem(null);}}>
            <Book size={18} /> Livro / Capítulos
          </button>
        )}
        {isTabVisible('pages') && (
          <button style={navItemStyle(activeList === 'pages')} onClick={() => {setActiveList('pages'); setEditingItem(null);}}>Bio e Apresentações</button>
        )}
        {isTabVisible('characters') && (
          <button style={navItemStyle(activeList === 'characters')} onClick={() => {setActiveList('characters'); setEditingItem(null);}}>Personagens</button>
        )}
        {isTabVisible('locations') && (
          <button style={navItemStyle(activeList === 'locations')} onClick={() => {setActiveList('locations'); setEditingItem(null);}}>Locais</button>
        )}
        {isTabVisible('organizations') && (
          <button style={navItemStyle(activeList === 'organizations')} onClick={() => {setActiveList('organizations'); setEditingItem(null);}}>Organizações</button>
        )}
        {isTabVisible('clues') && (
          <button style={navItemStyle(activeList === 'clues')} onClick={() => {setActiveList('clues'); setEditingItem(null);}}>Complementos</button>
        )}
        {isTabVisible('posts') && (
          <button style={navItemStyle(activeList === 'posts')} onClick={() => {setActiveList('posts'); setEditingItem(null);}}>Blog / Notícias</button>
        )}
        {isTabVisible('events') && (
          <button style={navItemStyle(activeList === 'events')} onClick={() => {setActiveList('events'); setEditingItem(null);}}>Eventos / Tags</button>
        )}
        {isTabVisible('reviews') && (
          <button style={navItemStyle(activeList === 'reviews')} onClick={() => {setActiveList('reviews'); setEditingItem(null);}}>
            <Star size={18} /> Avaliações
          </button>
        )}
        {isTabVisible('ideias') && (
          <button style={navItemStyle(activeList === 'ideias')} onClick={() => {setActiveList('ideias'); setEditingItem(null);}}>
            <Lightbulb size={18} /> Painel de Ideias
          </button>
        )}
        <button style={navItemStyle(activeList === 'notes')} onClick={() => {setActiveList('notes'); setEditingItem(null);}}>
            <MessageSquare size={18} /> Notas dos Leitores
        </button>
        {isTabVisible('requests') && (
          <button style={navItemStyle(activeList === 'requests')} onClick={() => {setActiveList('requests'); setEditingItem(null);}}>
            <Bell size={18} /> Pedidos dos Fãs
          </button>
        )}
        <button style={navItemStyle(activeList === 'trash')} onClick={() => {setActiveList('trash'); setEditingItem(null);}}>
            <Trash2 size={18} /> Lixeira
        </button>
        
        <div style={{ flex: 1 }}></div>
      </div>

      {/* Center Area: List */}
      <div className={`admin-content-wrapper ${editingItem ? 'hide-on-mobile-edit' : ''}`} style={{ flex: 1, padding: '3rem', overflowY: 'auto', backgroundColor: 'var(--bg-color)' }}>
        {activeList === 'pages' ? (
          <PagesConfig universe={data} onUpdate={onUpdate} isReadOnly={isReadOnly} currentBook={currentBook} onLogChange={onLogChange} />
        ) : activeList === 'synopsis' && currentBook ? (
          <SynopsisConfig book={currentBook} onUpdateBook={onUpdateBook} isReadOnly={isReadOnly} onLogChange={onLogChange} />
        ) : activeList === 'reviews' ? (
          renderReviewsTab()
        ) : activeList === 'notes' ? (
          renderNotesTab()
        ) : activeList === 'requests' ? (
          renderRequestsTab()
        ) : activeList === 'trash' ? (
          renderTrashTab()
        ) : activeList === 'ideias' ? (
          <BookIdeasBoard 
            book={currentBook} 
            onUpdateBook={(updatedBook) => onUpdateBook(updatedBook)}
          />
        ) : (
          <div className="admin-content-card" style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', minHeight: '100%', border: '1px solid var(--border-color)' }}>
            {!canCreateNew && currentUser?.role === 'author' && (
              <div style={{ background: 'rgba(255, 152, 0, 0.1)', border: '1px solid #ff9800', color: '#ff9800', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} />
                <span><strong>Atenção:</strong> Como o livro foi enviado, a criação de novos itens e edição de Capítulos estão bloqueados. As demais edições serão logadas para a Curadoria.</span>
              </div>
            )}
            <div className="admin-list-header">
              <div className="admin-list-header-top">
                <h1 className="admin-content-title" style={{ fontSize: '1.8rem', fontFamily: "'Playfair Display', serif", margin: 0 }}>
                  {activeList === 'characters' ? 'Personagens' : 
                   activeList === 'locations' ? 'Locais' : 
                   activeList === 'organizations' ? 'Organizações' : 
                   activeList === 'posts' ? 'Blog / Notícias' : 
                   activeList === 'events' ? 'Eventos / Ocorrências' : 
                   activeList === 'chapters' ? 'Capítulos do Livro' : 'Complementos'}
                </h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="admin-tutorial-info-btn" onClick={() => setShowTutorialModal(true)} style={{ background: 'none', border: '2px solid var(--accent-gold)', borderRadius: '50%', color: 'var(--accent-gold)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <Info size={16} />
                  </button>
                  <button 
                    className="mobile-only admin-mobile-menu-btn"
                    onClick={() => setIsSidebarOpen(true)}
                    style={{ background: 'var(--accent-gold)', color: '#000', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Menu size={20} />
                  </button>
                </div>
              </div>
              <div className="admin-list-header-actions">
                {canCreateNew && !isReadOnly && ['characters', 'locations', 'organizations', 'clues'].includes(activeList) && (
                  <label className="btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }} title="Dimensões recomendadas: Proporção 2:3 (Ex: 800x1200px)">
                    {uploading ? 'Enviando...' : <><Upload size={16} /> <span>Alterar Capa</span></>}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFeatureImageUpload(e, activeList)} />
                  </label>
                )}
                {canCreateNew && !isReadOnly && (
                  <button className="btn-primary admin-btn-new" onClick={handleNew} style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', justifyContent: 'center' }}>
                    <Plus size={16} /> <span>Novo Registro</span>
                  </button>
                )}
              </div>
            </div>
            {showTutorialModal && (
              <div className="admin-tutorial-modal-overlay mobile-only" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }} onClick={() => setShowTutorialModal(false)}>
                <div style={{ background: 'var(--card-bg)', width: '100%', borderRadius: '8px', padding: '1.5rem', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setShowTutorialModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-main)' }}>
                    <X size={24} />
                  </button>
                  <div style={{ marginTop: '1rem' }}>
                    {renderSectionTutorial(activeList)}
                  </div>
                </div>
              </div>
            )}

            {/* Unified Cards Grid for both Mobile and Desktop */}
            <div className="admin-cards-grid">
              {(data[activeList] || []).length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum registro encontrado.</div>
              ) : (
                (data[activeList] || []).map(item => (
                  <div 
                    key={item.id} 
                    className="admin-list-card" 
                    onClick={() => {
                      if (!canViewChapter && activeList === 'chapters') return;
                      handleEdit(item, item.type || (activeList === 'chapters' ? 'chapter' : ''));
                    }}
                  >
                    {activeList !== 'chapters' && item.image && (
                      <img src={item.image} alt={item.title || item.name} />
                    )}
                    <div className="admin-list-card-content">
                      <div className="admin-list-card-title">
                        {item.status === 'draft' && <span style={{ color: '#f44336', fontSize: '0.75rem', fontWeight: 'bold', marginRight: '0.5rem', background: 'rgba(244,67,54,0.1)', padding: '2px 6px', borderRadius: '4px' }}>[RASCUNHO]</span>}
                        {item.title || item.name}
                      </div>
                      <div className="admin-list-card-desc">
                        {item.type === 'post' ? item.date : 
                         item.type === 'chapter' ? `${item.pages?.length || 0} sessões` :
                         item.type === 'pista' ? 'Complemento' : item.territory}
                      </div>
                    </div>
                    {/* Botões de ação rápida para desktop */}
                    {!isReadOnly && !(activeList === 'chapters' && !canEditChapter) && (
                      <div className="desktop-only" style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Tem certeza que deseja excluir?')) {
                              handleDelete(item.id, item.type || (activeList === 'chapters' ? 'chapter' : ''));
                            }
                          }}
                          style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4d4d', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s' }}
                          title="Excluir"
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,0,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,0,0,0.1)'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Area: Edit Panel (Standard or Dossier) */}
      {editingItem && !isChapterLike && (
        formData.type === 'post' || formData.type === 'evento' ? (
          <div className="admin-edit-panel" style={{ width: '450px', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '-5px 0 25px rgba(0,0,0,0.5)', zIndex: 10, flexShrink: 0 }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1c20' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontFamily: "'Playfair Display', serif" }}>{isReadOnly ? 'Visualizar Registro' : (editingItem === 'new' ? 'Criar Registro' : 'Editar Registro')}</h2>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {formData.type === 'post' ? (
                <>
                  <div style={formFieldStyle}>
                    <label>Título da Postagem</label>
                    <input type="text" name="title" value={formData.title || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
                  </div>
                  <div style={formFieldStyle}>
                    <label>Data de Publicação</label>
                    <input type="text" name="date" value={formData.date || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
                  </div>
                  <div style={formFieldStyle}>
                    <label>Conteúdo da Postagem</label>
                    <JoditEditor
                      value={formData.content || ''}
                      config={localEditorConfig}
                      onBlur={(newContent) => {
                        if (!isReadOnly) setFormData({ ...formData, content: newContent });
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={formFieldStyle}>
                    <label>Nome do Evento (Ex: Confusão no bar)</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
                  </div>
                  <div style={formFieldStyle}>
                    <label>Descrição do Evento / Curiosidade</label>
                    <CustomEditor 
                      value={formData.content || ''} 
                      onChange={(val) => setFormData({...formData, content: val})} 
                      disabled={isReadOnly} 
                      placeholder="Escreva o conteúdo do subtema aqui..."
                    />
                  </div>
                  <div style={formFieldStyle}>
                    <label>Tags (Nomes separados por vírgula)</label>
                    <input type="text" name="tags" value={formData.tags || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" placeholder="Ex: Luan, Camila, Bar da Esquina" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
                    <small style={{ color: 'var(--text-muted)' }}>Ao colocar o nome idêntico de um personagem ou local aqui, este evento aparecerá no Dossiê dele(a).</small>
                  </div>
                </>
              )}
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end', backgroundColor: '#1a1c20' }}>
              <button className="btn-secondary" onClick={() => setEditingItem(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18} /> Voltar
              </button>
              {!effectiveReadOnly && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={handleTogglePublishStatus} 
                    style={{ background: formData.status === 'draft' ? '#4CAF50' : '#f44336', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {formData.status === 'draft' ? 'Publicar' : 'Reverter para Rascunho'}
                  </button>
                  <button className="btn-primary" onClick={handleSave}><Save size={18} /> Salvar</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="admin-edit-panel" style={{ width: '800px', maxWidth: '100vw', backgroundColor: '#e8e6df', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', zIndex: 10, flexShrink: 0, position: 'relative' }}>
            <DossierEditor 
              formData={formData} 
            setFormData={setFormData} 
            onSave={handleSave} 
            onCancel={() => setEditingItem(null)} 
            uploading={uploading} 
            handleFileUpload={handleFileUpload} 
            isReadOnly={isReadOnly}
            bookTitle={currentBook?.title}
          />
          </div>
        )
      )}

      {/* Full Screen Modal: Chapter Editor (3 Columns) */}
      {editingItem && isChapterLike && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column',
          color: 'var(--text-main)'
        }}>
          {/* Header */}
          <div className="editor-header-container" style={{ borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1c20' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
              <button className="mobile-only" onClick={() => setShowMobileSidebar(true)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Menu size={24} />
              </button>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formData.title || (isReadOnly ? 'Visualizar Capítulo' : (editingItem === 'new' ? 'Escrever Novo' : 'Editar Capítulo'))}
              </h2>
            </div>
            <div className="editor-header-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="btn-secondary" onClick={() => setEditingItem(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <ArrowLeft size={16} /> <span>Voltar</span>
              </button>
              {!effectiveReadOnly && (
                <>
                  {/* Botões grandes apenas no desktop */}
                  <div className="desktop-only" style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={handleTogglePublishStatus} 
                      style={{ background: formData.status === 'draft' ? '#4CAF50' : '#f44336', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', fontSize: '1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {formData.status === 'draft' ? 'Publicar Capítulo' : 'Reverter para Rascunho'}
                    </button>
                    <button className="btn-primary" onClick={handleSave} style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}><Save size={16} /> Salvar</button>
                  </div>
                  {/* Botão de salvar icone apenas no mobile */}
                  <button className="mobile-only" onClick={handleSave} style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Salvar">
                    <Save size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* 3-Column Body */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* COLUMN 1: Left (Navegação de Subtemas) */}
            <div className={`editor-mobile-sidebar ${showMobileSidebar ? 'open' : ''}`}>
              
              {/* Overlay for mobile sidebar */}
              {showMobileSidebar && (
                <div 
                  className="mobile-only"
                  onClick={() => setShowMobileSidebar(false)}
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: -1 }}
                />
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ ...formFieldStyle }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Título</label>
                  <input type="text" name="title" value={formData.title || ''} onChange={handleChange} disabled={effectiveReadOnly} className="form-input" placeholder="Ex: Um dia comum" style={{ fontSize: '1rem', padding: '0.8rem', opacity: effectiveReadOnly ? 0.7 : 1 }} />
                </div>
                <div style={{ ...formFieldStyle }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Tipo</label>
                  <select name="type" value={formData.type || 'chapter'} onChange={handleChange} disabled={effectiveReadOnly} className="form-input" style={{ fontSize: '0.95rem', padding: '0.8rem', opacity: effectiveReadOnly ? 0.7 : 1, backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                    <option value="chapter">Capítulo</option>
                    <option value="prologue">Prólogo</option>
                    <option value="preface">Prefácio</option>
                    <option value="index">Índice</option>
                    <option value="dedication">Dedicatória</option>
                    <option value="acknowledgements">Agradecimentos</option>
                    <option value="epilogue">Epílogo</option>
                  </select>
                </div>
                
                <div className="mobile-only" style={{ ...formFieldStyle, marginTop: '1rem' }}>
                  {!effectiveReadOnly && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button className="btn-primary" onClick={() => { handleSave(); setShowMobileSidebar(false); }} style={{ padding: '0.8rem', fontSize: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Save size={16} /> Salvar Alterações
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Subtemas</h3>
                  {!effectiveReadOnly && <button onClick={handleAddSubtheme} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Novo Subtema"><Plus size={20} /></button>}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {uniqueSubthemes.map((subName, idx) => {
                    const isActive = subName === activeSubthemeStr;
                    return (
                      <button 
                        key={idx}
                        onClick={() => { setActiveSubthemeStr(subName); setActivePageIdxWithinSubtheme(0); }}
                        style={{
                          background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                          color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                          border: isActive ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                          padding: '0.8rem 1rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.2s'
                        }}
                      >
                        {subName || 'Sem Título'}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Center (Editor de Texto) */}
            <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }}>
              
              {uniqueSubthemes.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Nenhum subtema configurado.</div>
              ) : activeSubthemePages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Nenhuma página encontrada.</div>
              ) : (() => {
                const activePage = activeSubthemePages[activePageIdxWithinSubtheme];
                if (!activePage) return null;

                return (
                  <>
                    <div className="editor-title-container" style={{ flexShrink: 0 }}>
                      <input 
                        type="text" 
                        value={activePage.subtheme || ''} 
                        onChange={(e) => handleSubthemeNameChange(e.target.value)} 
                        disabled={effectiveReadOnly}
                        className="form-input" 
                        placeholder="Nome do Subtema..." 
                        style={{ fontSize: '1.2rem', padding: '0.5rem 1rem', fontFamily: "'Playfair Display', serif", backgroundColor: 'transparent', border: 'none', borderRadius: 0, color: 'var(--accent-gold)', opacity: effectiveReadOnly ? 0.8 : 1, width: '100%', borderBottom: 'none' }} 
                      />

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                        {activeSubthemePages.map((p, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setActivePageIdxWithinSubtheme(idx)}
                            style={{
                              background: idx === activePageIdxWithinSubtheme ? 'var(--card-bg)' : 'transparent',
                              color: idx === activePageIdxWithinSubtheme ? 'var(--text-main)' : 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                              borderBottom: idx === activePageIdxWithinSubtheme ? '1px solid var(--card-bg)' : '1px solid var(--border-color)',
                              padding: '0.6rem 1.5rem', borderRadius: '8px 8px 0 0', cursor: 'pointer',
                              fontWeight: idx === activePageIdxWithinSubtheme ? 'bold' : 'normal',
                              marginBottom: '-1px', zIndex: idx === activePageIdxWithinSubtheme ? 2 : 1
                            }}
                          >
                            Sessão {idx + 1}
                          </button>
                        ))}
                        {!effectiveReadOnly && (
                          <button 
                            onClick={handleAddPageToSubtheme} 
                            style={{ background: 'transparent', color: 'var(--accent-gold)', border: '1px dashed var(--accent-gold)', padding: '0.6rem 1.2rem', borderRadius: '8px 8px 0 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}
                          >
                            <Plus size={14} /> Nova Sessão
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="editor-text-container" style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                      <CustomEditor
                        value={activePage.text || ''}
                        onChange={(newContent) => {
                          if (!effectiveReadOnly) handlePageChange(activePage.globalIdx, 'text', newContent);
                        }}
                        disabled={effectiveReadOnly}
                        placeholder="Escreva a sessão do capítulo aqui..."
                      />
                    </div>

                    <div className="editor-footer-container" style={{ marginTop: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', flexShrink: 0 }}>
                      <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Mídia da Sessão {activePageIdxWithinSubtheme + 1}</h3>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ilustração (Aparece na direita do Leitor)</label>
                        {activePage.image && <img src={activePage.image} style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem' }} />}
                        
                        {!effectiveReadOnly ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                            <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '0.8rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {uploading ? 'Enviando...' : <><Upload size={16} /> Fazer Upload da Imagem</>}
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePageImageUpload(e, activePage.globalIdx)} />
                            </label>
                            <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.7rem' }}>OU COLE UMA URL</div>
                            <input type="text" value={activePage.image || ''} onChange={(e) => handlePageChange(activePage.globalIdx, 'image', e.target.value)} className="form-input" placeholder="https://..." style={{ padding: '0.8rem', fontSize: '0.85rem' }} />
                          </div>
                        ) : (
                          activePage.image && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.5rem' }}>Link: {activePage.image}</div>
                        )}
                      </div>

                      {!effectiveReadOnly && (
                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          {/* Botão de Publicar apenas no mobile aqui no final */}
                          <div className="mobile-only" style={{ flex: 1, minWidth: '150px' }}>
                            <button 
                              onClick={() => { handleTogglePublishStatus(); setShowMobileSidebar(false); }} 
                              style={{ width: '100%', background: formData.status === 'draft' ? '#4CAF50' : '#f44336', color: '#fff', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                              {formData.status === 'draft' ? 'Publicar Capítulo' : 'Reverter para Rascunho'}
                            </button>
                          </div>
                          
                          <button onClick={() => {
                            handleRemoveGlobalPage(activePage.globalIdx);
                          }} style={{ flex: 1, minWidth: '150px', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                            <Trash2 size={18} /> Excluir Sessão Atual
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* COLUMN 3: Right (Ideias) */}
            <div className="desktop-only" style={{ width: '420px', borderLeft: '1px solid var(--border-color)', backgroundColor: '#1a1c20', display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
              {currentBook && (
                <BookIdeasBoard book={currentBook} onUpdateBook={onUpdateBook} />
              )}
            </div>

          </div>
        </div>
      )}

      {showRequestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '12px', width: '500px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', marginTop: 0 }}>Pedido de Alteração</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>O livro já foi publicado ou enviado. A criação de novos capítulos e personagens passará por avaliação.</p>
            
            <div style={formFieldStyle}>
              <label>O que você quer editar/adicionar?</label>
              <input type="text" value={requestData.what} onChange={(e) => setRequestData({...requestData, what: e.target.value})} className="form-input" placeholder="Ex: Adicionar um novo personagem..." />
            </div>
            
            <div style={formFieldStyle}>
              <label>Por que deseja realizar essa alteração?</label>
              <textarea value={requestData.why} onChange={(e) => setRequestData({...requestData, why: e.target.value})} className="form-input" rows="3"></textarea>
            </div>
            
            <div style={formFieldStyle}>
              <label>Qual o impacto na obra já publicada?</label>
              <textarea value={requestData.impact} onChange={(e) => setRequestData({...requestData, impact: e.target.value})} className="form-input" rows="3"></textarea>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setShowRequestModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSendRequest} style={{ background: '#2196F3' }}>Enviar Pedido</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB: Floating Action Button (Mobile Only) */}
      {editingItem && formData.type === 'chapter' && (
        <div className="mobile-only">
          <button 
            onClick={() => setShowMobileIdeas(true)}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-gold)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              border: 'none',
              zIndex: 1000,
              cursor: 'pointer'
            }}
          >
            <Lightbulb size={28} />
          </button>
        </div>
      )}

      {/* Mobile Ideas Modal */}
      {showMobileIdeas && (
        <div className="mobile-only" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-gold)', fontFamily: "'Playfair Display', serif" }}>Painel de Ideias</h3>
            <button onClick={() => setShowMobileIdeas(false)} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#1a1c20' }}>
            {currentBook && (
              <BookIdeasBoard book={currentBook} onUpdateBook={onUpdateBook} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
