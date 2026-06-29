import { toast } from 'react-hot-toast';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useState, useEffect } from 'react';
import { Home, Users, Map, Search, BookOpen, Settings, Key, Building, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import ImageLightbox from './ImageLightbox';
import DetailModal from './DetailModal';
import AdminPanel from './AdminPanel';
import Reader from './Reader';
import AuthorModal from './AuthorModal';
import { useHashHistory } from '../hooks/useHashHistory';
import { supabase } from '../lib/supabaseClient';

const ExpandableText = ({ text, maxLength = 250 }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return null;
  if (text.length <= maxLength) return <p className="description" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{text}</p>;
  
  if (expanded) {
    return (
      <p className="description" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
        {text} <span style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setExpanded(false)}>ver menos</span>
      </p>
    );
  }
  
  return (
    <p className="description" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
      {text.substring(0, maxLength)}... <span style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setExpanded(true)}>leia mais</span>
    </p>
  );
};


export default function UniverseView({ bookId, currentUser, initialTab, onLeave }) {
  const [localData, setLocalData] = useState(null);

  useEffect(() => {
    async function loadUniverseData() {
      const fetchWithRetry = async (queryPromiseFn, timeoutMs = 12000, retries = 2) => {
        const withTimeout = (promise, ms) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
          ]);
        };

        for (let i = 0; i < retries; i++) {
          try {
            console.log(`[UniverseView] Fetch attempt ${i + 1}...`);
            return await withTimeout(queryPromiseFn(), timeoutMs);
          } catch (err) {
            console.warn(`[UniverseView] Attempt ${i + 1} failed:`, err);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      };

      let profiles = [];
      let bookResult = null;

      try {
        const { data, error } = await fetchWithRetry(
          () => supabase.from('profiles').select('*'),
          12000,
          2
        );
        if (error) console.error("[UniverseView] Error profiles:", error);
        if (data) profiles = data;
      } catch (e) {
        console.error("[UniverseView] Profiles fetch exception:", e);
      }

      try {
        const { data, error } = await fetchWithRetry(
          () => supabase.from('books').select('*').eq('id', bookId).single(),
          12000,
          2
        );
        if (error) console.error("[UniverseView] Error book:", error);
        if (data) bookResult = data;
      } catch (e) {
        console.error("[UniverseView] Book fetch exception:", e);
      }

      setLocalData({
        users: (profiles || []).map(p => ({
          id: p.id, role: p.role, name: p.name, nickname: p.nickname, email: p.email, avatar: p.avatar_url, displayMode: p.display_mode
        })),
        books: bookResult ? [{
          id: bookResult.id,
          authorId: bookResult.author_id,
          author_id: bookResult.author_id,
          sku: bookResult.sku,
          title: bookResult.title,
          status: bookResult.status,
          coverUrl: bookResult.cover_url,
          cover: bookResult.cover_url,
          cover_url: bookResult.cover_url,
          bannerUrl: bookResult.banner_url,
          synopsis: bookResult.synopsis,
          bookType: bookResult.book_type,
          universeRequests: bookResult.universe_requests || [],
          coAuthorIds: bookResult.co_author_ids || [],
          loreAreas: bookResult.lore_areas || [],
          genres: bookResult.genres || [],
          premise: bookResult.premise,
          ageRating: bookResult.age_rating,
          ideas: bookResult.ideas || [],
          escaleta: bookResult.escaleta || [],
          universe: bookResult.universe || {},
          ideaLegends: bookResult.idea_legends || {},
          escaletaMode: bookResult.escaleta_mode,
          escaletaGroups: bookResult.escaleta_groups || [],
          trash: bookResult.trash || [],
          ratings: bookResult.ratings || [],
          releaseMode: bookResult.release_model,
          typesettingSettings: bookResult.typesetting_settings || {}
        }] : []
      });
    }
    if (currentUser) loadUniverseData();
  }, [currentUser, bookId]);

  const db = localData;

  const onUpdateData = async (newDb) => {
    setLocalData(newDb);
    const b = newDb.books[0];
    if (b && currentUser && (b.authorId === currentUser.id || currentUser.role === 'curator')) {
      try {
        const { error } = await supabase.from('books').update({
          title: b.title,
          status: b.status,
          cover_url: b.cover || b.cover_url || b.coverUrl || '',
          banner_url: b.bannerUrl || b.banner_url || '',
          synopsis: b.synopsis,
          book_type: b.book_type || b.bookType || 'complete',
          universe_requests: b.universeRequests || b.universe_requests || [],
          co_author_ids: b.coAuthorIds || b.co_author_ids || [],
          lore_areas: b.loreAreas || b.lore_areas || [],
          genres: b.genres || [],
          premise: b.premise || '',
          age_rating: b.ageRating || b.age_rating || 'L',
          ideas: b.ideas || [],
          escaleta: b.escaleta || [],
          universe: b.universe || {},
          idea_legends: b.ideaLegends || b.idea_legends || {},
          escaleta_mode: b.escaletaMode || b.escaleta_mode || 'flat',
          escaleta_groups: b.escaletaGroups || b.escaleta_groups || [],
          trash: b.trash || [],
          ratings: b.ratings || [],
          release_model: b.releaseMode || b.release_model || 'free',
          typesetting_settings: b.typesettingSettings || b.typesetting_settings || {}
        }).eq('id', b.id);
        if (error) throw error;
      } catch (err) {
        console.error("Error updating book data to Supabase:", err);
      }
    }
  };

  const [activeTab, setActiveTab] = useState(initialTab || 'home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const handleCloseDetail = useHashHistory(!!selectedItem, 'dossie', () => setSelectedItem(null));
  const handleCloseReader = useHashHistory(activeTab === 'reader', 'leitura', () => setActiveTab('home'));
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const handleCloseAuthor = useHashHistory(!!selectedAuthor, 'autor', () => setSelectedAuthor(null));
  const [lightboxImage, setLightboxImage] = useState(null);
  const handleCloseLightbox = useHashHistory(!!lightboxImage, 'imagem', () => setLightboxImage(null));
  
  const [showUniverseRequestModal, setShowUniverseRequestModal] = useState(false);
  const [universeRequestData, setUniverseRequestData] = useState({
    message: '',
    requestedFeatures: []
  });

  const bookIndex = db && db.books ? db.books.findIndex(b => b.id === bookId) : -1;
  const currentBook = db && db.books && bookIndex !== -1 ? db.books[bookIndex] : null;
  const universe = currentBook?.universe || {};
  const visibility = currentBook?.universeVisibility || {};
 
  const isAuthorOrCurator = currentUser?.role === 'curator' || currentBook?.authorId === currentUser?.id;
  const filterDrafts = (arr) => arr.filter(item => isAuthorOrCurator || item.status !== 'draft');
 
  // Determinar se existem itens publicados nas abas do Universo
  const hasPublishedCharacters = filterDrafts(universe.characters || []).length > 0;
  const hasPublishedLocations = filterDrafts(universe.locations || []).length > 0;
  const hasPublishedOrganizations = filterDrafts(universe.organizations || []).length > 0;
  const hasPublishedClues = filterDrafts(universe.clues || []).length > 0;
 
  // Uma aba é visível se o autor não a desativou explicitamente E (possui itens OU usuário é o autor/curador)
  const isTabVisible = (key, hasPublished) => {
    const authorEnabled = visibility[key] !== false; // Se undefined, padrão é true
    return authorEnabled && (hasPublished || isAuthorOrCurator);
  };
 
  const showHome = visibility.home !== false;
  const showCharacters = isTabVisible('characters', hasPublishedCharacters);
  const showLocations = isTabVisible('locations', hasPublishedLocations);
  const showOrganizations = isTabVisible('organizations', hasPublishedOrganizations);
  const showClues = isTabVisible('clues', hasPublishedClues);
 
  useEffect(() => {
    let defaultTab = 'home';
    if (!showHome) {
      if (showCharacters) defaultTab = 'characters';
      else if (showLocations) defaultTab = 'locations';
      else if (showOrganizations) defaultTab = 'organizations';
      else if (showClues) defaultTab = 'clues';
    }
    setActiveTab(initialTab || defaultTab);
  }, [bookId, initialTab, showHome, showCharacters, showLocations, showOrganizations, showClues]);

  if (localData && (!currentBook || !db.books || db.books.length === 0)) {
    return (
      <div style={{ color: 'white', padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)', gap: '1.5rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>Universo Não Encontrado</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>Não foi possível carregar as informações deste livro. Ele pode ter sido excluído ou estar indisponível.</p>
        <button onClick={onLeave} className="btn-primary" style={{ padding: '0.8rem 2rem', marginTop: '1rem' }}>Voltar ao Painel</button>
      </div>
    );
  }

  if (!db || !db.books || !currentBook) {
    return (
      <div style={{ color: 'white', padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <p style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>Carregando universo...</p>
      </div>
    );
  }

  const handleUpdateUniverse = (newUniverse) => {
    const newDb = { ...db };
    newDb.books[bookIndex].universe = newUniverse;
    onUpdateData(newDb);
  };

  const handleUpdateBook = (newBookProps) => {
    const newDb = { ...db };
    
    // Normalize cover fields
    if (newBookProps.cover) {
      newBookProps.coverUrl = newBookProps.cover;
      newBookProps.cover_url = newBookProps.cover;
    } else if (newBookProps.coverUrl) {
      newBookProps.cover = newBookProps.coverUrl;
      newBookProps.cover_url = newBookProps.coverUrl;
    } else if (newBookProps.cover_url) {
      newBookProps.cover = newBookProps.cover_url;
      newBookProps.coverUrl = newBookProps.cover_url;
    }

    // Normalize author fields
    if (newBookProps.authorId) {
      newBookProps.author_id = newBookProps.authorId;
    } else if (newBookProps.author_id) {
      newBookProps.authorId = newBookProps.author_id;
    }

    // Normalize book type fields
    if (newBookProps.bookType) {
      newBookProps.book_type = newBookProps.bookType;
    } else if (newBookProps.book_type) {
      newBookProps.bookType = newBookProps.book_type;
    }

    // Auto-publish logic when book is published by the author
    if (newBookProps.status === 'published' && currentBook.status !== 'published') {
      const book = newDb.books[bookIndex];
      const releaseMode = book.releaseMode || book.release_model || 'all';
      const intervalDays = parseInt(book.releaseIntervalDays) || 2;
      const targetWeekday = book.releaseWeekday !== undefined ? parseInt(book.releaseWeekday) : 1;
      
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
            chDate = new Date(today);
          }
          const shouldPublishNow = chDate <= today;
          return {
            ...ch,
            publishDate: formatDate(chDate),
            status: shouldPublishNow ? 'published' : (ch.status || 'draft'),
            publishedAt: shouldPublishNow ? new Date().toISOString() : ch.publishedAt
          };
        });
      }

      const universeKeys = ['characters', 'locations', 'organizations', 'events', 'clues'];
      universeKeys.forEach(key => {
        if (book.universe && book.universe[key]) {
          book.universe[key] = book.universe[key].map(item => ({
            ...item,
            status: 'published'
          }));
        }
      });
      
      newBookProps.universe = book.universe;
    }

    newDb.books[bookIndex] = { ...currentBook, ...newBookProps };
    onUpdateData(newDb);
  };

  const handleRequestNoteAccess = (noteId) => {
    const newDb = { ...db };
    if (!newDb.noteRequests) newDb.noteRequests = [];
    
    // Verifica se já existe um pedido
    const exists = newDb.noteRequests.find(r => r.noteId === noteId && r.userId === currentUser.id && r.bookId === bookId);
    if (!exists) {
      newDb.noteRequests.push({
        id: Date.now().toString(),
        noteId,
        userId: currentUser.id,
        userName: (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)) || currentUser.nickname,
        bookId,
        bookTitle: currentBook.title,
        itemId: selectedItem.id,
        itemType: selectedItem.type,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      onUpdateData(newDb);
      toast('Solicitação de acesso enviada ao autor com sucesso!');
    } else {
      if (exists.status === 'pending') {
        toast('Você já possui uma solicitação pendente para esta nota.');
      } else if (exists.status === 'rejected') {
        exists.status = 'pending';
        exists.retryCount = (exists.retryCount || 0) + 1;
        exists.createdAt = new Date().toISOString();
        onUpdateData(newDb);
        toast('Sua solicitação foi reenviada ao autor!');
      }
    }
  };

  const handleLogChange = (action, details, type = 'log', extraData = {}) => {
    const newDb = { ...db };
    if (!newDb.notifications) newDb.notifications = [];
    newDb.notifications.push({
      id: 'notif_' + Date.now() + Math.floor(Math.random() * 1000),
      type: type, 
      bookId: bookId,
      bookTitle: currentBook.title,
      authorId: currentUser.id,
      authorName: (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)),
      action: action,
      details: details,
      date: new Date().toLocaleString('pt-BR'),
      read: false,
      ...extraData
    });

    // Se quem está editando for um curador, registrar também no histórico de auditoria
    if (currentUser.role === 'curator') {
      if (!newDb.auditLogs) newDb.auditLogs = [];
      newDb.auditLogs.push({
        id: 'audit_' + Date.now() + Math.floor(Math.random() * 1000),
        curatorId: currentUser.id,
        curatorName: (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)),
        action: `CMS: ${action}`,
        details: `No livro "${currentBook.title}": ${details}`,
        date: new Date().toLocaleString('pt-BR')
      });
    }

    // Optimistic UI update and server save
    onUpdateData(newDb);
  };

  const handleSubmitUniverseRequest = () => {
    if (universeRequestData.requestedFeatures.length === 0) {
      toast('Selecione pelo menos uma área do universo que deseja que o autor adicione.');
      return;
    }
    
    const newDb = { ...db };
    if (!newDb.books[bookIndex].universeRequests) {
      newDb.books[bookIndex].universeRequests = [];
    }
    
    newDb.books[bookIndex].universeRequests.push({
      id: 'req_' + Date.now(),
      userId: currentUser?.id,
      userName: currentUser ? ((currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)) || currentUser.nickname) : 'Anônimo',
      requestedFeatures: universeRequestData.requestedFeatures,
      message: universeRequestData.message,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    
    onUpdateData(newDb);
    setShowUniverseRequestModal(false);
    setUniverseRequestData({ message: '', requestedFeatures: [] });
    toast('Sua solicitação foi enviada ao autor com sucesso!');
  };





  const allItems = [...filterDrafts(universe.characters || []), ...filterDrafts(universe.locations || []), ...filterDrafts(universe.clues || []), ...filterDrafts(universe.organizations || [])];
  const allPosts = [...filterDrafts(universe.posts || [])].reverse(); 
  
  const globalGallery = allItems.flatMap(item => item.gallery || []).reverse(); 

  const filteredItems = allItems.filter(item => {
    if (activeTab === 'characters' && item.type !== 'personagem') return false;
    if (activeTab === 'locations' && item.type !== 'local') return false;
    if (activeTab === 'clues' && item.type !== 'pista') return false;
    if (activeTab === 'organizations' && item.type !== 'organizacao') return false;
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             item.role?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getCharacterRank = (tag) => {
    if (!tag) return 1; // Default to Principal
    const normalized = tag.trim().toLowerCase();
    if (normalized.includes('principal')) return 1;
    if (normalized.includes('segundário') || normalized.includes('secundário')) return 2;
    if (normalized.includes('coadjuvante')) return 3;
    if (normalized.includes('figurante')) return 4;
    if (normalized.includes('antagonista')) return 5;
    if (normalized.includes('vilão') || normalized.includes('vilao')) return 6;
    return 7;
  };

  const getSortedItems = (items) => {
    if (activeTab !== 'characters') return items;
    return [...items].sort((a, b) => {
      const rankA = getCharacterRank(a.statusTag);
      const rankB = getCharacterRank(b.statusTag);
      if (rankA !== rankB) return rankA - rankB;
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const sortedFilteredItems = getSortedItems(filteredItems);

  let featuredItem = null;
  let similarItems = sortedFilteredItems;

  if (searchQuery) {
    featuredItem = sortedFilteredItems.length > 0 ? sortedFilteredItems[0] : null;
    similarItems = sortedFilteredItems.filter(item => item.id !== featuredItem?.id);
  } else {
    switch (activeTab) {
      case 'home':
        const bookAuthor = db.users.find(u => u.id === currentBook.authorId);
        featuredItem = {
          title: currentBook.title,
          description: currentBook.synopsis,
          image: currentBook.cover,
          author: bookAuthor ? (bookAuthor.displayMode === 'name' ? bookAuthor.name : (bookAuthor.nickname || bookAuthor.name)) : 'Autor Desconhecido',
          authorObj: bookAuthor
        };
        break;
      case 'characters': {
        const charPage = universe.pages?.characters || { title: "Personagens", author: "Habitantes", category: "Conheça os protagonistas e antagonistas", description: "Explore os perfis, motivações e segredos de cada personagem desta história.", image: "/characters_cover.png" };
        featuredItem = { ...charPage, isSection: true };
        break;
      }
      case 'locations': {
        const locPage = universe.pages?.locations || { title: "Locais e Territórios", author: "Geografia do Mundo", category: "Onde tudo acontece", description: "Navegue pelos cenários da história. Descubra as zonas seguras, os territórios perigosos e os esconderijos.", image: "/locations_cover.png" };
        featuredItem = { ...locPage, isSection: true };
        break;
      }
      case 'organizations': {
        const orgPage = universe.pages?.organizations || { title: "Organizações", author: "Estruturas de Poder", category: "Facções, Comércios e Instituições", description: "Entenda a engrenagem que move este mundo. De pequenos grupos a grandes impérios.", image: "/org_cover.png" };
        featuredItem = { ...orgPage, isSection: true };
        break;
      }
      case 'clues': {
        const cluePage = universe.pages?.clues || { title: "Complementos", author: "Dossiês Complementares", category: "Complementos e Extras", description: "Explore informações, materiais e arquivos complementares que enriquecem o universo da obra.", image: "/clues_cover.png" };
        featuredItem = { ...cluePage, isSection: true };
        break;
      }
      default:
        featuredItem = { title: currentBook.title, description: currentBook.synopsis, image: currentBook.cover };
    }
  }

  const showBookCover = activeTab === 'home' && !searchQuery;


  if (!db || !currentBook) {
    return (
      <SkeletonTheme baseColor="#1a1c20" highlightColor="#2a2d35">
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
          <div style={{ width: '250px', borderRight: '1px solid var(--border-color)', padding: '2rem' }}>
            <Skeleton width="80%" height={24} style={{ marginBottom: '2rem' }} />
            <Skeleton count={8} height={40} style={{ marginBottom: '1rem' }} />
          </div>
          <div style={{ flex: 1, padding: '2rem' }}>
             <Skeleton width={300} height={40} style={{ marginBottom: '2rem' }} />
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <Skeleton height={200} borderRadius={12} />
                <Skeleton height={200} borderRadius={12} />
                <Skeleton height={200} borderRadius={12} />
                <Skeleton height={200} borderRadius={12} />
             </div>
          </div>
        </div>
      </SkeletonTheme>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={onLeave}>
          <ArrowLeft size={24} color="var(--accent-gold)" />
          <span style={{ fontSize: '0.6rem', color: 'var(--accent-gold)' }}>Sair</span>
        </div>
        <div className="nav-links">
          {showHome && (
            <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')} title="Início">
              <Home size={24} />
            </div>
          )}
          {showCharacters && (
            <div className={`nav-item ${activeTab === 'characters' ? 'active' : ''}`} onClick={() => setActiveTab('characters')} title="Personagens">
              <Users size={24} />
            </div>
          )}
          {showLocations && (
            <div className={`nav-item ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => setActiveTab('locations')} title="Locais">
              <Map size={24} />
            </div>
          )}
          {showOrganizations && (
            <div className={`nav-item ${activeTab === 'organizations' ? 'active' : ''}`} onClick={() => setActiveTab('organizations')} title="Organizações">
              <Building size={24} />
            </div>
          )}
          {showClues && (
            <div className={`nav-item ${activeTab === 'clues' ? 'active' : ''}`} onClick={() => setActiveTab('clues')} title="Complementos">
              <Key size={24} />
            </div>
          )}
          {currentUser && (currentUser.role === 'author' || currentUser.role === 'curator') && (
            <div className={`nav-item admin-nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')} title="Painel CMS">
              <Settings size={24} />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${(activeTab === 'reader' || activeTab === 'admin') ? 'no-padding' : ''}`}>
        {activeTab === 'reader' ? (
          <Reader 
            db={db} 
            bookId={currentBook.id} 
            currentUser={currentUser} 
            onUpdateData={onUpdateData} 
            onClose={handleCloseReader} 
          />
        ) : activeTab === 'admin' && (currentUser.role === 'author' || currentUser.role === 'curator') ? (
          <AdminPanel 
            data={universe} 
            onUpdate={handleUpdateUniverse} 
            bookId={bookId} 
            currentBook={currentBook} 
            onUpdateBook={handleUpdateBook} 
            currentUser={currentUser}
            onLogChange={handleLogChange}
            db={db}
            onUpdateData={onUpdateData}
            onLeave={onLeave}
          />
        ) : (
          <>
            <div className="search-container">
              <Search size={20} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Buscar personagens ou locais..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {featuredItem ? (
              <>
                <section className="custom-split-layout">
                  <div className="custom-split-body">
                    <div className="custom-split-text">
                      <div className="custom-split-header">
                        <h1>{featuredItem.title || featuredItem.name}</h1>
                        <div className="subtitle">
                          {featuredItem.authorObj ? (
                            <span 
                              onClick={() => setSelectedAuthor(featuredItem.authorObj)} 
                              style={{ color: 'var(--accent-gold)', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                              {featuredItem.author}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--accent-gold)' }}>
                              {featuredItem.author || featuredItem.role || featuredItem.type}
                            </span>
                          )}
                          {(featuredItem.category || featuredItem.territory || featuredItem.ageRating) ? ` • ${featuredItem.category || featuredItem.territory} ${featuredItem.ageRating ? '• Classificação: ' + featuredItem.ageRating : ''}` : ''}
                        </div>
                      </div>

                      <ExpandableText text={featuredItem.description} />
                    </div>

                    <div className="custom-split-cover" onClick={() => !featuredItem.isSection && !showBookCover && setSelectedItem(featuredItem)}>
                      {featuredItem.image ? (
                        <>
                          <img 
                            src={featuredItem.image} 
                            alt="" 
                            className="featured-cover-blur"
                          />
                          <img src={featuredItem.image} alt={featuredItem.name || featuredItem.title} className="featured-cover" />
                        </>
                      ) : (
                        <div style={{ opacity: 0.2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen size={48} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="custom-split-footer">
                    {showBookCover ? (
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button className="btn-primary" onClick={() => setActiveTab('reader')} style={{ width: 'auto', padding: '0.8rem 1.5rem' }}>
                          <BookOpen size={18} /> LER LIVRO
                        </button>
                        {currentUser && currentUser.id !== currentBook.authorId && currentBook.distributionMode !== 'short_story' && (
                          <button onClick={() => setShowUniverseRequestModal(true)} style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', padding: '0.8rem 1.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                            <Settings size={18} /> PEDIR ADIÇÃO AO UNIVERSO
                          </button>
                        )}
                      </div>
                    ) : featuredItem.isSection ? (
                      <></> // No button for section headers
                    ) : (
                      <button className="btn-primary" onClick={() => setSelectedItem(featuredItem)} style={{ width: 'auto', padding: '0.8rem 1.5rem' }}>
                        <BookOpen size={18} /> VER MAIS
                      </button>
                    )}
                  </div>
                </section>


                {showBookCover ? (
                  <>
                    {/* Explore o Universo */}
                    <section className="list-section" style={{ marginBottom: '4rem' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Map size={18} /> EXPLORAR O UNIVERSO
                      </h3>
                      <div className="cards-grid">
                        {similarItems.map(item => (
                          <div key={item.id} className="item-card" onClick={() => setSelectedItem(item)}>
                            <img src={item.image} alt={item.name} />
                            <h4>{item.name}</h4>
                            <p>{item.role || item.territory || item.type}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Blog Section on Home (Hidden temporarily) */}
                    {false && allPosts.length > 0 && (
                      <section className="list-section" style={{ marginBottom: '4rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BookOpen size={18} /> ÚLTIMAS ATUALIZAÇÕES
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                          {allPosts.map(post => (
                            <div key={post.id} style={{ display: 'flex', gap: '2rem', background: 'var(--card-bg)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              {post.image && (
                                <img src={post.image} alt={post.title} style={{ width: '250px', height: '160px', objectFit: 'cover', borderRadius: '4px' }} />
                              )}
                              <div>
                                <span style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>{post.date}</span>
                                <h2 style={{ margin: '0.5rem 0', color: 'var(--text-main)', fontSize: '1.8rem' }}>{post.title}</h2>
                                <p style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{post.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Global Gallery on Home */}
                    {globalGallery.length > 0 && (
                      <section className="list-section">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ImageIcon size={18} /> GALERIA DE FOTOS
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', paddingBottom: '2rem' }}>
                          {globalGallery.map((img, idx) => (
                            <img 
                              key={idx} 
                              src={img} 
                              style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} 
                              onClick={() => setLightboxImage(img)}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                ) : (
                  <section className="list-section">
                    <h3>{featuredItem?.isSection ? 'EXPLORAR' : 'OUTROS RESULTADOS'}</h3>
                    <div className="cards-grid">
                      {similarItems.map(item => (
                        <div key={item.id} className="item-card" onClick={() => setSelectedItem(item)}>
                          <img src={item.image} alt={item.name} />
                          <h4>{item.name}</h4>
                          <p>{item.role || item.territory || item.type}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                <h2>Nenhum resultado encontrado para "{searchQuery}"</h2>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modais */}
      {selectedItem && (
        <DetailModal 
          item={selectedItem} 
          bookTitle={currentBook?.title} 
          events={universe.events || []} 
          onClose={handleCloseDetail} 
          onRequestAccess={handleRequestNoteAccess}
          db={db}
          currentUser={currentUser}
          onUpdateData={onUpdateData}
        />
      )}
      {/* Author Profile Modal */}
      {selectedAuthor && (
        <AuthorModal author={selectedAuthor} db={db} onClose={handleCloseAuthor} />
      )}

      {/* Universe Request Modal */}
      {showUniverseRequestModal && (
        <div className="modal-overlay" onClick={() => setShowUniverseRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', marginBottom: '1.5rem', marginTop: 0 }}>Pedir Universo Expandido</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Mostre ao autor que você quer explorar mais sobre este mundo! Selecione quais áreas você gostaria que fossem criadas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { id: 'characters', label: 'Dossiês de Personagens' },
                { id: 'locations', label: 'Detalhes de Locais e Territórios' },
                { id: 'organizations', label: 'Organizações e Grupos' },
                { id: 'clues', label: 'Complementos e Objetos' }
              ].map(opt => (
                <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                    checked={universeRequestData.requestedFeatures.includes(opt.id)}
                    onChange={(e) => {
                      const newFeatures = e.target.checked 
                        ? [...universeRequestData.requestedFeatures, opt.id]
                        : universeRequestData.requestedFeatures.filter(f => f !== opt.id);
                      setUniverseRequestData({ ...universeRequestData, requestedFeatures: newFeatures });
                    }}
                  />
                  <span style={{ color: 'var(--text-main)' }}>{opt.label}</span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mensagem para o Autor (Opcional)</label>
              <textarea 
                value={universeRequestData.message}
                onChange={e => setUniverseRequestData({ ...universeRequestData, message: e.target.value })}
                className="form-input"
                placeholder="Ex: Eu adoraria saber mais sobre a história do vilão!"
                rows="3"
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-main)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setShowUniverseRequestModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSubmitUniverseRequest}>Enviar Pedido</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Lightbox */}
      {lightboxImage && (
        <ImageLightbox image={lightboxImage} onClose={handleCloseLightbox} />
      )}
    </div>
  );
}
