import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, ChevronLeft, Type, AlignLeft, Maximize, ChevronRight, Upload, Layout, ArrowDown, ArrowUp } from 'lucide-react';

export default function TypesettingDashboard({ book, universe, onUpdateBook, onUpdateData }) {
  // Configurações de Formato Físico
  const [format, setFormat] = useState('14x21'); 
  const [fontFamily, setFontFamily] = useState('Merriweather, serif');
  const [fontSize, setFontSize] = useState(11);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textAlign, setTextAlign] = useState('justify');
  const [showMargins, setShowMargins] = useState(true);

  // Estados do Motor de Paginação
  const contentRef = useRef(null);
  const [dynamicPagesCount, setDynamicPagesCount] = useState(1);
  const [currentView, setCurrentView] = useState(0);

  // Formatos físicos (px proporcionais para tela)
  const formats = {
    '14x21': { name: 'Literatura (14x21cm)', width: 530, height: 794, padding: 60 },
    'a5': { name: 'A5 (14.8x21cm)', width: 560, height: 794, padding: 60 },
    'pocket': { name: 'Pocket (11x18cm)', width: 416, height: 680, padding: 40 }
  };

  const currentFormat = formats[format];
  
  // Geometria Absoluta do Motor
  const PW = currentFormat.width;
  const PH = currentFormat.height;
  const P = currentFormat.padding;
  const PG = 40; // Gap visual entre as páginas
  const STEP = 2 * (PW + PG); // Distância exata entre cada spread

  const colWidth = PW - (2 * P);
  const colGap = PG + (2 * P);

  // Atualizar estimativa de páginas
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        const totalWidth = contentRef.current.scrollWidth;
        const count = Math.round((totalWidth + colGap) / (colWidth + colGap));
        setDynamicPagesCount(count > 0 ? count : 1);
      }
    };
    const timer = setTimeout(measure, 500);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(timer); window.removeEventListener('resize', measure); };
  }, [format, fontFamily, fontSize, lineHeight, textAlign, universe, colGap, colWidth]);

  const fixedPagesCount = 4; // Capa, Rosto, Agradecimentos, Índice
  const maxViews = Math.ceil((fixedPagesCount + dynamicPagesCount + 1) / 2); // +1 contracapa

  // Funções de Navegação (Mouse Wheel ou Botões)
  const goPrev = () => setCurrentView(v => Math.max(0, v - 1));
  const goNext = () => setCurrentView(v => Math.min(maxViews, v + 1));

  const isScrolling = useRef(false);
  const handleWheel = (e) => {
    if (isScrolling.current) return;
    if (e.deltaY > 30) {
      goNext();
      isScrolling.current = true;
      setTimeout(() => isScrolling.current = false, 400);
    } else if (e.deltaY < -30) {
      goPrev();
      isScrolling.current = true;
      setTimeout(() => isScrolling.current = false, 400);
    }
  };

  // Upload de Capa
  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file && onUpdateBook) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateBook({ ...book, coverUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTitlePageChange = (e) => {
    if (onUpdateData) {
      onUpdateData({ ...universe, typesettingTitlePage: e.currentTarget.innerHTML });
    }
  };

  const pageStyle = {
    width: `${PW}px`,
    height: `${PH}px`,
    backgroundColor: '#fff',
    boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const contentStyle = {
    fontFamily: fontFamily,
    fontSize: `${fontSize}pt`,
    lineHeight: lineHeight,
    textAlign: textAlign,
    color: '#111',
    hyphens: textAlign === 'justify' ? 'auto' : 'none',
    wordWrap: 'break-word',
  };

  const SafetyMargin = () => showMargins ? (
    <div style={{
      position: 'absolute', top: '15px', bottom: '15px', left: '15px', right: '15px',
      border: '1px dashed rgba(255, 0, 0, 0.4)', pointerEvents: 'none', zIndex: 50
    }}>
      <span style={{ position: 'absolute', top: -1, left: 2, fontSize: '9px', color: 'rgba(255,0,0,0.4)' }}>ZONA SEGURA DE CORTE</span>
    </div>
  ) : null;

  // Calculando as posições X absolutas de cada página no Trilho
  const coverX = (PW + PG) / 2; // Centralizado no Spread 0
  const titleX = STEP; // Esquerda do Spread 1
  const dedicationX = STEP + PW + PG; // Direita do Spread 1
  const indexX = 2 * STEP; // Esquerda do Spread 2
  const textFlowX = 2 * STEP + PW + PG; // Direita do Spread 2 (aqui começa a fluir)
  const backCoverX = textFlowX + dynamicPagesCount * (PW + PG);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', backgroundColor: '#2b2b2b', color: '#333', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Sidebar de Ferramentas */}
      <div style={{ width: '320px', backgroundColor: '#fff', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 10px rgba(0,0,0,0.2)', zIndex: 100 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={24} color="#d4af37" />
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: '#000' }}>Diagramação</h2>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>Folhear Páginas</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={goPrev} disabled={currentView === 0} style={{ flex: 1, padding: '0.8rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', cursor: currentView === 0 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', opacity: currentView === 0 ? 0.5 : 1 }}>
                <ArrowUp size={20} /> Anterior
              </button>
              <button onClick={goNext} disabled={currentView >= maxViews} style={{ flex: 1, padding: '0.8rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', cursor: currentView >= maxViews ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', opacity: currentView >= maxViews ? 0.5 : 1 }}>
                Próxima <ArrowDown size={20} />
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888' }}>
              Página atual: {currentView === 0 ? 'Capa' : `${2 * currentView - 1} e ${2 * currentView}`}
            </div>
          </div>

          <button onClick={() => setShowMargins(!showMargins)} style={{ width: '100%', padding: '0.8rem', background: showMargins ? 'rgba(212, 175, 55, 0.1)' : '#f0f0f0', border: `1px solid ${showMargins ? '#d4af37' : '#ccc'}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: showMargins ? '#b5952f' : '#666', fontWeight: 'bold' }}>
            <Layout size={18} /> {showMargins ? 'Ocultar Área de Corte' : 'Mostrar Área de Corte'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Maximize size={16} /> Tamanho do Livro</label>
            <select value={format} onChange={(e) => { setFormat(e.target.value); setTimeout(() => setCurrentView(0), 100); }} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }}>
              {Object.entries(formats).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Type size={16} /> Tipografia</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }}>
              <option value="Merriweather, serif">Merriweather (Clássica)</option>
              <option value="Lora, serif">Lora (Suave)</option>
              <option value="'EB Garamond', serif">Garamond (Elegante)</option>
              <option value="'Open Sans', sans-serif">Open Sans (Moderna)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Tamanho Fonte</label>
              <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} min={8} max={24} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Espaçamento</label>
              <input type="number" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} min={1} max={3} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }} />
            </div>
          </div>
        </div>
      </div>

      {/* VIEWPORT DA CAMERA: Mostra exatamente 1 Spread (2 Páginas + Gap) */}
      <div onWheel={handleWheel} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        
        <div style={{ width: `${(PW * 2) + PG}px`, height: `${PH}px`, position: 'relative' }}>
          
          {/* TRILHO DE CONTEÚDO ABSOLUTO */}
          <div style={{ 
            position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
            transform: `translateX(-${currentView * STEP}px)`,
          }}>
            
            {/* LOMBADAS VIRTUAIS (Sombras no centro de cada spread visível) */}
            {Array.from({ length: maxViews + 1 }).map((_, i) => i > 0 ? (
              <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * STEP + PW}px`, width: `${PG}px`, background: 'linear-gradient(to right, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.02) 100%)', zIndex: 5, pointerEvents: 'none' }}></div>
            ) : null)}

            {/* Capa */}
            <div style={{ ...pageStyle, left: `${coverX}px`, justifyContent: 'center', alignItems: 'center', background: '#222' }}>
              <SafetyMargin />
              {book?.coverUrl ? (
                <img src={book.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Capa" />
              ) : (
                <div style={{ color: '#fff', textAlign: 'center', padding: '2rem', zIndex: 10 }}>
                  <h1 style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif" }}>{book?.title || 'Título'}</h1>
                  <p>[Sua capa aparecerá aqui]</p>
                </div>
              )}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', zIndex: 20 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <label style={{ background: '#d4af37', color: '#000', padding: '1rem 2rem', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <Upload size={18} /> Alterar Capa
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
                </label>
              </div>
            </div>

            {/* Folha de Rosto */}
            <div style={{ ...pageStyle, left: `${titleX}px`, justifyContent: 'center', alignItems: 'center', padding: `${P}px` }}>
              <SafetyMargin />
              <div 
                contentEditable suppressContentEditableWarning onBlur={handleTitlePageChange}
                style={{ textAlign: 'center', outline: 'none', width: '100%', position: 'relative', zIndex: 10 }}
                dangerouslySetInnerHTML={{ __html: universe?.typesettingTitlePage || `
                  <h1 style="font-size: 2.5em; margin-bottom: 1rem; font-family: 'Playfair Display', serif;">${book?.title || 'Título da Obra'}</h1>
                  <p style="font-size: 1.2em; color: #555;">${book?.authorName || 'Autor'}</p>
                  <div style="margin: 4rem auto; width: 50px; border-bottom: 1px solid #ccc;"></div>
                  <p style="font-size: 0.9em; color: #999;">Sagaflix Publicações</p>
                ` }}
              />
            </div>

            {/* Agradecimentos */}
            <div style={{ ...pageStyle, left: `${dedicationX}px`, padding: `${P}px` }}>
              <SafetyMargin />
              <h2 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", marginBottom: '2rem', textAlign: 'right' }}>Agradecimentos</h2>
              <div contentEditable suppressContentEditableWarning style={{ ...contentStyle, fontStyle: 'italic', outline: 'none', textAlign: 'right', flex: 1, position: 'relative', zIndex: 10 }}>
                A todos que tornaram esta obra possível... (Clique para editar)
              </div>
            </div>

            {/* Índice */}
            <div style={{ ...pageStyle, left: `${indexX}px`, padding: `${P}px` }}>
              <SafetyMargin />
              <h2 style={{ fontSize: '1.5em', fontFamily: "'Playfair Display', serif", marginBottom: '2rem', textAlign: 'center' }}>Índice</h2>
              <div style={{ ...contentStyle, outline: 'none', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', zIndex: 10 }}>
                {(universe?.chapters || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{c.title}</span>
                    <span style={{ borderBottom: '1px dotted #ccc', flex: 1, margin: '0 10px', position: 'relative', top: '-5px' }}></span>
                    <span>Cap. {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BACKGROUNDS DAS PÁGINAS DO TEXTO */}
            {Array.from({ length: dynamicPagesCount }).map((_, i) => (
              <div key={i} style={{ ...pageStyle, left: `${textFlowX + i * (PW + PG)}px` }}>
                <SafetyMargin />
                <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: '0.75rem', color: '#999' }}>
                  {fixedPagesCount + i + 1}
                </div>
              </div>
            ))}

            {/* MOTOR DE TEXTO CONTÍNUO (CSS COLUMNS) */}
            <div 
              ref={contentRef}
              contentEditable suppressContentEditableWarning
              style={{ 
                ...contentStyle,
                position: 'absolute',
                left: `${textFlowX + P}px`, // Offset inicial do padding da primeira folha
                top: `${P}px`, 
                width: `${colWidth}px`, // Força a primeira coluna a ter exatamente esta largura
                height: `${PH - 2*P}px`, 
                columnWidth: `${colWidth}px`,
                columnGap: `${colGap}px`,
                columnFill: 'auto',
                zIndex: 2, 
                outline: 'none',
              }}
            >
              {(universe?.chapters || []).map((chapter, idx) => {
                const sessions = chapter.pages || [];
                return (
                  <div key={chapter.id || idx} style={{ marginBottom: '3rem', breakInside: 'avoid' }}>
                    <h2 style={{ fontSize: '1.5em', marginBottom: '1.5rem', textAlign: 'center', fontFamily: "'Playfair Display', serif", breakBefore: 'column' }}>
                      {chapter.title}
                    </h2>
                    {sessions.map((session, sIdx) => (
                      <div key={sIdx} style={{ marginBottom: '1.5rem' }}>
                        {session.image && (
                          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                            <img src={session.image} alt="Ilustração" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                          </div>
                        )}
                        <div dangerouslySetInnerHTML={{ __html: session.text }} style={{ all: 'unset', display: 'block' }} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Contracapa */}
            <div style={{ ...pageStyle, left: `${backCoverX}px`, justifyContent: 'center', alignItems: 'center', background: '#222' }}>
               <h2 style={{ color: '#fff', fontFamily: "'Playfair Display', serif" }}>FIM</h2>
               <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px' }}>CONTRACAPA</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
