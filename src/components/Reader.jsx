import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronLeft, ChevronRight, Moon, Sun, ArrowLeft, ZoomIn, ZoomOut, Lock } from 'lucide-react';

export default function Reader({ db, bookId, currentUser, onUpdateData, onClose }) {
  const book = db?.books?.find(b => b.id === bookId);
  const data = book?.universe || {};
  const rawChapters = data?.chapters || [];

  // Helper date formatting
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}/${mm}/${yyyy}`;
  };

  const todayStr = formatDate(new Date());

  const isChapterLocked = (ch) => {
    return !ch.isVirtual && ch.publishDate && ch.publishDate > todayStr;
  };

  // Virtual chapters creation
  const bookAuthor = db?.users?.find(u => u.id === book?.authorId);
  const virtualChapters = [
    {
      isVirtual: true,
      virtualType: 'cover',
      title: 'Capa',
      pages: [
        {
          subtheme: 'Capa Oficial',
          text: `
            <div style="text-align: center; padding: 2rem 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
              <h1 style="font-family: 'Playfair Display', serif; font-size: 3rem; color: var(--accent-gold); margin-bottom: 2rem;">${book?.title || 'Sem título'}</h1>
              ${book?.cover ? `<img src="${book.cover}" alt="Capa" style="max-height: 380px; max-width: 100%; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); margin-bottom: 2rem; object-fit: contain;"/>` : '<div style="margin-bottom: 2rem; opacity: 0.1;"><svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10M6 10h10"></svg></div>'}
              <p style="font-size: 1.2rem; font-style: italic; opacity: 0.8; margin-top: 1rem;">por ${bookAuthor ? bookAuthor.name : 'Autor Desconhecido'}</p>
            </div>
          `,
          image: book?.cover
        }
      ]
    },
    {
      isVirtual: true,
      virtualType: 'author',
      title: 'Sobre o Autor',
      pages: [
        {
          subtheme: 'Sobre o Autor',
          text: `
            <div style="padding: 1rem 0;">
              <div style="display: flex; gap: 2rem; align-items: center; margin-bottom: 2rem; flex-wrap: wrap;">
                <div style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; border: 3px solid var(--accent-gold); flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);">
                  ${bookAuthor?.avatar ? `<img src="${bookAuthor.avatar}" alt="${bookAuthor.name}" style="width:100%; height:100%; object-fit:cover;"/>` : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'}
                </div>
                <div>
                  <h2 style="font-family: 'Playfair Display', serif; margin: 0; color: var(--accent-gold); font-size: 1.8rem;">${bookAuthor?.name || 'Autor Desconhecido'}</h2>
                  <p style="font-size: 0.9rem; opacity: 0.7; margin: 0.4rem 0 0 0;"><strong>Origem:</strong> ${bookAuthor?.location || 'Não informada'}</p>
                  ${bookAuthor?.writingStyle ? `<p style="font-size: 0.9rem; opacity: 0.7; margin: 0.2rem 0 0 0;"><strong>Estilo:</strong> ${bookAuthor.writingStyle}</p>` : ''}
                </div>
              </div>
              <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-top: 1.5rem;">Biografia</h3>
              <p style="line-height: 1.8; font-size: 1rem; white-space: pre-line;">${bookAuthor?.bio || 'O autor ainda não cadastrou sua biografia.'}</p>
            </div>
          `,
          image: bookAuthor?.avatar
        }
      ]
    },
    {
      isVirtual: true,
      virtualType: 'synopsis',
      title: 'Sinopse',
      pages: [
        {
          subtheme: 'Sinopse',
          text: `
            <div style="padding: 1rem 0;">
              <h2 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">Sinopse da Obra</h2>
              <p style="line-height: 1.9; font-size: 1.1rem; font-style: italic; white-space: pre-line;">${book?.synopsis || 'Sem sinopse cadastrada.'}</p>
            </div>
          `,
          image: book?.cover
        }
      ]
    }
  ];

  const chapters = [...virtualChapters, ...rawChapters];

  // Resuming Bookmark reading position
  const savedPos = currentUser?.readingPositions?.[bookId];
  const initialChapterIdx = savedPos && savedPos.chapterIdx < chapters.length && !isChapterLocked(chapters[savedPos.chapterIdx])
    ? savedPos.chapterIdx 
    : 0;
  const initialSubthemeIdx = savedPos ? savedPos.subthemeIdx : 0;
  const initialColumnIdx = savedPos ? savedPos.columnIdx : 0;

  const [theme, setTheme] = useState('dark');
  const [activeChapterIdx, setActiveChapterIdx] = useState(initialChapterIdx);
  const [activeSubthemeIdx, setActiveSubthemeIdx] = useState(initialSubthemeIdx);
  const [activeColumnIdx, setActiveColumnIdx] = useState(initialColumnIdx);
  const [totalColumns, setTotalColumns] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [zoom, setZoom] = useState(100);
  const [pageInput, setPageInput] = useState('1');
  const [expandedChapters, setExpandedChapters] = useState([0, 1, 2, 3]); // Expand virtual pages and first chapter by default
  const [globalPageCounts, setGlobalPageCounts] = useState([]);
  const [totalBookPages, setTotalBookPages] = useState(1);

  const textContainerRef = useRef(null);
  const measurerRefs = useRef({});

  // Flatten all subthemes for global pagination (excluding locked chapters)
  const allSubthemes = chapters.reduce((acc, ch, cIdx) => {
    if (isChapterLocked(ch)) return acc;
    (ch.pages || []).forEach((p, pIdx) => {
      acc.push({ chIdx: cIdx, subIdx: pIdx, text: p.text, subtheme: p.subtheme });
    });
    return acc;
  }, []);

  // When chapter changes, reset subtheme and page
  useEffect(() => {
    setActiveSubthemeIdx(initialChapterIdx === activeChapterIdx ? initialSubthemeIdx : 0);
    setActiveColumnIdx(initialChapterIdx === activeChapterIdx ? initialColumnIdx : 0);
    if (!expandedChapters.includes(activeChapterIdx)) {
      setExpandedChapters(prev => [...prev, activeChapterIdx]);
    }
  }, [activeChapterIdx]);

  // Save Bookmark on change
  useEffect(() => {
    if (!currentUser || !bookId || !onUpdateData || !db) return;

    const currentSaved = currentUser.readingPositions?.[bookId] || {};
    if (
      currentSaved.chapterIdx === activeChapterIdx &&
      currentSaved.subthemeIdx === activeSubthemeIdx &&
      currentSaved.columnIdx === activeColumnIdx
    ) {
      return; // No change
    }

    const updatedPositions = {
      ...(currentUser.readingPositions || {}),
      [bookId]: {
        chapterIdx: activeChapterIdx,
        subthemeIdx: activeSubthemeIdx,
        columnIdx: activeColumnIdx,
        updatedAt: Date.now()
      }
    };

    const readingStatus = currentUser.readingStatus || {};
    const updatedStatus = { ...readingStatus };
    if (readingStatus[bookId] !== 'read') {
      updatedStatus[bookId] = 'reading';
    }

    const updatedUser = {
      ...currentUser,
      readingPositions: updatedPositions,
      readingStatus: updatedStatus
    };

    const newDb = { ...db };
    newDb.users = newDb.users.map(u => u.id === currentUser.id ? updatedUser : u);
    onUpdateData(newDb);
  }, [activeChapterIdx, activeSubthemeIdx, activeColumnIdx]);

  // Measure columns and global pages
  useEffect(() => {
    const calculateAll = () => {
      const counts = [];
      let total = 0;
      allSubthemes.forEach((sub, i) => {
        const el = measurerRefs.current[i];
        if (el) {
          const gap = 32; // 2rem
          const cols = Math.round((el.scrollWidth + gap) / (el.clientWidth + gap));
          counts[i] = Math.max(1, cols);
          total += Math.max(1, cols);
        }
      });
      setGlobalPageCounts(counts);
      setTotalBookPages(Math.max(1, total));

      if (textContainerRef.current) {
        const container = textContainerRef.current;
        const gap = 32; // 2rem
        const cols = Math.round((container.scrollWidth + gap) / (container.clientWidth + gap));
        const finalCols = Math.max(1, cols);
        setTotalColumns(finalCols);
        if (activeColumnIdx >= finalCols) setActiveColumnIdx(finalCols - 1);
      }
    };
    
    setTimeout(calculateAll, 150);
    window.addEventListener('resize', calculateAll);
    return () => window.removeEventListener('resize', calculateAll);
  }, [chapters, activeChapterIdx, activeSubthemeIdx, zoom]);

  // Calculate global page number
  const getCurrentGlobalPage = () => {
    let pagesBefore = 0;
    for (let i = 0; i < allSubthemes.length; i++) {
      const sub = allSubthemes[i];
      if (sub.chIdx === activeChapterIdx && sub.subIdx === activeSubthemeIdx) {
        break;
      }
      pagesBefore += (globalPageCounts[i] || 1);
    }
    return pagesBefore + activeColumnIdx + 1;
  };

  useEffect(() => {
    setPageInput(getCurrentGlobalPage().toString());
  }, [activeColumnIdx, activeChapterIdx, activeSubthemeIdx, globalPageCounts]);

  const chapter = chapters[activeChapterIdx];
  const subthemeObj = chapter?.pages?.[activeSubthemeIdx];

  const handleNextPage = () => {
    if (activeColumnIdx < totalColumns - 1) {
      setActiveColumnIdx(activeColumnIdx + 1);
    } else if (chapter && activeSubthemeIdx < chapter.pages.length - 1) {
      setActiveSubthemeIdx(activeSubthemeIdx + 1);
      setActiveColumnIdx(0);
    } else if (activeChapterIdx < chapters.length - 1) {
      const nextCh = chapters[activeChapterIdx + 1];
      if (isChapterLocked(nextCh)) {
        alert(`O próximo capítulo estará disponível em ${formatDateDisplay(nextCh.publishDate)}!`);
        return;
      }
      setActiveChapterIdx(activeChapterIdx + 1);
    }
  };

  const handlePrevPage = () => {
    if (activeColumnIdx > 0) {
      setActiveColumnIdx(activeColumnIdx - 1);
    } else if (activeSubthemeIdx > 0) {
      const newSubIdx = activeSubthemeIdx - 1;
      setActiveSubthemeIdx(newSubIdx);
      setActiveColumnIdx(9999); // will be clamped
    } else if (activeChapterIdx > 0) {
      const prevChIdx = activeChapterIdx - 1;
      setActiveChapterIdx(prevChIdx);
      const prevCh = chapters[prevChIdx];
      setActiveSubthemeIdx(prevCh.pages ? prevCh.pages.length - 1 : 0);
      setActiveColumnIdx(9999);
    }
  };

  const navigateToGlobalPage = (targetPage) => {
    let accumulated = 0;
    for (let i = 0; i < allSubthemes.length; i++) {
      const sub = allSubthemes[i];
      const subPages = globalPageCounts[i] || 1;
      
      if (accumulated + subPages >= targetPage) {
        setActiveChapterIdx(sub.chIdx);
        setActiveSubthemeIdx(sub.subIdx);
        setActiveColumnIdx(targetPage - accumulated - 1);
        return;
      }
      accumulated += subPages;
    }
    if (allSubthemes.length > 0) {
      const lastSub = allSubthemes[allSubthemes.length - 1];
      setActiveChapterIdx(lastSub.chIdx);
      setActiveSubthemeIdx(lastSub.subIdx);
      setActiveColumnIdx((globalPageCounts[globalPageCounts.length - 1] || 1) - 1);
    }
  };

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(pageInput);
    if (!isNaN(val) && val >= 1 && val <= totalBookPages) {
      navigateToGlobalPage(val);
    } else {
      setPageInput(getCurrentGlobalPage().toString());
    }
  };

  const toggleChapter = (idx) => {
    if (expandedChapters.includes(idx)) {
      setExpandedChapters(expandedChapters.filter(i => i !== idx));
    } else {
      setExpandedChapters([...expandedChapters, idx]);
    }
  };

  const getGroupedSubthemes = (pages) => {
    if (!pages) return [];
    const groups = [];
    pages.forEach((p, pIdx) => {
      const name = p.subtheme ? p.subtheme.trim() : `Trecho ${pIdx + 1}`;
      if (groups.length === 0 || groups[groups.length - 1].name !== name) {
        groups.push({ name, startIdx: pIdx });
      }
    });
    return groups;
  };

  const colors = {
    dark: { bg: '#121212', text: '#e0e0e0', panelBg: '#1e1e1e', border: '#333', gold: '#d4af37' },
    light: { bg: '#fdfcf0', text: '#2d2d2d', panelBg: '#f4f2e6', border: '#e0ddd0', gold: '#b8942b' }
  };
  const themeColors = colors[theme];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      backgroundColor: themeColors.bg, color: themeColors.text,
      fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Navbar */}
      <div style={{
        height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem', borderBottom: `1px solid ${themeColors.border}`, backgroundColor: themeColors.panelBg, flexShrink: 0
      }}>
        {/* Left Side: Back Button & Book Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '280px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: themeColors.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          
          <button className="mobile-only" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: themeColors.text, cursor: 'pointer', display: 'none' }}>
            <Menu size={24} />
          </button>

          <div style={{ fontWeight: '600', fontSize: '1.3rem', fontFamily: "'Playfair Display', serif", color: themeColors.gold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {book?.title || 'Leitura'}
          </div>
        </div>

        {/* Center: Current Chapter Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '2rem' }}>
          {chapter && (
            <>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: themeColors.text }}>
                {chapter.isVirtual ? chapter.title : `Capítulo ${String(activeChapterIdx - 2).padStart(2, '0')}`}
              </div>
              <div style={{ fontSize: '0.9rem', color: themeColors.text, opacity: 0.7 }}>
                {!chapter.isVirtual && chapter.title} {subthemeObj?.subtheme && !chapter.isVirtual ? `- ${subthemeObj.subtheme}` : ''}
              </div>
            </>
          )}
        </div>

        {/* Right Side: Zoom and Theme Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '320px', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={() => setZoom(Math.max(50, zoom - 10))} title="Reduzir Letra" style={{ background: 'transparent', border: `1px solid ${themeColors.border}`, color: themeColors.text, padding: '0.2rem', borderRadius: '4px', cursor: 'pointer' }}>
            <ZoomOut size={18} />
          </button>
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} title="Aumentar Letra" style={{ background: 'transparent', border: `1px solid ${themeColors.border}`, color: themeColors.text, padding: '0.2rem', borderRadius: '4px', cursor: 'pointer' }}>
            <ZoomIn size={18} />
          </button>
          <div style={{ width: '1px', height: '20px', background: themeColors.border, margin: '0 0.5rem' }}></div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ background: 'none', border: 'none', color: themeColors.text, cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Left Column: Chapters & Subthemes */}
        <div className={`reader-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{
          width: '280px', backgroundColor: themeColors.panelBg, borderRight: `1px solid ${themeColors.border}`,
          overflowY: 'auto', padding: '1.5rem 0',
          display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: themeColors.text, opacity: 0.5, margin: 0, fontWeight: 'bold' }}>ÍNDICE</h3>
            <button className="mobile-only" onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: themeColors.text, cursor: 'pointer', display: 'none' }}>
              <X size={20} />
            </button>
          </div>
          
          {chapters.length === 0 ? (
            <p style={{ opacity: 0.5, fontSize: '0.9rem', padding: '0 1.5rem' }}>Nenhum capítulo disponível.</p>
          ) : (
            chapters.map((ch, idx) => {
              const groupedSubthemes = getGroupedSubthemes(ch.pages);
              const isExpanded = expandedChapters.includes(idx);
              const isActiveChapter = idx === activeChapterIdx;
              const locked = isChapterLocked(ch);

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.25rem' }}>
                  {/* Chapter Header */}
                  <div 
                    onClick={() => { 
                      if (locked) {
                        alert(`Este capítulo estará disponível em ${formatDateDisplay(ch.publishDate)}!`);
                        return;
                      }
                      toggleChapter(idx); 
                      if (!isExpanded || isActiveChapter) { 
                        setActiveChapterIdx(idx); 
                        setIsSidebarOpen(false); 
                      } 
                    }}
                    style={{
                      padding: '0.8rem 1.5rem', 
                      cursor: locked ? 'not-allowed' : 'pointer',
                      backgroundColor: isActiveChapter ? themeColors.gold : 'transparent',
                      color: isActiveChapter ? '#000' : themeColors.text,
                      opacity: locked ? 0.4 : 1,
                      fontWeight: isActiveChapter ? '600' : '400',
                      transition: 'background 0.2s',
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {ch.isVirtual ? ch.title : `Cap. ${String(idx - 2).padStart(2, '0')} - ${ch.title || 'Sem título'}`}
                    </span>
                    {locked && (
                      <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', color: themeColors.gold, fontWeight: 'bold' }}>
                        <Lock size={12} /> {formatDateDisplay(ch.publishDate)}
                      </span>
                    )}
                  </div>
                  
                  {/* Subthemes Accordion */}
                  {!locked && isExpanded && groupedSubthemes.length > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '0.5rem 0' }}>
                      {groupedSubthemes.map((sub, sIdx) => {
                        const nextSub = groupedSubthemes[sIdx + 1];
                        const isActiveSub = isActiveChapter && activeSubthemeIdx >= sub.startIdx && (!nextSub || activeSubthemeIdx < nextSub.startIdx);
                        return (
                          <div 
                            key={sIdx}
                            onClick={() => { setActiveChapterIdx(idx); setActiveSubthemeIdx(sub.startIdx); setActiveColumnIdx(0); setIsSidebarOpen(false); }}
                            style={{
                              padding: '0.5rem 1.5rem 0.5rem 3rem', cursor: 'pointer',
                              fontSize: '0.95rem', opacity: isActiveSub ? 1 : 0.6,
                              color: isActiveSub ? themeColors.gold : themeColors.text,
                              fontWeight: isActiveSub ? '500' : '400'
                            }}
                          >
                            {sub.name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Center Column: Reading Area with CSS Columns */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          overflow: 'hidden', position: 'relative'
        }}>
          <div style={{ flex: 1, width: '100%', maxWidth: '800px', display: 'flex', overflow: 'hidden', padding: '2rem 1rem', position: 'relative' }}>
            
            {/* The Sliding Container */}
            <div 
              ref={textContainerRef}
              style={{
                height: '100%',
                width: '100%',
                columnWidth: '100vw',
                columnGap: '2rem',
                transform: `translateX(calc(${activeColumnIdx} * -100% - ${activeColumnIdx} * 2rem))`,
                transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                fontSize: `${zoom}%`,
                lineHeight: '1.9',
                fontFamily: "'Merriweather', 'Georgia', serif",
                textAlign: 'justify'
              }}
            >
              {subthemeObj ? (
                <div>
                  {activeSubthemeIdx === 0 && !chapter.isVirtual && (
                    <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
                      <div style={{ color: themeColors.gold, marginBottom: '1.5rem', fontSize: '1.5rem', fontFamily: "'Playfair Display', serif" }}>❦</div>
                      <div style={{ textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.85rem', opacity: 0.6, marginBottom: '1rem', color: themeColors.gold }}>
                        CAPÍTULO {String(activeChapterIdx - 2).padStart(2, '0')}
                      </div>
                      <h1 style={{ fontFamily: "'Playfair Display', serif", color: themeColors.gold, fontSize: '3.5rem', margin: 0, fontWeight: 'normal' }}>
                        {chapter?.title}
                      </h1>
                    </div>
                  )}
                  
                  {subthemeObj.subtheme && !chapter.isVirtual && (activeSubthemeIdx === 0 || chapter?.pages?.[activeSubthemeIdx - 1]?.subtheme !== subthemeObj.subtheme) && (
                    <h2 style={{ 
                       fontFamily: "'Playfair Display', serif", 
                       color: themeColors.gold, 
                       marginBottom: '2rem', 
                       marginTop: activeSubthemeIdx === 0 ? '0' : '2rem',
                       fontSize: activeSubthemeIdx === 0 ? '1.8rem' : '2.2rem',
                       textTransform: activeSubthemeIdx === 0 ? 'uppercase' : 'none'
                    }}>
                      {subthemeObj.subtheme}
                    </h2>
                  )}
                  
                  <div className="reader-body" dangerouslySetInnerHTML={{ __html: (subthemeObj.text || '').replace(/(<p>(\s|&nbsp;|<br\/?\s*>)*<\/p>)+$/, '') }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.5, fontSize: '1.2rem' }}>
                  O livro ainda não começou a ser escrito.
                </div>
              )}
            </div>

            {/* Hidden measurers for global pagination */}
            <div style={{ position: 'absolute', top: '2rem', bottom: '2rem', left: '1rem', right: '1rem', visibility: 'hidden', pointerEvents: 'none' }}>
              {allSubthemes.map((sub, i) => {
                const isFirstSub = sub.subIdx === 0;
                const chapterObj = chapters[sub.chIdx];
                return (
                  <div 
                    key={i} 
                    ref={el => measurerRefs.current[i] = el}
                    style={{
                      height: '100%',
                      width: '100%',
                      columnWidth: '100vw',
                      columnGap: '2rem',
                      fontSize: `${zoom}%`,
                      lineHeight: '1.9',
                      fontFamily: "'Merriweather', 'Georgia', serif",
                      textAlign: 'justify',
                      position: 'absolute', top: 0, left: 0
                    }}
                  >
                    {isFirstSub && !chapterObj?.isVirtual && (
                      <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
                        <div style={{ color: themeColors.gold, marginBottom: '1.5rem', fontSize: '1.5rem', fontFamily: "'Playfair Display', serif" }}>❦</div>
                        <div style={{ textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.85rem', opacity: 0.6, marginBottom: '1rem', color: themeColors.gold }}>
                          CAPÍTULO {String(sub.chIdx - 2).padStart(2, '0')}
                        </div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", color: themeColors.gold, fontSize: '3.5rem', margin: 0, fontWeight: 'normal' }}>
                          {chapterObj?.title}
                        </h1>
                      </div>
                    )}
                    {sub.subtheme && !chapterObj?.isVirtual && (isFirstSub || chapters[sub.chIdx]?.pages?.[sub.subIdx - 1]?.subtheme !== sub.subtheme) && (
                      <h2 style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        color: themeColors.gold, 
                        marginBottom: '2rem', 
                        marginTop: isFirstSub ? '0' : '2rem',
                        fontSize: isFirstSub ? '1.8rem' : '2.2rem',
                        textTransform: isFirstSub ? 'uppercase' : 'none'
                      }}>
                        {sub.subtheme}
                      </h2>
                    )}
                    <div className="reader-body" dangerouslySetInnerHTML={{ __html: (sub.text || '').replace(/(<p>(\s|&nbsp;|<br\/?\s*>)*<\/p>)+$/, '') }} />
                  </div>
                );
              })}
            </div>

          </div>

          {/* Pagination Controls */}
          {chapters.length > 0 && (
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '800px', 
              padding: '1.5rem 2rem', borderTop: `1px solid ${themeColors.border}`
            }}>
              <button onClick={handlePrevPage} disabled={activeChapterIdx === 0 && activeSubthemeIdx === 0 && activeColumnIdx === 0} 
                style={{ background: 'transparent', color: themeColors.text, border: `1px solid ${themeColors.border}`, padding: '0.6rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (activeChapterIdx === 0 && activeSubthemeIdx === 0 && activeColumnIdx === 0) ? 0.3 : 1, fontWeight: '500' }}>
                <ChevronLeft size={18} /> Ant.
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                <span>Página</span>
                <form onSubmit={handlePageSubmit}>
                  <input 
                    type="text" 
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageSubmit}
                    style={{
                      width: '50px', textAlign: 'center', background: 'transparent', 
                      color: themeColors.text, border: `1px solid ${themeColors.border}`, 
                      borderRadius: '4px', padding: '0.3rem'
                    }}
                  />
                </form>
                <span>/ {totalBookPages}</span>
              </div>

              <button onClick={handleNextPage} disabled={activeChapterIdx === chapters.length - 1 && activeSubthemeIdx === (chapters[chapters.length - 1]?.pages?.length || 1) - 1 && activeColumnIdx === totalColumns - 1} 
                style={{ background: 'transparent', color: themeColors.text, border: `1px solid ${themeColors.border}`, padding: '0.6rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (activeChapterIdx === chapters.length - 1 && activeSubthemeIdx === (chapters[chapters.length - 1]?.pages?.length || 1) - 1 && activeColumnIdx === totalColumns - 1) ? 0.3 : 1, fontWeight: '500' }}>
                Próx. <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Illustration */}
        <div className="reader-illustration" style={{
          width: '320px', backgroundColor: themeColors.panelBg, borderLeft: `1px solid ${themeColors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
          flexShrink: 0
        }}>
          {subthemeObj?.image ? (
            <img src={subthemeObj.image} alt="Cena" style={{ width: '100%', maxHeight: '80%', objectFit: 'contain', borderRadius: '8px', boxShadow: theme === 'light' ? '0 10px 30px rgba(0,0,0,0.1)' : '0 10px 30px rgba(0,0,0,0.5)' }} />
          ) : (
            <div style={{ opacity: 0.2, textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem' }}>
              Nenhuma imagem<br/>para esta cena
            </div>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .reader-illustration { display: none !important; }
          .reader-sidebar { position: absolute; z-index: 10; height: 100%; transform: translateX(-100%); transition: transform 0.3s ease; box-shadow: 5px 0 15px rgba(0,0,0,0.5); }
          .reader-sidebar.open { transform: translateX(0); }
          .mobile-only { display: flex !important; }
        }
        .reader-body p { margin-bottom: 1.5rem; }
        .reader-body p:last-child { margin-bottom: 0; }
        .reader-body blockquote {
          border-left: 3px solid ${themeColors.gold};
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          opacity: 0.8;
        }
        .reader-body > p:first-of-type::first-letter {
          font-size: 3.5em;
          float: left;
          line-height: 0.8;
          padding-right: 0.15rem;
          color: ${themeColors.gold};
          font-family: 'Playfair Display', serif;
          font-weight: bold;
        }
      `}} />
    </div>
  );
}
