import { toast } from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronLeft, ChevronRight, Moon, Sun, ArrowLeft, ZoomIn, ZoomOut, Lock, MessageSquare, Heart, Send, Gift, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import ShopModal from './ShopModal';
import { processGamificationEvent } from '../utils/gamificationEngine';

const cleanChapterTitle = (title) => {
  if (!title) return '';
  return title.replace(/^(capítulo|cap\.|cap)\s*\d+\s*[-:]\s*/i, '').trim();
};

export default function Reader({ db, bookId, currentUser, onUpdateData, onClose }) {
  const [theme, setTheme] = useState('dark');
  const colors = {
    dark: { bg: '#121212', text: '#e0e0e0', panelBg: '#1e1e1e', border: '#333', gold: '#d4af37' },
    light: { bg: '#fdfcf0', text: '#2d2d2d', panelBg: '#f4f2e6', border: '#e0ddd0', gold: '#b8942b' }
  };
  const themeColors = colors[theme];

  const nonChapterTypes = ['prologue', 'preface', 'index', 'dedication', 'acknowledgements', 'epilogue'];
  const book = db?.books?.find(b => b.id === bookId);
  const data = book?.universe || {};
  
  // Apenas o autor ou curador podem ler rascunhos. Leitores normais veem apenas o que não é 'draft' (ou arquivos antigos sem status).
  const isAuthorOrCurator = currentUser?.role === 'curator' || book?.authorId === currentUser?.id;
  const rawChapters = (data?.chapters || []).filter(ch => isAuthorOrCurator || ch.status !== 'draft');
  const notes = data?.notes || [];

  const preambleChapters = rawChapters.filter(ch => nonChapterTypes.includes(ch.type) || ch.isPreamble);
  const actualChapters = rawChapters.filter(ch => !nonChapterTypes.includes(ch.type) && !ch.isPreamble);

  const processedRawChapters = actualChapters.map((ch, idx) => {
    const isSpecial = ch.isVirtual || /^(?:cap|parte|pr.logo|pref.cio|introdu)/i.test(ch.title);
    const chapterNum = idx + 1;
    const headerPrefix = isSpecial ? '' : `
          <div style="text-transform: uppercase; letter-spacing: 3px; font-size: 0.9rem; opacity: 0.7; margin-bottom: 1.2rem; color: ${themeColors.gold}; font-weight: 600;">
            CAPÍTULO ${String(chapterNum).padStart(2, '0')}
          </div>`;

    const headerPage = {
      isChapterHeader: true,
      subtheme: '',
      text: `
        <div class="reader-chapter-header-page" style="text-align: center; padding: 4rem 1rem 2rem 1rem;">
          <div style="color: ${themeColors.gold}; margin-bottom: 1.5rem; font-size: 1.8rem; font-family: 'Playfair Display', serif;">❦</div>
          ${headerPrefix}
          <h1 style="font-family: 'Playfair Display', serif; color: ${themeColors.gold}; font-size: 2.6rem; margin: 0; font-weight: normal; line-height: 1.3;">
            ${cleanChapterTitle(ch.title || 'Sem título')}
          </h1>
        </div>
      `,
      image: ''
    };
    return {
      ...ch,
      pages: [headerPage, ...(ch.pages || [])]
    };
  });

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
      virtualType: 'book_info',
      title: 'O Livro',
      pages: [
        {
          subtheme: 'Capa Oficial',
          text: `
            <div class="reader-cover-page" style="text-align: center; padding: 1rem 0;">
              <h1 class="reader-cover-title" style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: ${themeColors.gold}; margin-bottom: 0.5rem;">${book?.title || 'Sem título'}</h1>
              <p class="reader-cover-subtitle" style="font-size: 1.1rem; font-style: italic; opacity: 0.8; margin-top: 0; margin-bottom: 1.5rem; color: ${themeColors.gold};">por ${bookAuthor ? (bookAuthor.displayMode === 'name' ? bookAuthor.name : (bookAuthor.nickname || bookAuthor.name)) : 'Autor Desconhecido'}</p>
              ${book?.cover ? `<img src="${book.cover}" alt="Capa" class="reader-cover-img" style="max-height: 400px; max-width: 100%; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); object-fit: contain;"/>` : '<div style="margin-bottom: 1.5rem; opacity: 0.1;"><svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10M6 10h10"></svg></div>'}
            </div>
          `,
          image: book?.cover
        },
        {
          subtheme: 'Sobre o Autor',
          text: `
            <div class="reader-author-page" style="padding: 1rem 0;">
              <div class="reader-author-header" style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem;">
                <div class="reader-author-avatar-wrapper" style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 2px solid ${themeColors.gold}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);">
                  ${bookAuthor?.avatar ? `<img src="${bookAuthor.avatar}" alt="${(bookAuthor.displayMode === 'name' ? bookAuthor.name : (bookAuthor.nickname || bookAuthor.name))}" style="width:100%; height:100%; object-fit:cover;"/>` : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${themeColors.gold}" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`}
                </div>
                <div>
                  <h2 class="reader-author-name" style="font-family: 'Playfair Display', serif; margin: 0; color: ${themeColors.gold}; font-size: 1.5rem;">${bookAuthor?.name || 'Autor Desconhecido'}</h2>
                  <p style="font-size: 0.85rem; opacity: 0.7; margin: 0.3rem 0 0 0;"><strong>Origem:</strong> ${bookAuthor?.location || 'Não informada'}</p>
                  ${bookAuthor?.writingStyle ? `<p style="font-size: 0.85rem; opacity: 0.7; margin: 0.15rem 0 0 0;"><strong>Estilo:</strong> ${bookAuthor.writingStyle}</p>` : ''}
                </div>
              </div>
              <h3 style="font-family: 'Playfair Display', serif; color: ${themeColors.gold}; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.4rem; margin-top: 1rem; font-size: 1.1rem;">Biografia</h3>
              <p class="reader-author-bio" style="line-height: 1.7; font-size: 0.95rem; white-space: pre-line;">${bookAuthor?.bio || 'O autor ainda não cadastrou sua biografia.'}</p>
            </div>
          `,
          image: bookAuthor?.avatar
        },
        {
          subtheme: 'Sinopse',
          text: `
            <div class="reader-synopsis-page" style="padding: 1rem 0;">
              <h2 class="reader-synopsis-title" style="font-family: 'Playfair Display', serif; color: ${themeColors.gold}; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; font-size: 1.6rem;">Sinopse da Obra</h2>
              <p class="reader-synopsis-text" style="line-height: 1.8; font-size: 1.05rem; font-style: italic; white-space: pre-line;">${book?.synopsis || 'Sem sinopse cadastrada.'}</p>
            </div>
          `,
          image: book?.cover
        }
      ]
    }
  ];

  preambleChapters.forEach(ch => {
    ch.pages?.forEach((p, idx) => {
      let displaySubtheme = ch.title;
      if (ch.pages.length > 1 && p.subtheme && !/^in.cio$/i.test(p.subtheme)) {
        displaySubtheme += ` - ${p.subtheme}`;
      }
      virtualChapters[0].pages.push({
        subtheme: displaySubtheme,
        text: `
          <div class="reader-preamble-page" style="padding: 1rem 0;">
            ${idx === 0 ? `<h2 style="font-family: 'Playfair Display', serif; color: ${themeColors.gold}; text-align: center; margin-bottom: 2rem; font-size: 2rem;">${ch.title}</h2>` : ''}
            <div style="line-height: 1.8; font-size: 1.05rem;">${p.text}</div>
          </div>
        `,
        image: p.image || null
      });
    });
  });

  const chapters = [...virtualChapters, ...processedRawChapters];

  // Resuming Bookmark reading position
  const savedPos = currentUser?.readingPositions?.[bookId];
  const initialChapterIdx = savedPos && savedPos.chapterIdx < chapters.length && !isChapterLocked(chapters[savedPos.chapterIdx])
    ? savedPos.chapterIdx 
    : 0;
  const initialSubthemeIdx = savedPos ? savedPos.subthemeIdx : 0;
  const initialColumnIdx = savedPos ? savedPos.columnIdx : 0;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeChapterIdx, setActiveChapterIdx] = useState(initialChapterIdx);
  const [activeSubthemeIdx, setActiveSubthemeIdx] = useState(initialSubthemeIdx);
  const [activeColumnIdx, setActiveColumnIdx] = useState(initialColumnIdx);
  const [totalColumns, setTotalColumns] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [zoom, setZoom] = useState(100);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [pageInput, setPageInput] = useState('1');
  const [isTypingPage, setIsTypingPage] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState([0, 1, 2, 3]); // Expand virtual pages and first chapter by default
  const [globalPageCounts, setGlobalPageCounts] = useState([]);
  const [totalBookPages, setTotalBookPages] = useState(1);

  const textContainerRef = useRef(null);
  const readerWrapperRef = useRef(null);
  const measurerRefs = useRef({});

  // Comments State
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeParagraphIdx, setActiveParagraphIdx] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  
  // Interactions State
  const [userInteractions, setUserInteractions] = useState({}); // { [chapterId]: 'like' | 'dislike' }
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportReason, setReportReason] = useState('');
  
  const handleInteraction = (chapterId, type) => {
    setUserInteractions(prev => ({
      ...prev,
      [chapterId]: prev[chapterId] === type ? null : type
    }));
  };
  
  const submitReport = () => {
    const newReport = {
      id: 'report_' + Date.now(),
      chapterId: getChapterId(chapter),
      bookId: bookId,
      userId: currentUser?.id,
      userName: currentUser?.name || 'Leitor Anônimo',
      category: reportCategory,
      reason: reportReason,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    onUpdateData({
      ...db,
      reports: [...(db.reports || []), newReport]
    });

    toast("Sua denúncia foi enviada para a curadoria. Obrigado!");
    setShowReportModal(false);
    setReportReason('');
    setReportCategory('');
  };

  const getChapterId = (ch) => ch?.isVirtual ? ch.virtualType : ch?.id;

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !chapter) return;

    const newNote = {
      id: 'note_' + Date.now(),
      userId: currentUser?.id || 'anon',
      userName: currentUser?.name || 'Leitor',
      userAvatar: currentUser?.avatar || null,
      chapterId: getChapterId(chapter),
      subthemeStr: subthemeObj?.subtheme || '',
      paragraphIdx: activeParagraphIdx,
      text: newCommentText,
      status: 'accepted',
      likes: [],
      createdAt: new Date().toISOString()
    };

    const updatedUniverse = { ...data, notes: [...notes, newNote] };
    const updatedBook = { ...book, universe: updatedUniverse };
    const newDb = { ...db, books: db.books.map(b => b.id === book.id ? updatedBook : b) };
    
    onUpdateData(newDb);
    setNewCommentText('');
  };

  const handleLikeComment = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !currentUser) return;

    const hasLiked = note.likes?.includes(currentUser.id);
    let newLikes = [...(note.likes || [])];
    
    if (hasLiked) {
      newLikes = newLikes.filter(id => id !== currentUser.id);
    } else {
      newLikes.push(currentUser.id);
    }

    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, likes: newLikes } : n);
    const updatedUniverse = { ...data, notes: updatedNotes };
    const updatedBook = { ...book, universe: updatedUniverse };
    const newDb = { ...db, books: db.books.map(b => b.id === book.id ? updatedBook : b) };
    
    onUpdateData(newDb);
  };

  // Flatten all subthemes for global pagination (excluding locked chapters)
  const allSubthemes = chapters.reduce((acc, ch, cIdx) => {
    if (isChapterLocked(ch)) return acc;
    (ch.pages || []).forEach((p, pIdx) => {
      acc.push({ chIdx: cIdx, subIdx: pIdx, text: p.text, subtheme: p.subtheme });
    });
    return acc;
  }, []);

  // Add chapter to expanded list when it becomes active
  useEffect(() => {
    if (!expandedChapters.includes(activeChapterIdx)) {
      setExpandedChapters(prev => [...prev, activeChapterIdx]);
    }
  }, [activeChapterIdx]);

  // Save Bookmark and Track Metrics on change
  const timeSpentRef = useRef(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      timeSpentRef.current += 1;
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

    // Atualiza métricas: +1 página lida, e soma o tempo decorrido desde o último salvamento
    const stats = currentUser.stats || { totalTime: 0, totalPages: 0 };
    const newStats = { 
      ...stats, 
      totalPages: (stats.totalPages || 0) + 1,
      totalTime: (stats.totalTime || 0) + timeSpentRef.current 
    };
    timeSpentRef.current = 0; // zera o tempo local após salvar no banco

    const updatedUser = {
      ...currentUser,
      readingPositions: updatedPositions,
      readingStatus: updatedStatus,
      stats: newStats
    };

    let newDb = { ...db };
    newDb.users = newDb.users.map(u => u.id === currentUser.id ? updatedUser : u);

    // Motor de Gamificação
    let engineResult = processGamificationEvent(newDb, currentUser.id, 'chapters_read', { amount: 1 });
    engineResult = processGamificationEvent(engineResult.newDb, currentUser.id, 'total_mins_read', { minsRead: Math.floor(timeSpentRef.current / 60) });
    
    // Se quiser mostrar os toasts, precisa passar os unlockedBadges para cima ou usar notificações do DB.
    // O motor já cria notificações em engineResult.newDb.notifications

    onUpdateData(engineResult.newDb);
  }, [activeChapterIdx, activeSubthemeIdx, activeColumnIdx]);

  // Measure columns and global pages
  useEffect(() => {
    const calculateAll = () => {
      if (readerWrapperRef.current) {
        const wrapper = readerWrapperRef.current;
        wrapper.style.flex = '1';
        wrapper.style.height = 'auto';
        
        const availableHeight = wrapper.clientHeight;
        const computedStyle = window.getComputedStyle(wrapper);
        const fontSize = parseFloat(computedStyle.fontSize) || 16;
        let lineHeight = fontSize * 1.8;
        if (computedStyle.lineHeight && computedStyle.lineHeight !== 'normal') {
          lineHeight = parseFloat(computedStyle.lineHeight);
        }
        
        const exactLines = Math.floor(availableHeight / lineHeight);
        const optimalHeight = Math.max(lineHeight, exactLines * lineHeight);
        
        wrapper.style.flex = 'none';
        wrapper.style.height = `${optimalHeight}px`;

        if (textContainerRef.current) {
          textContainerRef.current.style.height = `${optimalHeight}px`;
          textContainerRef.current.style.columnWidth = `${textContainerRef.current.clientWidth}px`;
        }

        Object.values(measurerRefs.current).forEach(el => {
          if (el) {
            el.style.height = `${optimalHeight}px`;
            el.style.columnWidth = `${el.clientWidth}px`;
          }
        });
      }

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
        const cols = globalPageCounts[i] || 1;
        const colIdx = activeColumnIdx === 9999 ? cols - 1 : activeColumnIdx;
        return pagesBefore + colIdx + 1;
      }
      pagesBefore += (globalPageCounts[i] || 1);
    }
    return pagesBefore + (activeColumnIdx === 9999 ? 0 : activeColumnIdx) + 1;
  };

  useEffect(() => {
    if (!isTypingPage) {
      setPageInput(getCurrentGlobalPage().toString());
    }
  }, [activeColumnIdx, activeChapterIdx, activeSubthemeIdx, globalPageCounts, isTypingPage]);

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
        toast(`O próximo capítulo estará disponível em ${formatDateDisplay(nextCh.publishDate)}!`);
        return;
      }
      setActiveChapterIdx(activeChapterIdx + 1);
      setActiveSubthemeIdx(0);
      setActiveColumnIdx(0);
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
    e?.preventDefault?.();
    const val = parseInt(pageInput);
    if (!isNaN(val) && val >= 1 && val <= totalBookPages) {
      navigateToGlobalPage(val);
    } else {
      setPageInput(getCurrentGlobalPage().toString());
    }
    document.activeElement?.blur?.();
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
      if (p.isChapterHeader) return;
      const name = p.subtheme ? p.subtheme.trim() : `Trecho ${pIdx + 1}`;
      if (groups.length === 0 || groups[groups.length - 1].name !== name) {
        groups.push({ name, startIdx: pIdx });
      }
    });
    return groups;
  };

  const getBubbleSvg = (count, goldColor, isHover = false) => {
    const width = count > 9 ? 36 : count > 0 ? 30 : 26;
    const color = goldColor.replace('#', '%23');
    const textHtml = count > 0 
      ? `<text x="${width / 2 + 4}" y="12.5" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23000" text-anchor="middle">${count}</text>`
      : `<text x="${width / 2 + 4}" y="13.5" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23000" text-anchor="middle">+</text>`;
      
    const opacityAttr = isHover ? 'opacity="0.5"' : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="18" viewBox="0 0 ${width} 18" ${opacityAttr}>
      <rect x="0" y="0" width="${width}" height="18" rx="9" fill="${color}" />
      <g transform="translate(${count === 0 ? 2 : 4}, 3) scale(0.5)">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="%23000" stroke="%23000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      ${textHtml}
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${svg.replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E').replace(/\s+/g, ' ')}`;
  };

  const renderReaderBody = (htmlString, chObj, subObj) => {
    if (!htmlString) return null;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    const chId = getChapterId(chObj);
    const subStr = subObj?.subtheme || '';
    
    return nodes.map((node, pIdx) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === '') return null;
      
      const nodeHtml = node.outerHTML || node.textContent;
      if (node.nodeName.toLowerCase() === 'p' && (node.innerHTML === '<br>' || node.textContent.trim() === '')) {
        return <div key={pIdx} dangerouslySetInnerHTML={{ __html: nodeHtml }} />;
      }
      
      const paragraphNotes = notes.filter(n => 
        n.chapterId === chId && 
        n.subthemeStr === subStr && 
        n.paragraphIdx === pIdx &&
        (n.status === 'accepted' || n.userId === currentUser?.id)
      );
      
      const hasNotes = paragraphNotes.length > 0;
      return (
        <div 
          key={pIdx} 
          className={`reader-paragraph-wrapper ${hasNotes ? 'has-notes' : 'no-notes'}`}
          onClick={(e) => {
            e.stopPropagation();
            setActiveParagraphIdx(pIdx);
            setIsCommentsOpen(true);
          }}
          style={{ 
            cursor: 'pointer', 
            display: 'block', 
            paddingRight: '35px',
            breakInside: 'auto',
            '--bubble-svg': `url("${getBubbleSvg(paragraphNotes.length, themeColors.gold)}")`,
            '--bubble-svg-empty-hover': `url("${getBubbleSvg(0, themeColors.gold, true)}")`
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: nodeHtml }} 
               onClick={(e) => {
                 e.stopPropagation();
                 setActiveParagraphIdx(pIdx);
                 setIsCommentsOpen(true);
               }}
               style={{ display: 'block', width: '100%' }} />
        </div>
      );
    });
  };



  // Touch state for swiping pages
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    if (touchEndX.current < touchStartX.current - 50) {
      handleNextPage();
    } else if (touchEndX.current > touchStartX.current + 50) {
      handlePrevPage();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      backgroundColor: themeColors.bg, color: themeColors.text,
      fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Navbar */}
      <div style={{
        height: isMobile ? '60px' : '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem', borderBottom: `1px solid ${themeColors.border}`, backgroundColor: themeColors.panelBg, flexShrink: 0
      }}>
        {/* Left Side: Back Button & Book Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.8rem' : '1.5rem', width: isMobile ? 'auto' : '280px', flexShrink: 0, overflow: 'hidden' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: themeColors.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', flexShrink: 0 }} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          
          <button className="mobile-only" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: themeColors.text, cursor: 'pointer', display: 'none', flexShrink: 0 }}>
            <Menu size={24} />
          </button>

          <div style={{ fontWeight: '600', fontSize: isMobile ? '1.1rem' : '1.3rem', fontFamily: "'Playfair Display', serif", color: themeColors.gold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {book?.title || 'Leitura'}
          </div>
        </div>

        {/* Center: Current Chapter Info */}
        {!isMobile && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '2rem', overflow: 'hidden' }}>
            {chapter && (
              <>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: themeColors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(() => {
                    if (chapter.isVirtual || chapter.isPreamble || /^(?:cap|parte|pr.logo|pref.cio|introdu)/i.test(chapter.title)) {
                      return chapter.title || 'Sem título';
                    }
                    const rawIdx = activeChapterIdx - virtualChapters.length;
                    const cNum = actualChapters.slice(0, rawIdx).filter(c => !c.isVirtual && !c.isPreamble).length + 1;
                    return `Capítulo ${String(cNum).padStart(2, '0')}`;
                  })()}
                </div>
                <div style={{ fontSize: '0.9rem', color: themeColors.text, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {!chapter.isVirtual && chapter.title} {subthemeObj?.subtheme && !chapter.isVirtual ? `- ${subthemeObj.subtheme}` : ''}
                </div>
              </>
            )}
          </div>
        )}

        {/* Right Side: Zoom and Theme Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: isMobile ? 'auto' : '320px', justifyContent: 'flex-end', flexShrink: 0 }}>
          {!isMobile && (
            <>
              <button onClick={() => setZoom(Math.max(50, zoom - 10))} title="Reduzir Letra" style={{ background: 'transparent', border: `1px solid ${themeColors.border}`, color: themeColors.text, padding: '0.2rem', borderRadius: '4px', cursor: 'pointer' }}>
                <ZoomOut size={18} />
              </button>
              <button onClick={() => setZoom(Math.min(200, zoom + 10))} title="Aumentar Letra" style={{ background: 'transparent', border: `1px solid ${themeColors.border}`, color: themeColors.text, padding: '0.2rem', borderRadius: '4px', cursor: 'pointer' }}>
                <ZoomIn size={18} />
              </button>
              <div style={{ width: '1px', height: '20px', background: themeColors.border, margin: '0 0.5rem' }}></div>
            </>
          )}
          <button 
            onClick={() => setIsShopModalOpen(true)}
            title="Incentivar Autor" 
            style={{ 
              background: 'var(--accent-gold)', 
              border: 'none', 
              color: '#000', 
              cursor: 'pointer', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '4px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.3rem',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              marginLeft: '0.5rem'
            }}
          >
            <Gift size={16} /> <span className="hide-on-mobile">Incentivar</span>
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ background: 'none', border: 'none', color: themeColors.text, cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Left Column: Chapters & Subthemes */}
        <div className={`reader-toc-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{
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
                        toast(`Este capítulo estará disponível em ${formatDateDisplay(ch.publishDate)}!`);
                        return;
                      }
                      toggleChapter(idx); 
                      if (!isExpanded || isActiveChapter) { 
                        setActiveChapterIdx(idx); 
                        setActiveSubthemeIdx(0);
                        setActiveColumnIdx(0);
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
                      {(() => {
                        if (ch.isVirtual || ch.isPreamble || /^(?:cap|parte|pr.logo|pref.cio|introdu)/i.test(ch.title)) {
                          return ch.title || 'Sem título';
                        }
                        const actualIdx = chapters.slice(0, idx).filter(c => !c.isVirtual && !c.isPreamble).length + 1;
                        return `Cap. ${String(actualIdx).padStart(2, '0')} - ${ch.title || 'Sem título'}`;
                      })()}
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
          <div style={{ flex: 1, width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: isMobile ? '1.2rem 1rem' : '2rem 1rem', position: 'relative' }}>
            
            <div 
              ref={readerWrapperRef} 
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ 
                width: '100%',
                minWidth: 0,
                flex: 1, 
                position: 'relative', 
                overflow: 'hidden',
                fontSize: `${zoom}%`,
                lineHeight: '1.8',
                fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif"
              }}
            >
              {/* The Sliding Container */}
              <div 
                ref={textContainerRef}
                style={{
                  height: '100%',
                  width: '100%',
                  columnWidth: '100%',
                  columnGap: '2rem',
                  columnFill: 'auto',
                  transform: `translateX(calc(${activeColumnIdx} * -100% - ${activeColumnIdx} * 2rem))`,
                  transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                  textAlign: 'justify'
                }}
              >
                {subthemeObj ? (
                  <div>
                    {subthemeObj.subtheme && !chapter.isVirtual && (activeSubthemeIdx === 0 || chapter?.pages?.[activeSubthemeIdx - 1]?.subtheme !== subthemeObj.subtheme) && (
                      <h2 style={{ 
                         textAlign: 'left', 
                         fontFamily: "'Playfair Display', serif", 
                         color: themeColors.gold, 
                         marginBottom: '1.5rem', 
                         marginTop: activeSubthemeIdx === 0 ? '0' : '2rem',
                         fontSize: activeSubthemeIdx === 0 ? '1.8rem' : '1.4rem',
                         textTransform: activeSubthemeIdx === 0 ? 'uppercase' : 'none'
                      }}>
                        {subthemeObj.subtheme}
                      </h2>
                    )}
                    
                    <div className={`reader-body ${chapter?.isVirtual ? 'is-virtual' : ''}`}>
                      {renderReaderBody((subthemeObj.text || '').replace(/(<p>(\s|&nbsp;|<br\/?\s*>)*<\/p>)+$/, ''), chapter, subthemeObj)}
                    </div>

                    {/* Fim do Capítulo - Botões de Interação */}
                    {!chapter?.isVirtual && activeSubthemeIdx === chapter.pages.length - 1 && (
                      <div className="chapter-interaction-footer" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', breakInside: 'avoid' }}>
                        <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: themeColors.gold, fontSize: '1.5rem' }}>O que achou deste capítulo?</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button 
                            style={{ background: userInteractions[chapter.id] === 'like' ? 'rgba(76, 175, 80, 0.2)' : 'transparent', color: userInteractions[chapter.id] === 'like' ? '#4CAF50' : themeColors.text, border: `1px solid ${userInteractions[chapter.id] === 'like' ? '#4CAF50' : 'rgba(255,255,255,0.2)'}`, borderRadius: '24px', padding: '0.8rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', transition: 'all 0.2s' }} 
                            onClick={() => handleInteraction(chapter.id, 'like')}
                          >
                            <ThumbsUp size={20} fill={userInteractions[chapter.id] === 'like' ? '#4CAF50' : 'none'} /> Gostei
                          </button>
                          <button 
                            style={{ background: userInteractions[chapter.id] === 'dislike' ? 'rgba(244, 67, 54, 0.2)' : 'transparent', color: userInteractions[chapter.id] === 'dislike' ? '#f44336' : themeColors.text, border: `1px solid ${userInteractions[chapter.id] === 'dislike' ? '#f44336' : 'rgba(255,255,255,0.2)'}`, borderRadius: '24px', padding: '0.8rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', transition: 'all 0.2s' }} 
                            onClick={() => handleInteraction(chapter.id, 'dislike')}
                          >
                            <ThumbsDown size={20} fill={userInteractions[chapter.id] === 'dislike' ? '#f44336' : 'none'} /> Não Gostei
                          </button>
                        </div>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                          onClick={() => setShowReportModal(true)}
                        >
                          <AlertTriangle size={16} /> Reportar problema com este capítulo
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.5, fontSize: '1.2rem' }}>
                    O livro ainda não começou a ser escrito.
                  </div>
                )}
              </div>
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
                      columnWidth: '100%',
                      columnGap: '2rem',
                      columnFill: 'auto',
                      fontSize: `${zoom}%`,
                      lineHeight: '1.8',
                      fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
                      textAlign: 'justify',
                      position: 'absolute', top: 0, left: 0
                    }}
                  >

                    {sub.subtheme && !chapterObj?.isVirtual && (isFirstSub || chapters[sub.chIdx]?.pages?.[sub.subIdx - 1]?.subtheme !== sub.subtheme) && (
                      <h2 style={{ 
                        textAlign: 'left',
                        fontFamily: "'Playfair Display', serif", 
                        color: themeColors.gold, 
                        marginBottom: '1.5rem', 
                        marginTop: isFirstSub ? '0' : '2rem',
                        fontSize: isFirstSub ? '1.8rem' : '1.4rem',
                        textTransform: isFirstSub ? 'uppercase' : 'none'
                      }}>
                        {sub.subtheme}
                      </h2>
                    )}
                    <div className={`reader-body ${chapterObj?.isVirtual ? 'is-virtual' : ''}`}>
                      {renderReaderBody((sub.text || '').replace(/(<p>(\s|&nbsp;|<br\/?\s*>)*<\/p>)+$/, ''), chapterObj, sub)}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Pagination Controls */}
          {chapters.length > 0 && (
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '800px', 
              padding: isMobile ? '1rem' : '1.5rem 2rem', borderTop: `1px solid ${themeColors.border}`
            }}>
              <button onClick={handlePrevPage} disabled={activeChapterIdx === 0 && activeSubthemeIdx === 0 && activeColumnIdx === 0} 
                style={{ 
                  background: 'transparent', 
                  color: themeColors.text, 
                  border: `1px solid ${themeColors.border}`, 
                  padding: isMobile ? '0.4rem 0.8rem' : '0.6rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.3rem', 
                  opacity: (activeChapterIdx === 0 && activeSubthemeIdx === 0 && activeColumnIdx === 0) ? 0.3 : 1, 
                  fontWeight: '500',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                <span style={{ marginRight: '6px', fontFamily: 'monospace', fontWeight: 'bold' }}>&lt;</span> Ant.
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
                <span>Página</span>
                <form onSubmit={handlePageSubmit} style={{ display: 'inline-block', margin: 0 }}>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pageInput}
                    onFocus={() => setIsTypingPage(true)}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={(e) => {
                      setIsTypingPage(false);
                      handlePageSubmit(e);
                    }}
                    style={{
                      width: '45px', textAlign: 'center', background: 'transparent', 
                      color: themeColors.text, border: `1px solid ${themeColors.border}`, 
                      borderRadius: '4px', padding: '0.3rem 0.1rem',
                      fontSize: '0.95rem'
                    }}
                  />
                </form>
                <span>/ {totalBookPages}</span>
              </div>

              <button onClick={handleNextPage} disabled={activeChapterIdx === chapters.length - 1 && activeSubthemeIdx === (chapters[chapters.length - 1]?.pages?.length || 1) - 1 && activeColumnIdx === totalColumns - 1} 
                style={{ 
                  background: 'transparent', 
                  color: themeColors.text, 
                  border: `1px solid ${themeColors.border}`, 
                  padding: isMobile ? '0.4rem 0.8rem' : '0.6rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.3rem', 
                  opacity: (activeChapterIdx === chapters.length - 1 && activeSubthemeIdx === (chapters[chapters.length - 1]?.pages?.length || 1) - 1 && activeColumnIdx === totalColumns - 1) ? 0.3 : 1, 
                  fontWeight: '500',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                Próx. <span style={{ marginLeft: '6px', fontFamily: 'monospace', fontWeight: 'bold' }}>&gt;</span>
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

        {/* Floating Comments Sidebar */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: isMobile ? '100%' : '350px',
          backgroundColor: themeColors.panelBg,
          borderLeft: `1px solid ${themeColors.border}`,
          zIndex: 50,
          boxShadow: '-5px 0 20px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          transform: isCommentsOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          pointerEvents: isCommentsOpen ? 'auto' : 'none',
          opacity: isCommentsOpen ? 1 : 0
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: `1px solid ${themeColors.border}` }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: themeColors.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color={themeColors.gold} /> Comentários
              </h3>
              <button onClick={() => setIsCommentsOpen(false)} style={{ background: 'none', border: 'none', color: themeColors.text, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(() => {
                const activeNotes = notes.filter(n => 
                  n.chapterId === getChapterId(chapter) && 
                  n.subthemeStr === (subthemeObj?.subtheme || '') && 
                  n.paragraphIdx === activeParagraphIdx &&
                  (n.status === 'accepted' || n.userId === currentUser?.id)
                );
                
                if (activeNotes.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', color: themeColors.text, opacity: 0.5, marginTop: '2rem' }}>
                      <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <p>Nenhum comentário neste trecho ainda. Seja o primeiro!</p>
                    </div>
                  );
                }
                
                return activeNotes.map(n => {
                  const commentUser = db?.users?.find(u => u.id === n.userId);
                  const displayAvatar = commentUser?.avatar || n.userAvatar;
                  const displayName = commentUser ? (commentUser.displayMode === 'name' ? commentUser.name : (commentUser.nickname || commentUser.name)) : n.userName;
                  
                  return (
                    <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        {displayAvatar ? (
                          <img src={displayAvatar} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: themeColors.gold, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            {displayName?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: themeColors.gold }}>{displayName}</div>
                          <div style={{ fontSize: '0.7rem', color: themeColors.text, opacity: 0.5 }}>
                            {new Date(n.createdAt).toLocaleDateString()} {n.status === 'pending' ? '(Em aprovação)' : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: themeColors.text, 
                        lineHeight: '1.5',
                        padding: '0.8rem',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        borderLeft: `2px solid ${themeColors.gold}`
                      }}>
                        {n.text}
                      </div>

                      {n.status === 'accepted' && (
                        <div style={{ display: 'flex', gap: '1rem', paddingLeft: '0.5rem' }}>
                          <button 
                            onClick={() => handleLikeComment(n.id)}
                            style={{ 
                              background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                              color: n.likes?.includes(currentUser?.id) ? '#ff4b4b' : themeColors.text,
                              opacity: n.likes?.includes(currentUser?.id) ? 1 : 0.6,
                              fontSize: '0.8rem'
                            }}
                          >
                            <Heart size={14} fill={n.likes?.includes(currentUser?.id) ? '#ff4b4b' : 'none'} color={n.likes?.includes(currentUser?.id) ? '#ff4b4b' : 'currentColor'} /> 
                            {n.likes?.length || 0}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            
            <div style={{ padding: '1rem', borderTop: `1px solid ${themeColors.border}`, background: 'rgba(0,0,0,0.1)' }}>
              <form onSubmit={handleSubmitComment} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="Escreva um comentário..." 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  style={{ 
                    flex: 1, 
                    background: 'transparent', 
                    border: `1px solid ${themeColors.border}`, 
                    borderRadius: '20px', 
                    padding: '0.6rem 1rem',
                    color: themeColors.text,
                    outline: 'none',
                    fontSize: '0.9rem'
                  }} 
                />
                <button type="submit" disabled={!newCommentText.trim()} style={{ 
                  background: themeColors.gold, 
                  border: 'none', 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: newCommentText.trim() ? 'pointer' : 'not-allowed',
                  opacity: newCommentText.trim() ? 1 : 0.5
                }}>
                  <Send size={16} color="#000" style={{ marginLeft: '-2px' }} />
                </button>
              </form>
              <div style={{ fontSize: '0.7rem', color: themeColors.text, opacity: 0.5, textAlign: 'center', marginTop: '0.5rem' }}>
                Seu comentário será enviado ao autor(a).
              </div>
            </div>
          </div>
        </div>

      {/* Modal de Denúncia */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: themeColors.sidebarBg, color: themeColors.text, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', border: `1px solid ${themeColors.gold}` }}>
            <h3 style={{ margin: '0 0 1rem 0', fontFamily: "'Playfair Display', serif", color: themeColors.gold, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={24} /> Reportar Capítulo
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Encontrou algum problema neste capítulo? Por favor, selecione o motivo e descreva o problema abaixo para que nossa curadoria possa analisar.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
              {[
                { id: 'sensivel', label: 'Conteúdo sensível' },
                { id: 'explicito', label: 'Conteúdo explícito (+18)' },
                { id: 'plagio', label: 'Plágio / Direitos Autorais' },
                { id: 'outro', label: 'Outros' }
              ].map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="reportCategory" 
                    value={cat.id} 
                    checked={reportCategory === cat.id} 
                    onChange={(e) => setReportCategory(e.target.value)}
                    style={{ accentColor: themeColors.gold }}
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>

            <textarea 
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={reportCategory === 'outro' ? "Por favor, descreva o problema detalhadamente..." : "Quer adicionar algum detalhe? (Opcional)"}
              style={{ width: '100%', height: '100px', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: themeColors.text, borderRadius: '8px', marginBottom: '1.5rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={() => setShowReportModal(false)}
                style={{ background: 'transparent', color: themeColors.text, border: '1px solid rgba(255,255,255,0.2)', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={submitReport}
                disabled={!reportCategory || (reportCategory === 'outro' && !reportReason.trim())}
                style={{ background: themeColors.gold, color: '#000', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: (reportCategory && (reportCategory !== 'outro' || reportReason.trim())) ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: (reportCategory && (reportCategory !== 'outro' || reportReason.trim())) ? 1 : 0.5 }}
              >
                Enviar Denúncia
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .reader-illustration { display: none !important; }
          .reader-toc-sidebar { position: absolute; z-index: 10; height: 100%; transform: translateX(-100%); transition: transform 0.3s ease; box-shadow: 5px 0 15px rgba(0,0,0,0.5); }
          .reader-toc-sidebar.open { transform: translateX(0); }
          .mobile-only { display: flex !important; }
        }
        
        /* Responsive virtual pages styles */
        .reader-cover-page, .reader-author-page, .reader-synopsis-page {
          display: block;
        }
        
        @media (max-width: 768px) {
          .reader-cover-title {
            font-size: 1.9rem !important;
            margin-bottom: 0.3rem !important;
            margin-top: 0.2rem !important;
          }
          .reader-cover-subtitle {
            font-size: 1rem !important;
            margin-bottom: 1.2rem !important;
            margin-top: 0 !important;
          }
          .reader-cover-img {
            max-height: 48vh !important;
            max-width: 90% !important;
            margin: 0 auto !important;
            display: block !important;
            box-shadow: 0 8px 20px rgba(0,0,0,0.6) !important;
          }
          .reader-chapter-header-page h1 {
            font-size: 1.8rem !important;
          }
          .reader-author-header {
            flex-direction: column !important;
            text-align: center !important;
            gap: 1rem !important;
          }
          .reader-author-avatar-wrapper {
            width: 70px !important;
            height: 70px !important;
          }
          .reader-author-name {
            font-size: 1.3rem !important;
          }
          .reader-author-bio {
            font-size: 0.9rem !important;
            line-height: 1.6 !important;
          }
          .reader-synopsis-title {
            font-size: 1.3rem !important;
            margin-bottom: 1rem !important;
          }
          .reader-synopsis-text {
            font-size: 0.9rem !important;
            line-height: 1.6 !important;
          }
        }

        .reader-body {
          font-family: 'Roboto', 'Inter', sans-serif;
          font-weight: 400;
        }
        .reader-body h1, .reader-body h2, .reader-body h3, .reader-body h4, .reader-body h5, .reader-body h6 {
          font-family: 'Playfair Display', serif !important;
          font-weight: normal;
        }
        .reader-body strong, .reader-body b {
          font-weight: 700 !important;
          font-family: 'Roboto', 'Inter', sans-serif;
        }
        .reader-body p { 
          margin: 0;
          padding-bottom: 1.5rem; 
        }
        .reader-body p:last-child { 
          padding-bottom: 0; 
        }
        .reader-body blockquote {
          border-left: 3px solid ${themeColors.gold};
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          opacity: 0.8;
        }
        .reader-body:not(.is-virtual) .reader-paragraph-wrapper:first-child p:first-of-type::first-letter {
          font-size: 3.5em;
          float: left;
          line-height: 0.8;
          padding-right: 0.15rem;
          color: ${themeColors.gold};
          font-family: 'Playfair Display', serif;
          font-weight: bold;
        }

        .reader-paragraph-wrapper.has-notes {
          background-image: var(--bubble-svg);
          background-position: right 0px top 5px;
          background-repeat: no-repeat;
        }
        .reader-paragraph-wrapper.no-notes {
          background-position: right 0px top 5px;
          background-repeat: no-repeat;
          transition: background-image 0.2s;
        }
        .reader-paragraph-wrapper.no-notes:hover {
          background-image: var(--bubble-svg-empty-hover);
        }
      `}} />
      {isShopModalOpen && (
        <ShopModal 
          isOpen={isShopModalOpen} 
          onClose={() => setIsShopModalOpen(false)} 
          userName={currentUser?.nickname || currentUser?.name} 
        />
      )}
    </div>
  );
}
