import { useState, useEffect, useRef } from 'react';
import { User, BookOpen, Plus, Search, Trash2, Palette, BarChart2, Users, Activity, TrendingUp, ChevronDown, ChevronUp, Star, X, MessageSquare, Send, Mail, MailOpen, Inbox, CheckCircle, XCircle, Key, RefreshCw, ThumbsUp, ThumbsDown, Menu, UploadCloud, FileText, Image } from 'lucide-react';
import BookIdeasBoard from './BookIdeasBoard';
import mammoth from 'mammoth/mammoth.browser.js';
import HQModal from './HQModal';

const COLORS = [
  { hex: '#FFE082', name: 'Amarelo' },
  { hex: '#90CAF9', name: 'Azul' },
  { hex: '#A5D6A7', name: 'Verde' },
  { hex: '#F48FB1', name: 'Rosa' },
  { hex: '#CE93D8', name: 'Roxo' },
  { hex: '#FFCC80', name: 'Laranja' }
];

const DEFAULT_LEGENDS = {
  '#FFE082': 'Ideia Geral',
  '#90CAF9': 'Enredo / Plot',
  '#A5D6A7': 'Personagem',
  '#F48FB1': 'Cena / Diálogo',
  '#CE93D8': 'Worldbuilding',
  '#FFCC80': 'Outros'
};

export default function AuthorDashboard({ db, onUpdateData, currentUser, onSelectBook, onOpenNewBook, forceUserId, onCloseForceView, activeTab: propActiveTab, onTabChange, focusAuthorId, setFocusAuthorId, isSidebarOpen, setIsSidebarOpen }) {
  const [localActiveTab, setLocalActiveTab] = useState('dashboard');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;

  // Manuscrito import modals
  const [showCreationChoice, setShowCreationChoice] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHqModal, setShowHqModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [selectedIdeaBookId, setSelectedIdeaBookId] = useState(null);
  const [noteRequestTab, setNoteRequestTab] = useState('pending');
  const [universeRequestTab, setUniverseRequestTab] = useState('unread');
  const [selectedUniverseRequest, setSelectedUniverseRequest] = useState(null);
  
  // Filtros de Livros
  const [searchText, setSearchText] = useState('');
  const [letterFilter, setLetterFilter] = useState('');

  // Estados do Suporte Técnico / Inbox
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ category: 'technical', subject: '', message: '' });
  const [replyText, setReplyText] = useState('');

  // Se a curadoria está visualizando um autor específico
  const effectiveUserId = forceUserId || currentUser.id;
  const effectiveUser = db.users.find(u => u.id === effectiveUserId) || currentUser;

  const authorBooks = db.books.filter(b => b.authorId === effectiveUserId || b.coAuthorId === effectiveUserId);

  // Carregar dados de Ideias e Legendas do perfil do usuário ativo
  const ideas = effectiveUser.ideas || [];
  const ideaLegends = { ...DEFAULT_LEGENDS, ...(effectiveUser.ideaLegends || {}) };

  const handleUpdateUserField = (field, value) => {
    const updatedUser = {
      ...effectiveUser,
      [field]: value
    };

    const newDb = { ...db };
    newDb.users = newDb.users.map(u => u.id === effectiveUserId ? updatedUser : u);
    onUpdateData(newDb);
  };

  // Ideias: Adicionar
  const handleAddIdea = () => {
    const newIdea = {
      id: 'idea_' + Date.now() + Math.floor(Math.random() * 1000),
      title: '',
      text: '',
      color: '#FFE082' // Default to yellow
    };
    const updatedIdeas = [...ideas, newIdea];
    handleUpdateUserField('ideas', updatedIdeas);
  };

  // Ideias: Atualizar Título
  const handleUpdateIdeaTitle = (id, newTitle) => {
    const updatedIdeas = ideas.map(idea => idea.id === id ? { ...idea, title: newTitle } : idea);
    handleUpdateUserField('ideas', updatedIdeas);
  };

  // Ideias: Atualizar Texto
  const handleUpdateIdeaText = (id, newText) => {
    const updatedIdeas = ideas.map(idea => idea.id === id ? { ...idea, text: newText } : idea);
    handleUpdateUserField('ideas', updatedIdeas);
  };

  // Ideias: Mudar Cor
  const handleUpdateIdeaColor = (id, colorHex) => {
    const updatedIdeas = ideas.map(idea => idea.id === id ? { ...idea, color: colorHex } : idea);
    handleUpdateUserField('ideas', updatedIdeas);
  };

  // Ideias: Excluir
  const handleDeleteIdea = (id) => {
    const updatedIdeas = ideas.filter(idea => idea.id !== id);
    handleUpdateUserField('ideas', updatedIdeas);
  };

  // Legendas: Atualizar
  const handleUpdateLegend = (colorHex, text) => {
    const updatedLegends = {
      ...ideaLegends,
      [colorHex]: text
    };
    handleUpdateUserField('ideaLegends', updatedLegends);
  };

  // Filtros de Livros (Grid)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const filteredBooks = authorBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesLetter = letterFilter ? book.title.toUpperCase().startsWith(letterFilter) : true;
    return matchesSearch && matchesLetter;
  });

  // Estilo dos botões da sidebar
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

  // Renderizadores de Sub-abas
  const renderDashboard = () => {
    const publishedCount = authorBooks.filter(b => b.status === 'published').length;
    const pendingCount = authorBooks.filter(b => b.status === 'pending').length;
    const draftCount = authorBooks.filter(b => b.status === 'draft').length;
    
    // Leitura real dos dados (usando book.views se existir, senão 0)
    const estimatedReads = authorBooks.reduce((acc, curr) => {
      return acc + (curr.views || 0);
    }, 0);

    // Cálculo da média de avaliação global do autor
    const allPublishedBooks = authorBooks.filter(b => b.status === 'published');
    const totalRatingsCount = allPublishedBooks.reduce((acc, curr) => acc + (curr.ratings || []).length, 0);
    const totalStars = allPublishedBooks.reduce((acc, curr) => acc + (curr.ratings || []).reduce((sum, r) => sum + r.stars, 0), 0);
    const globalAverageRating = totalRatingsCount > 0 ? (totalStars / totalRatingsCount).toFixed(1) : '0.0';

    // Cálculo total de curtidas nas notas do autor
    let totalNoteLikes = 0;
    const feedbackList = db.noteFeedback || [];
    authorBooks.forEach(book => {
      if (!book.universe) return;
      const types = ['characters', 'locations', 'organizations', 'items'];
      types.forEach(t => {
        if (book.universe[t]) {
          book.universe[t].forEach(item => {
            if (item.authorNotes) {
              item.authorNotes.forEach(note => {
                totalNoteLikes += feedbackList.filter(f => f.noteId === note.id && f.type === 'like').length;
              });
            }
          });
        }
      });
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: '0 0 0 1rem' }}>Estúdio Analytics</h2>
        
        {/* Metricas Grid */}
        <div className="analytics-grid">
          <div className="metric-card">
            <div className="metric-card-title">
              <BookOpen size={18} /> Projetos Totais
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{publishedCount} Publicados | {draftCount} Rascunhos</span>
          </div>

          <div className="metric-card">
            <div className="metric-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#4CAF50', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <Users size={18} /> Leituras Acumuladas
            </div>
            <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', color: 'var(--text-main)' }}>{estimatedReads.toLocaleString()}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Somatório estimado de leitores</span>
          </div>

          <div className="metric-card">
            <div className="metric-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#2196F3', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <Star size={18} /> Avaliação Média
            </div>
            <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', color: 'var(--text-main)' }}>{globalAverageRating}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Baseado em {totalRatingsCount} reviews</span>
          </div>

          <div className="metric-card">
            <div className="metric-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#FF9800', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <ThumbsUp size={18} /> Relevância de Notas
            </div>
            <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', color: 'var(--text-main)' }}>{totalNoteLikes}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curtidas totais em notas no dossiê</span>
          </div>

          <div className="metric-card">
            <div className="metric-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-gold)', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <TrendingUp size={18} /> Status de Obras
            </div>
            <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', color: 'var(--text-main)' }}>{pendingCount}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aguardando Aprovação da Curadoria</span>
          </div>

          <div className="metric-card">
            <div className="metric-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-gold)', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <Star size={18} fill="var(--accent-gold)" color="var(--accent-gold)" /> Avaliação Média
            </div>
            <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', color: 'var(--text-main)' }}>⭐ {globalAverageRating}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{totalRatingsCount} {totalRatingsCount === 1 ? 'avaliação total' : 'avaliações totais'}</span>
          </div>
        </div>

        <div className="acessos-container">
          <h3 style={{ color: 'var(--accent-gold)', margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontFamily: "'Playfair Display', serif" }}>Acessos por Livro</h3>
          {authorBooks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Nenhuma obra para analisar.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {authorBooks.map((book) => {
                const views = book.views || 0;
                const maxViews = Math.max(...authorBooks.map(b => b.views || 0), 10);
                const percent = (views / maxViews) * 100;
                const ratings = book.ratings || [];
                const count = ratings.length;
                const avg = count > 0 ? (ratings.reduce((sum, r) => sum + r.stars, 0) / count).toFixed(1) : '0.0';

                return (
                  <div key={book.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <strong>{book.title}</strong>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{views.toLocaleString()} leitores</span>
                        {book.status === 'published' && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>⭐ {avg} ({count})</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: 'var(--accent-gold)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBooks = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Minhas Histórias</h2>
            <button className="btn-primary" onClick={() => setShowCreationChoice(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
              <Plus size={16} /> <span style={{ fontSize: '0.9rem' }}>NOVA HISTÓRIA</span>
            </button>
          </div>
          
          <input 
            type="text" 
            placeholder="Pesquisar por título..." 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ padding: '0.8rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', width: '100%' }}
          />
        </div>

        {/* Filtro por Letra A-Z */}
        <div className="mobile-horizontal-scroll" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '0.2rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', scrollbarWidth: 'none' }}>
          <button 
            onClick={() => setLetterFilter('')} 
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: letterFilter === '' ? 'var(--accent-gold)' : 'transparent', color: letterFilter === '' ? '#000' : 'var(--text-main)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Todos
          </button>
          {alphabet.map(letter => (
            <button 
              key={letter}
              onClick={() => setLetterFilter(letter)} 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: letterFilter === letter ? 'var(--accent-gold)' : 'transparent', color: letterFilter === letter ? '#000' : 'var(--text-main)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Grid de Livros */}
        <div className="author-books-grid">
          {filteredBooks.map(book => {
            const ratings = book.ratings || [];
            const count = ratings.length;
            const avg = count > 0 
              ? (ratings.reduce((sum, r) => sum + r.stars, 0) / count).toFixed(1)
              : '0.0';
            
            return (
              <div 
                key={book.id} 
                onClick={() => onSelectBook(book.id)} 
                style={{ 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ aspectRatio: '2/3', width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
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
                    <BookOpen size={48} color="rgba(255,255,255,0.1)" />
                  )}
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.2rem 0', color: 'var(--accent-gold)', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</h3>
                  {book.sku && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px', display: 'inline-block' }}>
                      SKU: {book.sku}
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: '0.8rem', color: book.status === 'published' ? '#4CAF50' : book.status === 'pending' ? '#ff9800' : 'var(--text-muted)' }}>
                    Status: {book.status.toUpperCase()}
                  </p>
                  
                  {/* Avaliação Estrelas no Card */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>⭐ {avg}</span>
                    <span style={{ color: 'var(--text-muted)' }}>({count})</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBooks.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhuma obra encontrada com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderIdeas = () => {
    const sortedBooks = [...authorBooks].sort((a, b) => a.title.localeCompare(b.title));
    const activeBookForIdeas = sortedBooks.find(b => b.id === selectedIdeaBookId) || sortedBooks[0];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh', gap: '0' }}>
        {/* Header Section with Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem 1.5rem 1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontFamily: "'Playfair Display', serif" }}>Minhas Histórias:</h3>
          {sortedBooks.length > 0 ? (
            <select
              value={selectedIdeaBookId || activeBookForIdeas?.id || ''}
              onChange={(e) => setSelectedIdeaBookId(e.target.value)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                color: 'var(--accent-gold)',
                fontSize: '1rem',
                minWidth: '250px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            >
              {sortedBooks.map(book => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum livro publicado.</span>
          )}
        </div>

        {/* Board Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          {activeBookForIdeas ? (
            <div style={{ width: '100%' }}>
              <BookIdeasBoard 
                book={activeBookForIdeas} 
                onUpdateBook={(updatedBook) => {
                  const newDb = { ...db, books: db.books.map(b => b.id === updatedBook.id ? updatedBook : b) };
                  onUpdateData(newDb);
                }} 
              />
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
              Crie um livro para começar a ter ideias.
            </div>
          )}
        </div>
      </div>
    );
  };
  

  const handleUpdateInboxRequestStatus = (reqId, newStatus, isNote) => {
    const newDb = { ...db };
    let found = false;

    if (isNote) {
      const req = (newDb.noteRequests || []).find(r => r.id === reqId);
      if (req) {
        req.status = newStatus;
        if (newStatus !== 'unread' && newStatus !== 'pending') {
          req.read = true;
        } else {
          req.read = false;
          req.status = 'pending';
        }
        found = true;
      }
    } else {
      for (let book of newDb.books) {
        if (book.universeRequests) {
          const req = book.universeRequests.find(r => r.id === reqId);
          if (req) {
            req.status = newStatus;
            if (newStatus !== 'unread' && newStatus !== 'pending') {
              req.read = true;
            } else {
              req.read = false;
              req.status = 'pending';
            }
            found = true;
            break;
          }
        }
      }
    }

    if (found) {
      onUpdateData(newDb);
      if (selectedUniverseRequest && selectedUniverseRequest.id === reqId) {
        setSelectedUniverseRequest(null);
      }
    }
  };

  const markInboxRequestAsRead = (reqId, isNote) => {
    const newDb = { ...db };
    let found = false;

    if (isNote) {
      const req = (newDb.noteRequests || []).find(r => r.id === reqId);
      if (req && !req.read) {
        req.read = true;
        found = true;
      }
    } else {
      for (let book of newDb.books) {
        if (book.universeRequests) {
          const req = book.universeRequests.find(r => r.id === reqId);
          if (req && !req.read) {
            req.read = true;
            found = true;
            break;
          }
        }
      }
    }

    if (found) {
      onUpdateData(newDb);
    }
  };

  const renderUniverseRequests = () => {
    const myBooks = db.books.filter(b => b.authorId === effectiveUser.id).map(b => b.id);
    
    const universeReqs = db.books
      .filter(b => b.authorId === effectiveUser.id)
      .flatMap(b => (b.universeRequests || []).map(req => ({ 
        ...req, 
        bookTitle: b.title, 
        bookId: b.id,
        inboxType: 'universe'
      })));

    const noteReqs = (db.noteRequests || [])
      .filter(r => myBooks.includes(r.bookId))
      .map(req => {
        let noteTitle = 'Nota Secreta';
        let noteContent = '';
        const book = db.books.find(b => b.id === req.bookId);
        if (book?.universe) {
          const types = ['characters', 'locations', 'organizations', 'items', 'clues'];
          for (const t of types) {
            if (book.universe[t]) {
              const item = book.universe[t].find(i => i.id === req.itemId);
              if (item && item.authorNotes) {
                const note = item.authorNotes.find(n => n.id === req.noteId);
                if (note) {
                  noteTitle = note.title || 'Nota Sem Título';
                  noteContent = note.content || '';
                }
              }
            }
          }
        }
        return {
          ...req,
          inboxType: 'note',
          noteTitle,
          noteContent,
          timestamp: req.createdAt,
          read: req.read !== undefined ? req.read : (req.status !== 'pending')
        };
      });

    const allRequests = [...universeReqs, ...noteReqs]
      .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0));

    const unreadCount = allRequests.filter(r => !r.read).length;
    
    let filteredRequests = allRequests;
    if (universeRequestTab === 'unread') {
      filteredRequests = allRequests.filter(r => !r.read);
    } else if (universeRequestTab === 'read') {
      filteredRequests = allRequests.filter(r => r.read);
    }

    if (universeRequestTab === 'metrics') {
      return (
        <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
          <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={24} /> Métricas de Notas
          </h2>
          <div className="mobile-horizontal-scroll" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            <button onClick={() => setUniverseRequestTab('unread')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>Voltar para Inbox</button>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ThumbsUp size={20} color="var(--accent-gold)" /> Notas Mais Avaliadas
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {(() => {
                const authorNotes = [];
                const feedbackList = db.noteFeedback || [];
                
                db.books.filter(b => b.authorId === effectiveUser.id).forEach(book => {
                  if (!book.universe) return;
                  const types = ['characters', 'locations', 'organizations', 'items', 'clues'];
                  types.forEach(t => {
                    if (book.universe[t]) {
                      book.universe[t].forEach(item => {
                        if (item.authorNotes) {
                          item.authorNotes.forEach(note => {
                            const likes = feedbackList.filter(f => f.noteId === note.id && f.type === 'like').length;
                            const dislikes = feedbackList.filter(f => f.noteId === note.id && f.type === 'dislike').length;
                            if (likes > 0 || dislikes > 0) {
                              authorNotes.push({
                                ...note,
                                bookTitle: book.title,
                                itemType: t,
                                itemName: item.name || item.title,
                                likes,
                                dislikes
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                });
                
                authorNotes.sort((a, b) => b.likes - a.likes);
                
                if (authorNotes.length === 0) {
                  return <p style={{ color: 'var(--text-muted)' }}>Suas notas ainda não receberam avaliações.</p>;
                }
                
                return authorNotes.map((note, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: note.isSecret ? '#ff7777' : 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {note.isSecret ? 'NOTA SECRETA' : 'NOTA PÚBLICA'}
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>{note.title || 'Sem Título'}</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Em: {note.itemName} ({note.bookTitle})
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4CAF50', fontWeight: 'bold' }}>
                        <ThumbsUp size={16} /> {note.likes}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f44336', fontWeight: 'bold' }}>
                        <ThumbsDown size={16} /> {note.dislikes}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
        <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Inbox size={24} /> Caixa de Entrada Universal
        </h2>
        
        <div className="mobile-horizontal-scroll" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <button 
            onClick={() => setUniverseRequestTab('unread')}
            style={{ background: 'none', border: 'none', color: universeRequestTab === 'unread' ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: universeRequestTab === 'unread' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Não Lidos {unreadCount > 0 && <span style={{ background: '#f44336', color: 'white', borderRadius: '12px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{unreadCount}</span>}
          </button>
          <button 
            onClick={() => setUniverseRequestTab('read')}
            style={{ background: 'none', border: 'none', color: universeRequestTab === 'read' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: universeRequestTab === 'read' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
            Lidos / Classificados
          </button>
          <button 
            onClick={() => setUniverseRequestTab('all')}
            style={{ background: 'none', border: 'none', color: universeRequestTab === 'all' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: universeRequestTab === 'all' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
            Todos
          </button>
          <button 
            onClick={() => setUniverseRequestTab('metrics')}
            style={{ background: 'none', border: 'none', color: universeRequestTab === 'metrics' ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: universeRequestTab === 'metrics' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem', marginLeft: 'auto' }}>
            <Activity size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.3rem' }} />
            Métricas de Notas
          </button>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          {filteredRequests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MailOpen size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p>Nenhum pedido encontrado nesta pasta.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredRequests.map(req => {
                const isUnread = !req.read;
                let statusColor = 'var(--text-muted)';
                let statusLabel = '';
                
                if (req.inboxType === 'universe') {
                  statusColor = req.status === 'relevant' ? '#4CAF50' : req.status === 'interesting' ? '#2196F3' : req.status === 'disposable' ? '#f44336' : 'var(--text-muted)';
                  statusLabel = req.status === 'relevant' ? 'Relevante' : req.status === 'interesting' ? 'Interessante' : req.status === 'disposable' ? 'Descartável' : '';
                } else {
                  statusColor = req.status === 'approved' ? '#4CAF50' : req.status === 'rejected' ? '#f44336' : 'var(--text-muted)';
                  statusLabel = req.status === 'approved' ? 'Aprovado' : req.status === 'rejected' ? 'Recusado' : '';
                }

                return (
                  <div 
                    key={req.id} 
                    onClick={() => {
                      setSelectedUniverseRequest(req);
                      if (isUnread) markInboxRequestAsRead(req.id, req.inboxType === 'note');
                    }}
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '40px 150px 150px 1fr 100px 100px', 
                      gap: '1rem', 
                      padding: '1rem 1.5rem', 
                      borderBottom: '1px solid var(--border-color)', 
                      background: isUnread ? 'rgba(255,255,255,0.03)' : 'transparent',
                      cursor: 'pointer',
                      alignItems: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.background = isUnread ? 'rgba(255,255,255,0.03)' : 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isUnread ? (
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2196F3' }}></div>
                      ) : (
                        <MailOpen size={16} color="var(--text-muted)" />
                      )}
                    </div>
                    <div style={{ fontWeight: isUnread ? 'bold' : 'normal', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.bookTitle}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: req.inboxType === 'note' ? '#ff9800' : 'var(--accent-gold)' }}>
                      {req.inboxType === 'note' ? 'Acesso à Nota' : 'Expansão de Universo'}
                    </div>
                    <div style={{ color: isUnread ? 'var(--text-main)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}>[{req.userName}]</span> 
                      {req.inboxType === 'note' ? `Acesso à nota: ${req.noteTitle}` : (req.message || '(Sem mensagem - Apenas categorias)')}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {statusLabel && <span style={{ color: statusColor, fontSize: '0.75rem', border: `1px solid ${statusColor}`, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{statusLabel}</span>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {new Date(req.timestamp || req.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSuporte = () => {
    const tickets = (db.supportTickets || []).filter(t => t.authorId === currentUser.id);
    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    const handleCreateTicket = () => {
      if (!newTicket.subject.trim() || !newTicket.message.trim()) {
        alert("Por favor, preencha todos os campos.");
        return;
      }

      const newTicketObj = {
        id: 'ticket_' + Date.now() + Math.floor(Math.random() * 1000),
        authorId: currentUser.id,
        authorName: (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)),
        category: newTicket.category,
        subject: newTicket.subject,
        message: newTicket.message,
        status: 'open',
        createdAt: new Date().toLocaleString('pt-BR'),
        replies: []
      };

      const newDb = {
        ...db,
        supportTickets: [...(db.supportTickets || []), newTicketObj]
      };

      onUpdateData(newDb);
      setNewTicket({ category: 'technical', subject: '', message: '' });
      setShowNewTicketModal(false);
      setSelectedTicketId(newTicketObj.id);
      alert("Chamado de suporte aberto com sucesso!");
    };

    const handleSendReply = () => {
      if (!replyText.trim()) return;

      const newReply = {
        id: 'reply_' + Date.now() + Math.floor(Math.random() * 1000),
        senderId: currentUser.id,
        senderName: (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)),
        message: replyText,
        createdAt: new Date().toLocaleString('pt-BR')
      };

      const updatedTickets = (db.supportTickets || []).map(t => {
        if (t.id === selectedTicket.id) {
          return {
            ...t,
            replies: [...(t.replies || []), newReply]
          };
        }
        return t;
      });

      let updatedReports = db.reports;
      if (selectedTicket.linkedReportId) {
        updatedReports = (db.reports || []).map(r => {
          if (r.id === selectedTicket.linkedReportId) {
            return {
              ...r,
              comments: [...(r.comments || []), {
                id: Date.now().toString(),
                text: replyText,
                authorName: 'Autor (via Suporte)',
                date: new Date().toISOString(),
                isPublicToAuthor: true
              }]
            };
          }
          return r;
        });
      }

      const newDb = {
        ...db,
        supportTickets: updatedTickets,
        reports: updatedReports
      };

      onUpdateData(newDb);
      setReplyText('');
    };

    const getCategoryDetails = (cat) => {
      const cats = {
        technical: { label: '🛠️ Suporte Técnico', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)' },
        curator: { label: '📖 Curadoria / Obras', color: 'var(--accent-gold)', bg: 'rgba(212, 175, 55, 0.1)' },
        financial: { label: '💰 Financeiro', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' },
        other: { label: '❓ Outros Assuntos', color: '#9e9e9e', bg: 'rgba(158, 158, 158, 0.1)' }
      };
      return cats[cat] || cats.other;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Suporte e Caixa de Entrada</h2>
          <button className="btn-primary" onClick={() => setShowNewTicketModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Novo Chamado
          </button>
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
            ✉️ Canal Direto com a Curadoria e Suporte
          </div>
          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Para que serve:</strong> Entrar em contato com o suporte técnico para dúvidas sobre o sistema, com a curadoria para sugestões de obras, ou com o setor financeiro.</p>
          <p style={{ margin: 0 }}><strong>Como funciona:</strong> Crie um novo chamado abaixo. A equipe correspondente receberá sua mensagem no painel deles e responderá diretamente aqui. Você receberá notificações no ícone do Sininho no cabeçalho quando houver novidades.</p>
        </div>

        <div className="mobile-flex-col" style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '500px' }}>
          {/* List of tickets */}
          <div style={{ width: '320px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-main)' }}>Seus Chamados</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {tickets.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Nenhum chamado aberto.</div>
              ) : (
                tickets.slice().reverse().map(t => {
                  const cat = getCategoryDetails(t.category);
                  const isSelected = t.id === selectedTicketId;
                  return (
                    <div 
                      key={t.id}
                      onClick={() => {
                        setSelectedTicketId(t.id);
                        if (t.hasUnreadCuratorMessage) {
                          const newDb = { ...db, supportTickets: db.supportTickets.map(st => st.id === t.id ? {...st, hasUnreadCuratorMessage: false} : st) };
                          onUpdateData(newDb);
                        }
                      }}
                      style={{
                        padding: '1.2rem',
                        borderBottom: '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        borderLeft: isSelected ? '3px solid var(--accent-gold)' : '3px solid transparent',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {t.hasUnreadCuratorMessage && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', width: '8px', height: '8px', borderRadius: '50%', background: '#f44336' }}></div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', background: cat.bg, color: cat.color, padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>{cat.label}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: t.status === 'open' ? 'var(--accent-gold)' : '#4CAF50',
                          fontWeight: 'bold'
                        }}>
                          {t.status === 'open' ? 'Aberto' : 'Resolvido'}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.createdAt}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Ticket Detail Conversation */}
          <div style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedTicket ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                
                {/* Detail Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>{selectedTicket.subject}</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Categoria: <strong style={{ color: getCategoryDetails(selectedTicket.category).color }}>{getCategoryDetails(selectedTicket.category).label}</strong></span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aberto em: <strong>{selectedTicket.createdAt}</strong></span>
                    </div>
                  </div>
                  <span style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    background: selectedTicket.status === 'open' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                    color: selectedTicket.status === 'open' ? 'var(--accent-gold)' : '#4CAF50'
                  }}>
                    {selectedTicket.status === 'open' ? 'CHAMADO ABERTO' : 'CHAMADO RESOLVIDO'}
                  </span>
                </div>

                {/* Messages List Area */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Original message */}
                  <div style={{ 
                    alignSelf: selectedTicket.linkedReportId ? 'flex-end' : 'flex-start', 
                    maxWidth: '80%', 
                    background: selectedTicket.linkedReportId ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)', 
                    border: selectedTicket.linkedReportId ? '1px solid rgba(212,175,55,0.2)' : '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '1rem' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: selectedTicket.linkedReportId ? 'var(--accent-gold)' : 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                      {selectedTicket.linkedReportId ? 'Curadoria Sagaflix' : `${selectedTicket.authorName} (Você)`}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{selectedTicket.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.4rem' }}>{selectedTicket.createdAt}</div>
                  </div>

                  {/* Replies thread */}
                  {(selectedTicket.replies || []).map(reply => {
                    const isSelf = reply.senderId === currentUser.id;
                    const isCurator = reply.senderName === 'Curadoria Sagaflix';
                    return (
                      <div 
                        key={reply.id}
                        style={{
                          alignSelf: isSelf ? 'flex-start' : 'flex-end',
                          maxWidth: '80%',
                          background: isSelf ? 'rgba(255,255,255,0.02)' : 'rgba(212,175,55,0.08)',
                          border: isSelf ? '1px solid var(--border-color)' : '1px solid rgba(212,175,55,0.2)',
                          borderRadius: '8px',
                          padding: '1rem'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: isSelf ? 'var(--accent-gold)' : 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                          {isSelf ? `${reply.senderName} (Você)` : reply.senderName}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{reply.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.4rem' }}>{reply.createdAt}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Footer Area */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  {selectedTicket.status === 'open' ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Escreva uma resposta para a curadoria..."
                        rows="2"
                        style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                      />
                      <button 
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                        className="btn-primary" 
                        style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', opacity: replyText.trim() ? 1 : 0.5 }}
                      >
                        <Send size={16} /> Enviar
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem' }}>
                      Este chamado foi marcado como Resolvido. Caso precise de mais ajuda, por favor abra um novo chamado de suporte.
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '3rem', textAlign: 'center' }}>
                <Mail size={48} style={{ opacity: 0.15, marginBottom: '1.5rem' }} />
                <p style={{ margin: 0, fontSize: '1.05rem' }}>Selecione um chamado na barra lateral para ver a conversa ou abra um novo chamado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Novo Chamado */}
        {showNewTicketModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
            <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', width: '500px', maxWidth: '90%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0 }}>Abrir Chamado de Suporte</h3>
                <button onClick={() => setShowNewTicketModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {/* Categoria */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Categoria do Suporte</label>
                  <select
                    value={newTicket.category}
                    onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="form-input"
                    style={{ padding: '0.75rem', background: 'var(--bg-main)' }}
                  >
                    <option value="technical">🛠️ Suporte Técnico (Erros, Sistema)</option>
                    <option value="curator">📖 Curadoria (Obras, Feedbacks, Diretrizes)</option>
                    <option value="financial">💰 Financeiro (Cobrança, Royalties)</option>
                    <option value="other">❓ Outros Assuntos</option>
                  </select>
                </div>

                {/* Assunto */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assunto</label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="form-input"
                    placeholder="Resuma o motivo do seu chamado..."
                    required
                  />
                </div>

                {/* Mensagem */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mensagem</label>
                  <textarea
                    value={newTicket.message}
                    onChange={e => setNewTicket({ ...newTicket, message: e.target.value })}
                    className="form-input"
                    rows="6"
                    placeholder="Descreva detalhadamente o seu problema ou dúvida..."
                    required
                  />
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <button className="btn-secondary" onClick={() => setShowNewTicketModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleCreateTicket}>Enviar Chamado</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
}
