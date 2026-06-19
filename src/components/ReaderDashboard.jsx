import { useState, useEffect, useRef } from 'react';
import { BookOpen, User, Star, Bookmark, CheckCircle, Search, Map, X, Play, Heart, Trash2, SlidersHorizontal, Activity, ChevronDown, Award } from 'lucide-react';
import { GENRES_LIST } from '../lib/genres';
import { BADGES_DB, BADGE_CATEGORIES, TIER_INFO, calculateLevel } from '../utils/gamificationConfig';
import { processGamificationEvent } from '../utils/gamificationEngine';

const DEFAULT_BANNERS = [
  {
    id: 'default_1',
    title: 'Jardim das Flores',
    description: 'Uma guerra civil silenciosa abala as gangues locais. Quem mataria o idoso jardineiro que uniu a cidade? Entre no mistério.',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop',
    actionUrl: 'livro_jardim',
    actionText: 'Começar a Ler'
  },
  {
    id: 'default_2',
    title: 'Descubra a Saga Rengaw',
    description: 'Em um mundo de cavaleiros e lealdade, um elixir lendário promete mudar o destino dos guerreiros mais valentes. Explore agora.',
    imageUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=1200&auto=format&fit=crop',
    actionUrl: 'book_1780778689319',
    actionText: 'Explorar Livro'
  }
];

const getAgeRatingBadge = (rating) => {
  const clean = rating ? rating.toString().trim().toLowerCase() : 'livre';
  if (clean.startsWith('l')) {
    return { text: 'L', bg: 'rgba(76, 175, 80, 0.15)', color: '#4CAF50', border: '1px solid rgba(76, 175, 80, 0.3)' };
  }
  if (clean.includes('10')) {
    return { text: '10', bg: 'rgba(33, 150, 243, 0.15)', color: '#2196F3', border: '1px solid rgba(33, 150, 243, 0.3)' };
  }
  if (clean.includes('12')) {
    return { text: '12', bg: 'rgba(255, 193, 7, 0.15)', color: '#FFC107', border: '1px solid rgba(255, 193, 7, 0.3)' };
  }
  if (clean.includes('14')) {
    return { text: '14', bg: 'rgba(255, 152, 0, 0.15)', color: '#FF9800', border: '1px solid rgba(255, 152, 0, 0.3)' };
  }
  if (clean.includes('16')) {
    return { text: '16', bg: 'rgba(255, 87, 34, 0.15)', color: '#FF5722', border: '1px solid rgba(255, 87, 34, 0.3)' };
  }
  if (clean.includes('18')) {
    return { text: '18', bg: 'rgba(244, 67, 54, 0.15)', color: '#F44336', border: '1px solid rgba(244, 67, 54, 0.3)' };
  }
  return { 
    text: rating ? rating.toString().replace(' anos', '') : 'L', 
    bg: 'rgba(76, 175, 80, 0.15)', 
    color: '#4CAF50', 
    border: '1px solid rgba(76, 175, 80, 0.3)' 
  };
};

export default function ReaderDashboard({ db, currentUser, onUpdateData, onSelectBook, onSelectBookUniverse, initialActiveTab, onTabChange }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [localActiveTab, setLocalActiveTab] = useState('vitrine');
  const [openBadgeDetails, setOpenBadgeDetails] = useState(null);
  const activeTab = initialActiveTab || localActiveTab;
  const setActiveTab = (tab) => {
    if (onTabChange) onTabChange(tab);
    else setLocalActiveTab(tab);
  };
  const [searchText, setSearchText] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [bookForRequest, setBookForRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({
    features: [],
    message: ''
  }); // Book selected for Netflix-style popover

  // Filtros avançados
  const [showGenresDropdown, setShowGenresDropdown] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedAgeRating, setSelectedAgeRating] = useState('');
  const [selectedAuthorFilter, setSelectedAuthorFilter] = useState('');
  const [letterFilter, setLetterFilter] = useState('');

  // Avaliações
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [hoverStars, setHoverStars] = useState(0);

  const activeBook = selectedBook ? db.books.find(b => b.id === selectedBook.id) : null;
  const coAuthors = (activeBook && activeBook.coAuthorIds) ? activeBook.coAuthorIds.map(id => db.users.find(u => u.id === id)).filter(Boolean) : (activeBook && activeBook.coAuthorId ? [db.users.find(u => u.id === activeBook.coAuthorId)].filter(Boolean) : []);

  useEffect(() => {
    if (activeBook) {
      const userReview = (activeBook.ratings || []).find(r => r.userId === currentUser.id);
      if (userReview) {
        setRatingStars(userReview.stars);
        setRatingComment(userReview.comment || '');
      } else {
        setRatingStars(0);
        setRatingComment('');
      }
    }
  }, [selectedBook, currentUser.id, db.books]);

  // Carrossel
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) {
        setCurrentSlide(prev => (prev + 1) % activeBanners.length);
      } else {
        setCurrentSlide(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const publishedBooks = db.books.filter(b => b.status === 'published');
  
  // Favoritos (Minha Lista)
  const favorites = currentUser.favorites || [];
  
  // Status de leitura
  const readingStatus = currentUser.readingStatus || {};

  const activeBanners = db.banners && db.banners.length > 0 ? db.banners : DEFAULT_BANNERS;

  // Rotação automática do carrossel
  useEffect(() => {
    if (activeTab !== 'vitrine' || activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, activeBanners.length]);

  const handleSendRequest = () => {
    if (requestForm.features.length === 0) {
      alert("Por favor, selecione pelo menos uma área de interesse.");
      return;
    }
    
    const newDb = { ...db };
    const bookIndex = newDb.books.findIndex(b => b.id === bookForRequest.id);
    if (bookIndex !== -1) {
      newDb.books[bookIndex].universeRequests = newDb.books[bookIndex].universeRequests || [];
      newDb.books[bookIndex].universeRequests.push({
        id: 'req_' + Date.now(),
        userId: currentUser.id,
        timestamp: new Date().toISOString(),
        requestedFeatures: requestForm.features,
        message: requestForm.message
      });
      onUpdateData(newDb);
    }
    
    alert("Seu pedido foi enviado ao autor!");
    setShowRequestModal(false);
    setRequestForm({ features: [], message: '' });
  };

  // Extração de metadados únicos das obras para os filtros
  const getUniqueGenres = () => {
    const genres = new Set();
    publishedBooks.forEach(b => {
      const catStr = b.category || b.genre || b.universe?.book?.category || b.universe?.book?.genre;
      if (catStr) {
        catStr.split(',').forEach(g => genres.add(g.trim()));
      }
    });
    return Array.from(genres);
  };

  const getUniqueAgeRatings = () => {
    const ratings = new Set();
    publishedBooks.forEach(b => {
      const rating = b.ageRating || b.universe?.book?.ageRating;
      if (rating) {
        ratings.add(rating.toString().trim());
      }
    });
    return Array.from(ratings);
  };

  const getUniqueAuthors = () => {
    const authorNames = new Set();
    publishedBooks.forEach(b => {
      const authorObj = db.users.find(u => u.id === b.authorId);
      if (authorObj && (authorObj.displayMode === 'name' ? authorObj.name : (authorObj.nickname || authorObj.name))) {
        authorNames.add((authorObj.displayMode === 'name' ? authorObj.name : (authorObj.nickname || authorObj.name)).trim());
      }
    });
    return Array.from(authorNames);
  };

  // Filter books based on active tab and search query
  const getFilteredBooks = () => {
    let list = [];
    if (activeTab === 'vitrine') {
      list = publishedBooks;
    } else if (activeTab === 'favoritos') {
      list = publishedBooks.filter(b => favorites.includes(b.id));
    } else if (activeTab === 'lendo') {
      list = publishedBooks.filter(b => readingStatus[b.id] === 'reading');
    } else if (activeTab === 'lidos') {
      list = publishedBooks.filter(b => readingStatus[b.id] === 'read');
    }

    if (searchText) {
      list = list.filter(b => b.title.toLowerCase().includes(searchText.toLowerCase()));
    }

    if (selectedGenre) {
      list = list.filter(b => {
        const catStr = b.category || b.genre || b.universe?.book?.category || b.universe?.book?.genre;
        return catStr && catStr.toLowerCase().includes(selectedGenre.toLowerCase());
      });
    }

    if (selectedAgeRating) {
      list = list.filter(b => {
        const rating = b.ageRating || b.universe?.book?.ageRating;
        return rating && rating.toString().toLowerCase().trim().includes(selectedAgeRating.toLowerCase().trim());
      });
    }

    if (selectedAuthorFilter) {
      list = list.filter(b => {
        const authorObj = db.users.find(u => u.id === b.authorId);
        return authorObj && (authorObj.displayMode === 'name' ? authorObj.name : (authorObj.nickname || authorObj.name)).toLowerCase().trim() === selectedAuthorFilter.toLowerCase().trim();
      });
    }

    if (letterFilter) {
      list = list.filter(b => b.title.toUpperCase().startsWith(letterFilter.toUpperCase()));
    }

    return list;
  };

  const filteredBooks = getFilteredBooks();

  // Helper to format bookmark display text
  const getBookmarkProgress = (bookId) => {
    const pos = currentUser.readingPositions?.[bookId];
    if (!pos) return null;
    const chIdx = pos.chapterIdx;
    if (chIdx === 0) {
      const subIdx = pos.subthemeIdx || 0;
      if (subIdx === 0) return 'Capa';
      if (subIdx === 1) return 'Sobre o Autor';
      if (subIdx === 2) return 'Sinopse';
      return 'Introdução';
    }
    return `Cap. ${chIdx}`;
  };

  // Toggle favorite (Minha Lista)
  const handleToggleFavorite = (bookId) => {
    const updatedFavorites = favorites.includes(bookId)
      ? favorites.filter(id => id !== bookId)
      : [...favorites, bookId];

    const updatedUser = {
      ...currentUser,
      favorites: updatedFavorites
    };

    const newDb = { ...db };
    newDb.users = newDb.users.map(u => u.id === currentUser.id ? updatedUser : u);
    onUpdateData(newDb);
  };

  // Toggle Reading Status (Lendo / Lido)
  const handleUpdateStatus = (bookId, status) => {
    const updatedStatus = {
      ...(currentUser.readingStatus || {}),
      [bookId]: status
    };

    const updatedUser = {
      ...currentUser,
      readingStatus: updatedStatus
    };

    const newDb = { ...db };
    newDb.users = newDb.users.map(u => u.id === currentUser.id ? updatedUser : u);
    onUpdateData(newDb);
  };

  const handleSaveReview = () => {
    if (ratingStars === 0) {
      alert('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }
    
    const newRating = {
      userId: currentUser.id,
      userName: (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)),
      stars: ratingStars,
      comment: ratingComment.trim(),
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const newDb = { ...db };
    newDb.books = newDb.books.map(b => {
      if (b.id === activeBook.id) {
        const otherRatings = (b.ratings || []).filter(r => r.userId !== currentUser.id);
        return {
          ...b,
          ratings: [...otherRatings, newRating]
        };
      }
      return b;
    });

    onUpdateData(newDb);
    alert('Avaliação salva com sucesso!');
  };

  const handleBannerAction = (banner) => {
    if (banner.actionUrl) {
      const book = db.books.find(b => b.id === banner.actionUrl);
      if (book) {
        setSelectedBook(book);
      } else if (banner.actionUrl.startsWith('http')) {
        window.open(banner.actionUrl, '_blank');
      } else {
        alert(`Destino do banner: ${banner.actionUrl}`);
      }
    }
  };

  const navItemStyle = (tabName) => {
    const isActive = activeTab === tabName;
    return {
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
    };
  };

  const renderBannerCarousel = () => {
    if (activeBanners.length === 0) return null;
    const currentBanner = activeBanners[currentSlide] || activeBanners[0];

    const book = db.books.find(b => b.id === currentBanner.actionUrl);
    const authorName = book ? (db.users.find(u => u.id === book.authorId)?.name || 'Wagner Rocha') : 'Wagner Rocha';

    return (
      <div
        className="reader-banner"
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        style={{ 
          position: 'relative', 
          width: '100%',
          marginLeft: '0',
          marginRight: '0',
          marginTop: '0',
          height: isMobile ? '420px' : '280px', 
          borderRadius: isMobile ? '0 0 20px 20px' : '0 0 16px 16px',
          overflow: 'hidden', 
          border: isMobile ? 'none' : '1px solid var(--border-color)',
          borderTop: 'none',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          background: '#1a1c20',
          padding: isMobile ? '1.5rem 1.5rem 2.5rem 1.5rem' : '2rem 3rem',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '0' : '3rem',
          marginBottom: '0',
          flexShrink: 0,
          userSelect: 'none',
          touchAction: 'pan-y'
        }}>
        {/* Background Image Slide */}
        {currentBanner.imageUrl && (
          <img 
            src={currentBanner.imageUrl} 
            alt="" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              position: 'absolute', 
              top: 0, 
              left: 0,
              zIndex: 0,
              animation: 'fadeIn 0.8s ease-in-out'
            }} 
          />
        )}
        
        {/* HSL Dark overlay for contrast */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: isMobile 
            ? 'linear-gradient(to top, rgba(13, 14, 18, 0.95) 0%, rgba(13, 14, 18, 0.6) 60%, rgba(13, 14, 18, 0.2) 100%)'
            : 'linear-gradient(to right, rgba(13, 14, 18, 0.95) 0%, rgba(13, 14, 18, 0.8) 50%, rgba(13, 14, 18, 0.3) 100%)',
          zIndex: 1
        }}></div>

        {/* Content Overlay */}
        <div style={{ 
          position: 'relative', 
          zIndex: 2, 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          width: '100%',
          height: '100%',
          alignItems: isMobile ? 'center' : 'center',
          justifyContent: isMobile ? 'flex-end' : 'space-between',
          gap: isMobile ? '1rem' : '2rem'
        }}>
          {/* Coluna 1: Recomendado & Info */}
          <div style={{ 
            flex: isMobile ? 'none' : '1.2', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: isMobile ? 'flex-end' : 'center',
            alignItems: isMobile ? 'center' : 'flex-start',
            textAlign: isMobile ? 'center' : 'left',
            width: '100%',
            height: isMobile ? 'auto' : '100%'
          }}>
            <span style={{ 
              color: 'var(--accent-gold)', 
              fontSize: '0.75rem', 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              letterSpacing: '2px', 
              marginBottom: '0.5rem',
              animation: 'slideIn 0.5s ease-out'
            }}>
              RECOMENDADO
            </span>
            <h1 style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: isMobile ? '1.8rem' : '2.2rem', 
              color: '#fff', 
              margin: '0 0 0.2rem 0', 
              lineHeight: '1.2',
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
              animation: 'slideIn 0.6s ease-out'
            }}>
              {currentBanner.title}
            </h1>
            <p style={{ 
              color: 'var(--accent-gold)', 
              fontSize: '0.9rem', 
              margin: '0 0 0.8rem 0',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              animation: 'slideIn 0.7s ease-out'
            }}>
              Por {authorName}
            </p>
            
            {isMobile && (
              <p style={{ 
                color: 'rgba(255,255,255,0.85)', 
                fontSize: '0.8rem', 
                lineHeight: '1.4',
                margin: '0 0 1.2rem 0',
                maxWidth: '90%',
                maxHeight: '40px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}>
                {currentBanner.description}
              </p>
            )}

            <div>
              <button 
                onClick={() => handleBannerAction(currentBanner)} 
                className="btn-primary" 
                style={{ 
                  padding: '0.7rem 1.8rem', 
                  fontSize: '0.9rem', 
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(212,175,55,0.2)',
                  animation: 'slideIn 0.8s ease-out',
                  margin: isMobile ? '0 auto' : '0'
                }}
              >
                {currentBanner.actionText || 'Começar a Ler'}
              </button>
            </div>
          </div>

          {/* Coluna 2: Sinopse Card (Escondido no celular) */}
          {!isMobile && (
            <div style={{ 
              flex: '0.6', 
              background: 'rgba(27, 29, 34, 0.85)', 
              backdropFilter: 'blur(8px)',
              borderRadius: '12px', 
              padding: '1.5rem', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center',
              boxSizing: 'border-box',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflowY: 'auto'
            }}>
              <p style={{ 
                color: 'rgba(255,255,255,0.85)', 
                fontSize: '0.95rem', 
                lineHeight: '1.6',
                margin: 0,
                textAlign: 'left',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}>
                {currentBanner.description}
              </p>
            </div>
          )}
        </div>

        {/* Carousel Navigation Dots */}
        {activeBanners.length > 1 && (
          <div style={{ 
            position: 'absolute', 
            bottom: isMobile ? '1.2rem' : '1rem', 
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', 
            gap: '6px', 
            zIndex: 3 
          }}>
            {activeBanners.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{ 
                  width: idx === currentSlide ? '20px' : '8px', 
                  height: '8px', 
                  borderRadius: '4px', 
                  border: 'none', 
                  background: idx === currentSlide ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s ease'
                }}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };
  const renderDossier = () => {
    const stats = currentUser.stats || { totalTime: 0, totalPages: 0 };
    
    // Dynamic badge evaluation based on conditions
    const allBadges = db.gamificationBadges || [];
    let dynamicBadges = [...(currentUser.badges || [])];
    const pagesRead = currentUser.pagesRead || 0;
    const finishedBooks = (currentUser.finishedBooks || []).length;
    const startedBooksCount = Object.keys(currentUser.readingPositions || {}).length;
    const validBooksRead = finishedBooks; // Integração com anti-cheat entra aqui no futuro.
    
    allBadges.forEach(badge => {
      if (dynamicBadges.some(ub => ub.id === badge.id || ub === badge.id || ub.name === badge.name)) return;
      
      let meetsCondition = false;
      if (badge.conditionTarget === 'pagesRead') {
        if (badge.conditionOperator === '>=' && pagesRead >= badge.conditionValue) meetsCondition = true;
        if (badge.conditionOperator === '==' && pagesRead === badge.conditionValue) meetsCondition = true;
      } else if (badge.conditionTarget === 'booksRead') {
        if (badge.conditionOperator === '>=' && validBooksRead >= badge.conditionValue) meetsCondition = true;
        if (badge.conditionOperator === '==' && validBooksRead === badge.conditionValue) meetsCondition = true;
      } else if (badge.conditionTarget === 'dossiersReadComplex') {
        // Lógica de Dossiê: Pelo menos 10 iniciados, 5 concluídos, e 50% dos dossiês lidos nas obras lidas.
        if (startedBooksCount >= 10 && finishedBooks >= 5) {
           meetsCondition = true; 
        }
      } else if (badge.conditionTarget === 'secretNotesApproved') {
        let approvedNotes = 0;
        (db.books || []).forEach(b => {
           const universeNotes = b.universe?.notes || [];
           approvedNotes += universeNotes.filter(n => n.userId === currentUser.id && n.status === 'accepted').length;
        });
        if (badge.conditionOperator === '>=' && approvedNotes >= badge.conditionValue) meetsCondition = true;
        if (badge.conditionOperator === '==' && approvedNotes === badge.conditionValue) meetsCondition = true;
      }
      if (meetsCondition) dynamicBadges.push(badge);
    });
    
    const badges = dynamicBadges;
    
    // Determine reader rank based on totalPages
    let readerRank = 'Visitante';
    if (stats.totalPages > 10) readerRank = 'Viajante Literário';
    if (stats.totalPages > 50) readerRank = 'Explorador de Mundos';
    if (stats.totalPages > 100) readerRank = 'Mestre dos Dossiês';
    if (stats.totalPages > 500) readerRank = 'Curador Honorário';

    return (
      <div className="animate-fade-in dossier-container-mobile" style={{ padding: isMobile ? '1rem 0' : '2rem', display: 'flex', justifyContent: 'center' }}>
        <div className="dossier-wrapper" style={{ padding: 0, overflowY: 'visible', flex: 'none', width: '100%', maxWidth: '900px' }}>
          <div className="dossier-paper" style={{ padding: isMobile ? '2.5rem 1rem 2rem 1rem' : '3rem 4rem 4rem 4rem', minHeight: 'auto', width: '100%' }}>
            <div className="dossier-paperclip"></div>
            <div className="dossier-tab">DOSSIÊ</div>
            
            <div className="dossier-header">
              <div className="dossier-org" style={{ lineHeight: 1.4, alignSelf: 'flex-start' }}>
                <span style={{ fontSize: '0.65rem', color: '#555' }}>FICHA TÉCNICA COMPLEMENTAR:</span><br/>
                <div style={{ fontWeight: 'bold', color: '#8b0000' }}>SAGAFLIX</div>
              </div>
              <div className="dossier-classification">CLASSIFICAÇÃO: RESTRITO - APENAS PARA LEITURA</div>
            </div>
            
            <div className="dossier-subheader">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#222' }}>
                DOSSIÊ DE: {currentUser.nickname ? currentUser.nickname.toUpperCase() : (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name)).toUpperCase()}
              </div>
              <div className="dossier-status" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#222' }}>
                STATUS: 
                <span className="badge-tag-status" style={{ background: 'var(--accent-gold)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {readerRank.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="dossier-grid">
              {/* Esquerda: Foto e Dados (agora centralizado) */}
              <div style={{ margin: '0 auto', maxWidth: '500px' }}>
                <div className="dossier-photo-container">
                  <div className="dossier-photo-title">FOTO DE IDENTIFICAÇÃO</div>
                  <div style={{ background: '#222', height: '260px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #555', overflow: 'hidden' }}>
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={80} color="#888" />
                    )}
                  </div>
                </div>
                
                <div className="dossier-section-title" style={{ textAlign: 'center' }}>ESTATÍSTICAS GERAIS</div>
                
                <div className="dossier-personal-data" style={{ color: '#222' }}>
                  <div><strong>NOME / APELIDO:</strong> {currentUser.nickname || (currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name))}</div>
                  <div><strong>PÁGINAS LIDAS:</strong> {pagesRead}</div>
                  <div><strong>LIVROS CONCLUÍDOS:</strong> {finishedBooks}</div>
                  <div><strong>TEMPO DE LEITURA:</strong> {Math.floor((stats.totalTime || 0)/60)}h {(stats.totalTime || 0)%60}m</div>
                  <div><strong>MEMBRO DESDE:</strong> 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderConquistas = () => {
    const user = db.users.find(u => u.id === currentUser.id);
    const xp = user.xp || 0;
    const streakDays = user.streakDays || 0;
    const unlockedBadges = user.unlockedBadges || [];
    const badgeProgress = user.badgeProgress || {};
    const levelInfo = calculateLevel(xp);

    return (
      <div style={{ paddingBottom: '2rem', animation: 'fadeIn 0.3s ease-in-out' }}>
        <h2 className="sr-only">Sistema de gamificação BookFlix — categorias de selos e conquistas</h2>

        <div className="stats-strip">
          <div className="stat-card"><div className="stat-label">XP total</div><div className="stat-val">{xp}</div></div>
          <div className="stat-card"><div className="stat-label">Selos conquistados</div><div className="stat-val">{unlockedBadges.length} / 42</div></div>
          <div className="stat-card"><div className="stat-label">Nível atual</div><div className="stat-val">{levelInfo.title}</div></div>
          <div className="stat-card"><div className="stat-label">Sequência</div><div className="stat-val">{streakDays} dias</div></div>
        </div>

        {openBadgeDetails && (
          <div className="detail-panel active">
            <div className="detail-top">
              <div className="detail-icon-lg" style={{ background: openBadgeDetails.bg }}>
                <i className={`ti ${openBadgeDetails.icon}`} style={{ color: openBadgeDetails.ic, fontSize: '28px' }} aria-hidden="true"></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="detail-title">{openBadgeDetails.name}</div>
                  <div className={`tier-pill ${TIER_INFO[openBadgeDetails.tier].pillClass}`}>{TIER_INFO[openBadgeDetails.tier].label}</div>
                  {unlockedBadges.some(ub => ub.id === openBadgeDetails.id) && (
                    <div style={{ fontSize: '11px', background: '#EAF3DE', color: '#27500A', padding: '2px 8px', borderRadius: '20px' }}>Conquistado</div>
                  )}
                </div>
                <div className="detail-desc">{openBadgeDetails.desc}</div>
              </div>
              <button className="close-btn" onClick={() => setOpenBadgeDetails(null)} aria-label="Fechar">&times;</button>
            </div>
            
            {(() => {
              const b = openBadgeDetails;
              const isUnlocked = unlockedBadges.some(ub => ub.id === b.id);
              const currentProg = isUnlocked ? b.progMax : (badgeProgress[b.id] || 0);
              const pct = Math.min(100, Math.round((currentProg / b.progMax) * 100));
              const fill = TIER_INFO[b.tier].fill;
              return (
                <>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: fill }}></div></div>
                  <div className="progress-label"><span>{isUnlocked ? 'Concluído' : `${currentProg} / ${b.progMax}`}</span><span>{pct}%</span></div>
                </>
              );
            })()}

            <div className="xp-strip">
              <i className="ti ti-sparkles" style={{ color: '#854F0B', fontSize: '16px' }} aria-hidden="true"></i>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Recompensa:</span>
              <span className="xp-val">+{openBadgeDetails.xp} XP</span>
              {unlockedBadges.some(ub => ub.id === openBadgeDetails.id) && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Já creditado na sua conta</span>
              )}
            </div>
          </div>
        )}

        {BADGE_CATEGORIES.map(cat => (
          <div key={cat.id}>
            <div className="cat-header">
              <div className="cat-icon" style={{ background: cat.bg }}><i className={`ti ${cat.icon}`} style={{ color: cat.color }} aria-hidden="true"></i></div>
              <span className="cat-title">{cat.name}</span>
              <span className="cat-sub">{cat.sub}</span>
            </div>
            <div className="badges-grid">
              {BADGES_DB[cat.id].map(b => {
                const isUnlocked = unlockedBadges.some(ub => ub.id === b.id);
                return (
                  <div key={b.id} className={`badge-card ${isUnlocked ? '' : 'locked'}`} onClick={() => setOpenBadgeDetails(openBadgeDetails?.id === b.id ? null : b)}>
                    <div className="badge-icon" style={{ background: b.bg }}>
                      <i className={`ti ${b.icon}`} style={{ color: b.ic, fontSize: '22px' }} aria-hidden="true"></i>
                    </div>
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-meta">{b.meta}</div>
                    <div className={`tier-pill ${TIER_INFO[b.tier].pillClass}`}>{TIER_INFO[b.tier].label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="reader-dashboard-container" style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      height: isMobile ? 'auto' : 'calc(100vh - 120px)', 
      background: 'var(--bg-color)', 
      border: isMobile ? 'none' : '1px solid var(--border-color)', 
      borderRadius: isMobile ? '0' : '12px', 
      overflow: isMobile ? 'visible' : 'hidden',
      paddingBottom: isMobile ? '80px' : '0',
      position: 'relative'
    }}>
      
      {currentUser?.incompleteProfile && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#ff9800', color: '#fff', padding: '0.8rem', textAlign: 'center', zIndex: 1000, fontWeight: 'bold' }}>
          ATENÇÃO: Seu perfil está incompleto. Por favor, atualize seus dados básicos na aba de configurações. Caso contrário, a conta poderá ser suspensa.
        </div>
      )}

      {/* Sidebar do Leitor (Escondida no Mobile) */}
      {!isMobile && (
        <div className="reader-sidebar" style={{ width: '260px', background: '#1a1c20', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '2rem 0', flexShrink: 0, overflowY: 'auto' }}>
          {/* Perfil Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', marginBottom: '2.5rem', padding: '0 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={(currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="var(--accent-gold)" />
              )}
            </div>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', textAlign: 'center', fontWeight: 'bold' }}>{(currentUser.displayMode === 'name' ? currentUser.name : (currentUser.nickname || currentUser.name))}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', background: 'rgba(212, 175, 55, 0.15)', padding: '0.15rem 0.6rem', borderRadius: '10px', fontWeight: 'bold' }}>Leitor Especial</span>
          </div>

          {/* Links Menu */}
          <button onClick={() => { setActiveTab('vitrine'); setSelectedBook(null); }} style={navItemStyle('vitrine')}><BookOpen size={18}/> Estante de Obras</button>
          <button onClick={() => { setActiveTab('favoritos'); setSelectedBook(null); }} style={navItemStyle('favoritos')}><Star size={18}/> Minha Lista</button>
          <button onClick={() => { setActiveTab('lendo'); setSelectedBook(null); }} style={navItemStyle('lendo')}><Bookmark size={18}/> Lendo</button>
          <button onClick={() => { setActiveTab('lidos'); setSelectedBook(null); }} style={navItemStyle('lidos')}><CheckCircle size={18}/> Livros Lidos</button>
          <button onClick={() => { setActiveTab('conquistas'); setSelectedBook(null); }} style={navItemStyle('conquistas')}><Award size={18}/> Conquistas</button>
          <button onClick={() => { setActiveTab('dossie'); setSelectedBook(null); }} style={navItemStyle('dossie')}><User size={18}/> Meu Dossiê</button>
        </div>
      )}

      {/* Barra de Navegação Inferior para Mobile (Estilo Netflix) */}
      {isMobile && (
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          background: 'rgba(26, 28, 32, 0.96)', 
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-around', 
          alignItems: 'center', 
          height: '65px', 
          zIndex: 2000,
          padding: '0.2rem 0.5rem 0.6rem 0.5rem'
        }}>
          <button 
            onClick={() => { setActiveTab('vitrine'); setSelectedBook(null); }} 
            style={{ 
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
              color: activeTab === 'vitrine' ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: activeTab === 'vitrine' ? '600' : '400'
            }}
          >
            <BookOpen size={20} />
            <span>Estante</span>
          </button>
          <button 
            onClick={() => { setActiveTab('favoritos'); setSelectedBook(null); }} 
            style={{ 
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
              color: activeTab === 'favoritos' ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: activeTab === 'favoritos' ? '600' : '400'
            }}
          >
            <Star size={20} />
            <span>Minha Lista</span>
          </button>
          <button 
            onClick={() => { setActiveTab('lendo'); setSelectedBook(null); }} 
            style={{ 
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
              color: activeTab === 'lendo' ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: activeTab === 'lendo' ? '600' : '400'
            }}
          >
            <Bookmark size={20} />
            <span>Lendo</span>
          </button>
          <button 
            onClick={() => { setActiveTab('lidos'); setSelectedBook(null); }} 
            style={{ 
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
              color: activeTab === 'lidos' ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: activeTab === 'lidos' ? '600' : '400'
            }}
          >
            <CheckCircle size={20} />
            <span>Lidos</span>
          </button>
          <button 
            onClick={() => { setActiveTab('conquistas'); setSelectedBook(null); }} 
            style={{ 
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
              color: activeTab === 'conquistas' ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: activeTab === 'conquistas' ? '600' : '400'
            }}
          >
            <Award size={20} />
            <span>Conquistas</span>
          </button>
          <button 
            onClick={() => { setActiveTab('dossie'); setSelectedBook(null); }} 
            style={{ 
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
              color: activeTab === 'dossie' ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: activeTab === 'dossie' ? '600' : '400'
            }}
          >
            <User size={20} />
            <span>Dossiê</span>
          </button>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="reader-main-content" style={{ 
        flex: 1, 
        overflowY: isMobile ? 'visible' : 'auto', 
        padding: isMobile 
          ? (activeTab === 'vitrine' ? '0 0 1rem 0' : '1rem')
          : (activeTab === 'vitrine' ? '0 3rem 3rem 3rem' : '3rem'),
        background: 'var(--bg-main)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? '0' : '2rem'
      }}>
        
        {/* Top Header para abas que não sejam a Estante, Dossiê ou Conquistas */}
        {activeTab !== 'vitrine' && activeTab !== 'dossie' && activeTab !== 'conquistas' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0, textTransform: 'capitalize', fontSize: isMobile ? '1.5rem' : '2rem' }}>
              {activeTab === 'favoritos' ? 'Minha Lista (Favoritos)' : activeTab === 'lendo' ? 'Livros Sendo Lidos' : 'Livros Concluídos'}
            </h2>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.8rem', minWidth: isMobile ? '100%' : '260px' }}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Pesquisar livros..." 
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>
        )}

        {/* Top Header para o Dossiê */}
        {activeTab === 'dossie' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0, textTransform: 'capitalize', fontSize: isMobile ? '1.5rem' : '2rem' }}>
              Meu Dossiê de Leitor
            </h2>
          </div>
        )}

        {/* Stylesheet for Keyframe Animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Carousel Banner no topo da Estante */}
        {activeTab === 'vitrine' && (
          <div style={{ marginBottom: isMobile ? '1.2rem' : '0' }}>
            {renderBannerCarousel()}
          </div>
        )}

        {/* Filtros e Pesquisa Combinados em uma única linha */}
        {activeTab === 'vitrine' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: isMobile ? '0 1rem' : '0' }}>
            <div className="reader-filters-bar" style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'stretch' : 'center', 
              background: 'rgba(255,255,255,0.02)', 
              padding: isMobile ? '0.8rem' : '0.8rem 1.2rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)',
              gap: '1rem'
            }}>


              {/* Filtro por Letra A-Z */}
              <div className="reader-az-bar" style={{ 
                display: 'flex', 
                flexDirection: 'row',
                flexWrap: 'nowrap', 
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                gap: '0.15rem', 
                alignItems: 'center',
                width: '100%',
                maxWidth: '100%',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>

                <button 
                  onClick={() => setLetterFilter('')} 
                  style={{ 
                    padding: '0.3rem 0.5rem', 
                    fontSize: '0.75rem', 
                    background: letterFilter === '' ? 'var(--accent-gold)' : 'transparent', 
                    color: letterFilter === '' ? '#000' : 'var(--text-main)', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  Todos
                </button>
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                  <button 
                    key={letter}
                    onClick={() => setLetterFilter(letter)} 
                    style={{ 
                      padding: '0.3rem 0.35rem', 
                      fontSize: '0.75rem', 
                      background: letterFilter === letter ? 'var(--accent-gold)' : 'transparent', 
                      color: letterFilter === letter ? '#000' : 'var(--text-main)', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      minWidth: '20px',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    {letter}
                  </button>
                ))}
              </div>

              {/* Search input and toggle filters button */}
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                {/* Lupa / Pesquisa */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  alignItems: 'center', 
                  background: '#1b1d22', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '6px', 
                  padding: '0.4rem 0.8rem', 
                  width: isMobile ? '100%' : '240px',
                  flex: isMobile ? 1 : 'none'
                }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar livros..." 
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%', fontSize: '0.8rem' }}
                  />
                </div>

                {/* Gêneros Toggle Button */}
                <button 
                  onClick={() => setShowGenresDropdown(!showGenresDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: showGenresDropdown ? 'var(--accent-gold)' : 'var(--text-main)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  title="Filtrar por Gênero"
                >
                  <span>{selectedGenre || 'Gêneros'}</span>
                  <ChevronDown size={16} style={{ transform: showGenresDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
              </div>
            </div>

            {/* Mega-menu de Gêneros */}
            {showGenresDropdown && (
              <div style={{
                background: 'var(--card-bg)',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                animation: 'slideIn 0.3s ease-out',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                marginBottom: '1rem',
                position: 'relative',
                zIndex: 10
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                  gap: '1rem' 
                }}>
                  <div 
                    onClick={() => {
                      setSelectedGenre('');
                      setShowGenresDropdown(false); // Close after selection
                    }}
                    style={{
                      padding: '0.5rem 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      color: selectedGenre === '' ? 'var(--accent-gold)' : 'var(--text-main)',
                      fontWeight: selectedGenre === '' ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedGenre !== '') e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedGenre !== '') e.currentTarget.style.color = 'var(--text-main)';
                    }}
                  >
                    Todos
                  </div>
                  {GENRES_LIST.map(genre => (
                    <div 
                      key={genre}
                      onClick={() => {
                        setSelectedGenre(selectedGenre === genre ? '' : genre);
                        setShowGenresDropdown(false); // Close after selection
                      }}
                      style={{
                        padding: '0.5rem 0',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        color: selectedGenre === genre ? 'var(--accent-gold)' : 'var(--text-main)',
                        fontWeight: selectedGenre === genre ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedGenre !== genre) e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedGenre !== genre) e.currentTarget.style.color = 'var(--text-main)';
                      }}
                    >
                      {genre}
                    </div>
                  ))}
                </div>

                {/* Linha separadora do menu (como na imagem original) */}
                <div style={{
                  height: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '3px',
                  marginTop: '1.5rem',
                  width: '100%'
                }} />
              </div>
            )}
          </div>
        )}

        {/* Grid de Livros */}
        {activeTab !== 'dossie' && activeTab !== 'conquistas' && (
          filteredBooks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)', padding: isMobile && activeTab === 'vitrine' ? '0 1rem' : '0' }}>
              <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ margin: 0 }}>Nenhum livro nesta estante.</p>
            </div>
          ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: isMobile ? '1rem' : '2rem',
            padding: isMobile && activeTab === 'vitrine' ? '0 1rem' : '0'
          }}>
            {filteredBooks.map(book => {
              const author = db.users.find(u => u.id === book.authorId);
              const progress = getBookmarkProgress(book.id);
              
              const ratings = book.ratings || [];
              const count = ratings.length;
              const avg = count > 0 
                ? (ratings.reduce((sum, r) => sum + r.stars, 0) / count).toFixed(1)
                : '0.0';
              
              const primaryGenre = book.genres && book.genres.length > 0 
                ? book.genres[0] 
                : (book.category ? book.category.split(',')[0].trim() : '');
              
              const badgeInfo = getAgeRatingBadge(book.ageRating);
              
              return (
                <div 
                  key={book.id} 
                  onClick={() => setSelectedBook(book)}
                  style={{ 
                    background: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    cursor: 'pointer', 
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Capa com Efeito Desfocado ao Fundo para Evitar Cortes */}
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
                  
                  {/* Bookmark ribbon */}
                  {progress && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px', 
                      background: 'rgba(212, 175, 55, 0.9)', 
                      color: '#000', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      zIndex: 2
                    }}>
                      <Bookmark size={10} /> {progress}
                    </div>
                  )}

                  {/* Informações */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                        por {author?.name || 'Desconhecido'}
                      </p>
                      
                      {/* Avaliação Estrelas no Card */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                        <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>⭐ {avg}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({count})</span>
                      </div>
                    </div>

                    {/* Tags de Gênero e Classificação */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Classificação Indicativa */}
                      <span style={{ 
                        display: 'inline-block',
                        width: '20px',
                        height: '20px',
                        lineHeight: '18px',
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        boxSizing: 'border-box',
                        background: badgeInfo.bg,
                        color: badgeInfo.color,
                        border: badgeInfo.border
                      }}>
                        {badgeInfo.text}
                      </span>

                      {/* Gênero Principal */}
                      {primaryGenre && (
                        <span style={{ 
                          fontSize: '0.7rem',
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-muted)',
                          padding: '0.1rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          {primaryGenre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {/* Netflix-style Overlaid Quick-View Popover */}
      {activeBook && (
        <div className="reader-popover" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          
          <div style={{ 
            background: 'var(--card-bg)', 
            borderRadius: '16px', 
            width: '850px', 
            maxWidth: '95%', 
            border: '1px solid var(--border-color)', 
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
            maxHeight: '85vh'
          }}>
            
            {/* Fechar Button */}
            <button 
              onClick={() => setSelectedBook(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              <X size={20} />
            </button>

            {/* Left Column: Cover Preview */}
            <div style={{ width: '320px', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', overflow: 'hidden' }}>
              {activeBook.cover ? (
                <>
                  <img 
                    src={activeBook.cover} 
                    alt="" 
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      filter: 'blur(15px)', 
                      opacity: 0.3, 
                      zIndex: 0 
                    }} 
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, transparent 50%, var(--card-bg) 100%)', zIndex: 1 }} />
                  <img 
                    src={activeBook.cover} 
                    alt={activeBook.title} 
                    style={{ 
                      width: '88%', 
                      height: '88%', 
                      objectFit: 'contain', 
                      zIndex: 2,
                      filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.7))'
                    }} 
                  />
                </>
              ) : (
                <BookOpen size={64} color="rgba(255,255,255,0.1)" />
              )}
            </div>

            {/* Right Column: Info & Actions */}
            <div style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
              
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>{activeBook.title}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.8rem' }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--accent-gold)' }}>
                    Escrito por: <strong>{db.users.find(u => u.id === activeBook.authorId)?.name || 'Autor Desconhecido'}</strong>
                  </p>
                  {activeBook.coAuthorId && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Coautor: <strong>{coAuthorObj?.name || activeBook.coAuthorId}</strong>
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                  {/* Gêneros e Classificação */}
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ 
                      background: getAgeRatingBadge(activeBook.ageRating).bg,
                      color: getAgeRatingBadge(activeBook.ageRating).color,
                      border: getAgeRatingBadge(activeBook.ageRating).border,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      Classificação: {getAgeRatingBadge(activeBook.ageRating).text === 'L' ? 'Livre' : `${getAgeRatingBadge(activeBook.ageRating).text}+`}
                    </span>
                    
                    {(activeBook.category || activeBook.genres) && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Gêneros: {activeBook.category || activeBook.genres.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Média de Avaliação */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 'bold' }}>
                      ⭐ {(activeBook.ratings || []).length > 0 
                        ? (activeBook.ratings.reduce((sum, r) => sum + r.stars, 0) / activeBook.ratings.length).toFixed(1)
                        : '0.0'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                    <a 
                      href="#reviews-section" 
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('reviews-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{ color: 'var(--accent-gold)', textDecoration: 'underline', cursor: 'pointer', fontWeight: '500' }}
                    >
                      {(activeBook.ratings || []).length === 1 ? '1 avaliação' : `${(activeBook.ratings || []).length} avaliações`}
                    </a>
                  </div>
                </div>
              </div>

              {/* Marca-páginas / Progresso de leitura */}
              {getBookmarkProgress(activeBook.id) && (
                <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '0.8rem 1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <Bookmark size={20} color="var(--accent-gold)" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Você parou a leitura em: <strong>{getBookmarkProgress(activeBook.id)}</strong>
                  </span>
                </div>
              )}

              {/* Sinopse */}
              <div>
                <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>SINOPSE</h4>
                <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {activeBook.synopsis || 'Nenhuma sinopse cadastrada para este livro.'}
                </p>
              </div>

              {/* Botões de Ação */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                
                {/* Ler agora */}
                <button 
                  onClick={() => {
                    onSelectBook(activeBook.id);
                    setSelectedBook(null);
                  }}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.8rem', fontSize: '1rem' }}
                >
                  <Play size={16} fill="currentColor" /> {getBookmarkProgress(activeBook.id) ? 'Continuar Leitura' : 'Ler Agora'}
                </button>

                {/* Explorar Universo */}
                <button 
                  onClick={() => {
                    const visibility = activeBook.universeVisibility;
                    const hasVisibleAreas = visibility && typeof visibility === 'object' && Object.values(visibility).some(v => v === true);
                    
                    if (activeBook.bookType === 'short_story' || !hasVisibleAreas) {
                      setBookForRequest(activeBook);
                      setShowRequestModal(true);
                    } else {
                      onSelectBookUniverse(activeBook.id);
                      setSelectedBook(null);
                    }
                  }}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '0.95rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
                >
                  <Map size={16} /> Explorar Universo
                </button>

                {/* Favoritar */}
                <button 
                  onClick={() => handleToggleFavorite(activeBook.id)}
                  style={{ 
                    background: 'none', 
                    border: '1px solid var(--border-color)', 
                    color: favorites.includes(activeBook.id) ? '#ff4d4d' : 'var(--text-main)', 
                    cursor: 'pointer', 
                    borderRadius: '8px',
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s'
                  }}
                  title={favorites.includes(activeBook.id) ? 'Remover da minha lista' : 'Adicionar à minha lista'}
                >
                  <Heart size={20} fill={favorites.includes(activeBook.id) ? 'currentColor' : 'none'} />
                </button>

                {/* Marcar como lido */}
                <div style={{ display: 'flex', gap: '0.3rem', marginLeft: 'auto' }}>
                  {readingStatus[activeBook.id] === 'read' ? (
                    <button 
                      onClick={() => handleUpdateStatus(activeBook.id, 'reading')}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem', borderColor: '#4CAF50', color: '#4CAF50' }}
                    >
                      <CheckCircle size={12} fill="currentColor" style={{ marginRight: '0.3rem' }} /> Lido (Desfazer)
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpdateStatus(activeBook.id, 'read')}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}
                    >
                      Marcar como Lido
                    </button>
                  )}
                </div>

              </div>

              {/* Seção de Avaliações */}
              <div id="reviews-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', fontSize: '1.2rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={18} fill="var(--accent-gold)" color="var(--accent-gold)" /> Avaliações & Recomendações
                </h3>

                {/* Formulário para avaliar */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>Sua nota para esta obra:</h4>
                  <div style={{ display: 'flex', gap: '0.4rem', margin: '0.5rem 0' }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (hoverStars || ratingStars);
                      return (
                        <Star
                          key={star}
                          size={24}
                          color="var(--accent-gold)"
                          fill={isFilled ? "var(--accent-gold)" : "none"}
                          style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                          onMouseEnter={() => setHoverStars(star)}
                          onMouseLeave={() => setHoverStars(0)}
                          onClick={() => setRatingStars(star)}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Campo de comentário de 250 caracteres */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Comentário curto (máx. 250 caracteres)</span>
                      <span style={{ color: ratingComment.length > 250 ? '#ff4444' : 'var(--text-muted)' }}>
                        {ratingComment.length}/250
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <textarea
                        placeholder="Deixe sua avaliação sobre a obra..."
                        maxLength={250}
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        className="form-input"
                        style={{ flex: 1, padding: '0.8rem', background: '#1b1d22', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
                      />
                      <button 
                        onClick={handleSaveReview}
                        disabled={ratingStars === 0}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', whiteSpace: 'nowrap', opacity: ratingStars === 0 ? 0.5 : 1 }}
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de avaliações de outros leitores */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>O que outros leitores acharam:</h4>
                  {(activeBook.ratings || []).length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                      Nenhuma avaliação ainda. Seja o primeiro a avaliar!
                    </p>
                  ) : (
                    (activeBook.ratings || []).map((rating, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'rgba(255,255,255,0.01)', 
                          border: '1px solid rgba(255,255,255,0.03)', 
                          borderRadius: '8px', 
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{rating.userName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rating.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ display: 'flex', color: 'var(--accent-gold)' }}>
                            {Array.from({ length: rating.stars }).map((_, i) => (
                              <Star key={i} size={14} fill="var(--accent-gold)" color="var(--accent-gold)" style={{ marginRight: '1px' }} />
                            ))}
                            {Array.from({ length: 5 - rating.stars }).map((_, i) => (
                              <Star key={i} size={14} fill="none" color="var(--accent-gold)" style={{ marginRight: '1px' }} />
                            ))}
                          </span>
                          {rating.comment && (
                            <span style={{ 
                              background: 'rgba(212,175,55,0.08)', 
                              border: '1px solid rgba(212,175,55,0.2)', 
                              padding: '0.15rem 0.5rem', 
                              borderRadius: '4px', 
                              color: 'var(--accent-gold)', 
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}>
                              {rating.comment}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

        {/* Seção Meu Dossiê */}
        {activeTab === 'dossie' && (
          <div style={{ padding: 0 }}>
            {renderDossier()}
          </div>
        )}

        {/* Seção Conquistas */}
        {activeTab === 'conquistas' && (
          <div style={{ padding: 0 }}>
            {renderConquistas()}
          </div>
        )}

      </div>

      {/* Modal de Pedido de Universo */}
      {showRequestModal && bookForRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--accent-gold)', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '100%', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <button 
              onClick={() => { setShowRequestModal(false); setRequestForm({ features: [], message: '' }); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', marginTop: 0, marginBottom: '0.5rem' }}>
              Universo Não Disponível
            </h2>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              O autor de <strong>{bookForRequest.title}</strong> ainda não publicou áreas do Universo Expandido para esta obra. Gostaria de incentivá-lo a criar?
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quais áreas você mais gostaria de explorar?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { id: 'characters', label: 'Personagens' },
                  { id: 'locations', label: 'Locais' },
                  { id: 'organizations', label: 'Organizações' },
                  { id: 'clues', label: 'Complementos' },
                  { id: 'events', label: 'Eventos' }
                ].map(opt => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', background: 'rgba(212,175,55,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px', border: `1px solid ${requestForm.features.includes(opt.id) ? 'var(--accent-gold)' : 'transparent'}`, color: requestForm.features.includes(opt.id) ? 'var(--accent-gold)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox"
                      checked={requestForm.features.includes(opt.id)}
                      onChange={(e) => {
                        const newFeatures = e.target.checked 
                          ? [...requestForm.features, opt.id]
                          : requestForm.features.filter(f => f !== opt.id);
                        setRequestForm({ ...requestForm, features: newFeatures });
                      }}
                      style={{ display: 'none' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mensagem de incentivo (opcional)</label>
              <textarea 
                value={requestForm.message}
                onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                placeholder="Ex: Estou adorando a história! Gostaria muito de saber mais sobre..."
                maxLength={200}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px', resize: 'vertical', minHeight: '80px', fontSize: '0.9rem' }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {requestForm.message.length}/200
              </div>
            </div>

            <button 
              onClick={handleSendRequest}
              className="btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              Enviar Pedido ao Autor
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
