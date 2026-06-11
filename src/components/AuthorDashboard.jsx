import { useState, useEffect } from 'react';
import { User, BookOpen, Plus, Search, Trash2, Palette, BarChart2, Users, Activity, TrendingUp, ChevronDown, ChevronUp, Star, X, MessageSquare, Send, Mail, Key, RefreshCw, ThumbsUp, ThumbsDown, Menu } from 'lucide-react';
import BookIdeasBoard from './BookIdeasBoard';

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

export default function AuthorDashboard({ db, onUpdateData, currentUser, onSelectBook, onOpenNewBook, forceUserId, onCloseForceView, activeTab: propActiveTab, onTabChange }) {
  const [localActiveTab, setLocalActiveTab] = useState('dashboard');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedIdeaBookId, setSelectedIdeaBookId] = useState(null);
  const [noteRequestTab, setNoteRequestTab] = useState('pending');
  
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0 }}>Meus Livros</h2>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Pesquisar por título..." 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ padding: '0.8rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', minWidth: '220px' }}
            />
            <button className="btn-primary fab-button" onClick={onOpenNewBook} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> <span>NOVO LIVRO</span>
            </button>
          </div>
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
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontFamily: "'Playfair Display', serif" }}>Meus Livros:</h3>
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
        authorName: currentUser.name,
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
        senderName: currentUser.name,
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

      const newDb = {
        ...db,
        supportTickets: updatedTickets
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
                  <div style={{ alignSelf: 'flex-start', maxWidth: '80%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.4rem' }}>{selectedTicket.authorName} (Você)</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{selectedTicket.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.4rem' }}>{selectedTicket.createdAt}</div>
                  </div>

                  {/* Replies thread */}
                  {(selectedTicket.replies || []).map(reply => {
                    const isSelf = reply.senderId === currentUser.id;
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
                        <div style={{ fontSize: '0.75rem', color: isSelf ? 'var(--accent-gold)' : '#2196F3', fontWeight: 'bold', marginBottom: '0.4rem' }}>
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

  const handleApproveNoteAccess = (reqId) => {
    const newDb = { ...db };
    const req = newDb.noteRequests.find(r => r.id === reqId);
    if (req) {
      req.status = 'approved';
      onUpdateData(newDb);
    }
  };

  const handleRejectNoteAccess = (reqId) => {
    const newDb = { ...db };
    const req = newDb.noteRequests.find(r => r.id === reqId);
    if (req) {
      req.status = 'rejected';
      onUpdateData(newDb);
    }
  };

  const renderSolicitacoesNotas = () => {
    // Pegar apenas os livros que pertencem a este autor
    const myBooks = db.books.filter(b => b.authorId === effectiveUser.id).map(b => b.id);
    const requests = (db.noteRequests || []).filter(r => r.status === noteRequestTab && myBooks.includes(r.bookId));
    
    return (
      <div className="animate-fade-in">
        <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>Solicitações de Notas Secretas</h2>
        
        {/* Abas de Navegação Interna */}
        <div className="mobile-horizontal-scroll" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <button 
            onClick={() => setNoteRequestTab('pending')}
            style={{ background: 'none', border: 'none', color: noteRequestTab === 'pending' ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: noteRequestTab === 'pending' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
            Pendentes
          </button>
          <button 
            onClick={() => setNoteRequestTab('approved')}
            style={{ background: 'none', border: 'none', color: noteRequestTab === 'approved' ? '#4CAF50' : 'var(--text-muted)', fontWeight: noteRequestTab === 'approved' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
            Aprovados
          </button>
          <button 
            onClick={() => setNoteRequestTab('rejected')}
            style={{ background: 'none', border: 'none', color: noteRequestTab === 'rejected' ? '#f44336' : 'var(--text-muted)', fontWeight: noteRequestTab === 'rejected' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>
            Recusados
          </button>
          <button 
            onClick={() => setNoteRequestTab('ranking')}
            style={{ background: 'none', border: 'none', color: noteRequestTab === 'ranking' ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: noteRequestTab === 'ranking' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem', marginLeft: 'auto' }}>
            <Activity size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.3rem' }} />
            Métricas de Notas
          </button>
        </div>

        {noteRequestTab === 'ranking' ? (
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
                  const types = ['characters', 'locations', 'organizations', 'items'];
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
        ) : requests.length === 0 ? (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Key size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Nenhuma solicitação nesta aba no momento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {requests.map(req => {
              const book = db.books.find(b => b.id === req.bookId);
              let noteTitle = 'Nota Secreta';
              if (book?.universe) {
                const types = ['characters', 'locations', 'organizations', 'items'];
                for (const t of types) {
                  if (book.universe[t]) {
                    const item = book.universe[t].find(i => i.id === req.itemId);
                    if (item && item.authorNotes) {
                      const note = item.authorNotes.find(n => n.id === req.noteId);
                      if (note) noteTitle = note.title;
                    }
                  }
                }
              }

              return (
                <div key={req.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{req.userName}</h3>
                    {req.retryCount > 0 && noteRequestTab === 'pending' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255, 170, 0, 0.1)', color: '#ffaa00', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }} title="Já foi recusado antes">
                        <RefreshCw size={12} /> {req.retryCount}x
                      </div>
                    )}
                  </div>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Livro: {req.bookTitle}</p>
                  
                  <div style={{ padding: '0.8rem', background: 'rgba(255, 100, 100, 0.05)', border: '1px dashed rgba(255, 100, 100, 0.3)', borderRadius: '6px', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#ff7777', fontWeight: 'bold', marginBottom: '0.3rem' }}>PEDINDO ACESSO À NOTA:</div>
                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>{noteTitle}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {noteRequestTab === 'pending' && (
                      <>
                        <button className="btn-primary" style={{ flex: 1, background: '#4CAF50' }} onClick={() => handleApproveNoteAccess(req.id)}>Aprovar</button>
                        <button className="btn-secondary" style={{ flex: 1, color: '#f44336', borderColor: 'rgba(244,67,54,0.3)' }} onClick={() => handleRejectNoteAccess(req.id)}>Recusar</button>
                      </>
                    )}
                    {noteRequestTab === 'approved' && (
                      <button className="btn-secondary" style={{ flex: 1, color: '#f44336', borderColor: 'rgba(244,67,54,0.3)' }} onClick={() => handleRejectNoteAccess(req.id)}>Revogar Acesso (Recusar)</button>
                    )}
                    {noteRequestTab === 'rejected' && (
                      <button className="btn-primary" style={{ flex: 1, background: '#4CAF50' }} onClick={() => handleApproveNoteAccess(req.id)}>Reverter (Aprovar)</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="author-dashboard-container dashboard-container">
      
      {/* Overlay do Drawer (Mobile) */}
      <div 
        className={`drawer-overlay ${isSidebarOpen ? 'open' : ''} mobile-only`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar do Autor */}
      <div className={`author-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        
        <div className="mobile-only" style={{ padding: '0 1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-main)' }}>
            <X size={24} />
          </button>
        </div>

        {forceUserId && (
          <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
            <button onClick={onCloseForceView} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(212,175,55,0.1)', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
              Voltar à Curadoria
            </button>
          </div>
        )}

        {/* Links Menu */}
        <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} style={navItemStyle(activeTab === 'dashboard')}><BarChart2 size={18}/> Dashboard</button>
        <button onClick={() => { setActiveTab('livros'); setIsSidebarOpen(false); }} style={navItemStyle(activeTab === 'livros')}><BookOpen size={18}/> Meus Livros</button>
        <button onClick={() => { setActiveTab('ideias'); setIsSidebarOpen(false); }} style={navItemStyle(activeTab === 'ideias')}><Palette size={18}/> Painel de Ideias</button>
        <button onClick={() => { setActiveTab('solicitacoes_notas'); setIsSidebarOpen(false); }} style={navItemStyle(activeTab === 'solicitacoes_notas')}><Key size={18}/> Solicitações de Notas</button>
        <button onClick={() => { setActiveTab('suporte'); setIsSidebarOpen(false); }} style={navItemStyle(activeTab === 'suporte')}><MessageSquare size={18}/> Suporte e Inbox</button>
      </div>

      {/* Conteúdo Principal */}
      <div className="dashboard-main-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Mobile Header (Only visible on mobile) */}
        <div className="mobile-header mobile-only" style={{ marginBottom: '1rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', gap: '1rem' }}>
          <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', padding: '0.5rem 0' }}>
            <Menu size={24} />
          </button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', fontWeight: 'bold', textAlign: 'left', flex: 1 }}>
            {activeTab === 'dashboard' ? (
              <>
                <span style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-main)' }}>Olá, {effectiveUser.name.split(' ')[0]}.</span>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--accent-gold)' }}>Que mundo vamos criar hoje?</span>
              </>
            ) : (
              <span style={{ fontSize: '1.2rem' }}>Sagaflix Studio</span>
            )}
          </div>
        </div>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'livros' && renderBooks()}
        {activeTab === 'ideias' && renderIdeas()}
        {activeTab === 'solicitacoes_notas' && renderSolicitacoesNotas()}
        {activeTab === 'suporte' && renderSuporte()}
      </div>

    </div>
  );
}
