import { useState, useEffect } from 'react';
import { Home, Users, Map, Search, BookOpen, Settings, Key, Building, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import ImageLightbox from './ImageLightbox';
import DetailModal from './DetailModal';
import AdminPanel from './AdminPanel';
import Reader from './Reader';
import AuthorModal from './AuthorModal';
import { useHashHistory } from '../hooks/useHashHistory';

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

export default function UniverseView({ db, bookId, currentUser, onUpdateData, initialTab, onLeave }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const handleCloseDetail = useHashHistory(!!selectedItem, 'dossie', () => setSelectedItem(null));
  const handleCloseReader = useHashHistory(activeTab === 'reader', 'leitura', () => setActiveTab('home'));
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const handleCloseAuthor = useHashHistory(!!selectedAuthor, 'autor', () => setSelectedAuthor(null));
  const [lightboxImage, setLightboxImage] = useState(null);
  const handleCloseLightbox = useHashHistory(!!lightboxImage, 'imagem', () => setLightboxImage(null));

  useEffect(() => {
    setActiveTab(initialTab || 'home');
  }, [bookId, initialTab]);

  const bookIndex = db.books.findIndex(b => b.id === bookId);
  const currentBook = db.books[bookIndex];
  const universe = currentBook?.universe || {};

  const handleUpdateUniverse = (newUniverse) => {
    const newDb = { ...db };
    newDb.books[bookIndex].universe = newUniverse;
    onUpdateData(newDb);
  };

  const handleUpdateBook = (newBookProps) => {
    const newDb = { ...db };
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
      alert('Solicitação de acesso enviada ao autor com sucesso!');
    } else {
      if (exists.status === 'pending') {
        alert('Você já possui uma solicitação pendente para esta nota.');
      } else if (exists.status === 'rejected') {
        exists.status = 'pending';
        exists.retryCount = (exists.retryCount || 0) + 1;
        exists.createdAt = new Date().toISOString();
        onUpdateData(newDb);
        alert('Sua solicitação foi reenviada ao autor!');
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

  if (!db || !currentBook) return <div style={{color:'white', padding:'3rem', textAlign:'center'}}>Carregando Universo...</div>;

  const isAuthorOrCurator = currentUser?.role === 'curator' || currentBook?.authorId === currentUser?.id;
  const filterDrafts = (arr) => arr.filter(item => isAuthorOrCurator || item.status !== 'draft');

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

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={onLeave}>
          <ArrowLeft size={24} color="var(--accent-gold)" />
          <span style={{ fontSize: '0.6rem', color: 'var(--accent-gold)' }}>Sair</span>
        </div>
        <div className="nav-links">
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')} title="Início">
            <Home size={24} />
          </div>
          <div className={`nav-item ${activeTab === 'characters' ? 'active' : ''}`} onClick={() => setActiveTab('characters')} title="Personagens">
            <Users size={24} />
          </div>
          <div className={`nav-item ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => setActiveTab('locations')} title="Locais">
            <Map size={24} />
          </div>
          <div className={`nav-item ${activeTab === 'organizations' ? 'active' : ''}`} onClick={() => setActiveTab('organizations')} title="Organizações">
            <Building size={24} />
          </div>
          <div className={`nav-item ${activeTab === 'clues' ? 'active' : ''}`} onClick={() => setActiveTab('clues')} title="Complementos">
            <Key size={24} />
          </div>
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
                      <button className="btn-primary" onClick={() => setActiveTab('reader')} style={{ width: 'auto', padding: '0.8rem 1.5rem' }}>
                        <BookOpen size={18} /> LER LIVRO
                      </button>
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
          events={universe.posts || []} 
          onClose={handleCloseDetail} 
          onRequestAccess={handleRequestNoteAccess}
          db={db}
          currentUser={currentUser}
          onUpdateData={onUpdateData}
        />
      )}
      {selectedAuthor && (
        <AuthorModal author={selectedAuthor} db={db} onClose={handleCloseAuthor} />
      )}
      
      {/* Lightbox */}
      {lightboxImage && (
        <ImageLightbox image={lightboxImage} onClose={handleCloseLightbox} />
      )}
    </div>
  );
}
