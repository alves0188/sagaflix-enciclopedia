import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Type, Maximize, Upload, Layout, ArrowDown, ArrowUp, Download, FileText } from 'lucide-react';

export default function TypesettingDashboard({ book, universe, onUpdateBook, onUpdateUniverse }) {
  // Configurações de Formato Físico
  const [format, setFormat] = useState('14x21'); 
  const [fontFamily, setFontFamily] = useState('Merriweather, serif');
  const [fontSize, setFontSize] = useState(11);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textAlign, setTextAlign] = useState('justify');
  const [showMargins, setShowMargins] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // Estados do Motor Vellum (Salvos no Universe)
  const bgImage = universe?.typesettingBackgroundImage || '';
  const useDropCaps = universe?.typesettingUseDropCaps || false;
  const chapterOrnament = universe?.typesettingChapterOrnament || '';
  const chapterMarginTop = universe?.typesettingChapterMarginTop || 0;
  const illustrations = universe?.typesettingIllustrations || {};

  const updateSetting = (key, val) => onUpdateUniverse && onUpdateUniverse({ ...universe, [key]: val });

  // Estados do Motor de Paginação
  const contentRef = useRef(null);
  const [dynamicPagesCount, setDynamicPagesCount] = useState(1);
  const [currentView, setCurrentView] = useState(0);

  // Formatos físicos
  const formats = {
    '14x21': { name: 'Literatura (14x21cm)', width: 530, height: 794, padding: 60, printSize: '140mm 210mm' },
    'a5': { name: 'A5 (14.8x21cm)', width: 560, height: 794, padding: 60, printSize: '148mm 210mm' },
    'pocket': { name: 'Pocket (11x18cm)', width: 416, height: 680, padding: 40, printSize: '110mm 180mm' }
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

  // Funções de Navegação
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

  // Handlers de Edição
  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file && onUpdateBook) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateBook({ ...book, coverUrl: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleTitlePageChange = (e) => {
    if (onUpdateUniverse) onUpdateUniverse({ ...universe, typesettingTitlePage: e.currentTarget.innerHTML });
  };

  const handleDedicationChange = (e) => {
    if (onUpdateUniverse) onUpdateUniverse({ ...universe, typesettingDedication: e.currentTarget.innerHTML });
  };

  const handleUploadBackground = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateSetting('typesettingBackgroundImage', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadOrnament = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateSetting('typesettingChapterOrnament', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadIllustration = (e, chapterIdx) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateSetting('typesettingIllustrations', { ...illustrations, [chapterIdx]: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // ---- EXPORTAÇÃO ----
  const handlePrintPDF = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500); // Aguarda renderizar o portal no DOM
  };

  const handleExportWord = () => {
    // Transforma medidas em pt ou in para o Word
    const ptWidth = Math.round(PW * 0.75); // Aproximação de px para pt
    const ptHeight = Math.round(PH * 0.75);
    const ptPadding = Math.round(P * 0.75);

    const css = `
      @page Section1 {
        size: ${ptWidth}pt ${ptHeight}pt;
        margin-top: ${ptPadding}pt;
        margin-bottom: ${ptPadding}pt;
        margin-left: ${ptPadding}pt;
        margin-right: ${ptPadding}pt;
        mso-header-margin: 0pt;
        mso-footer-margin: 0pt;
        mso-paper-source: 0;
      }
      div.Section1 { page: Section1; }
      .Section1 p, .Section1 span, .Section1 div { font-family: '${fontFamily.replace(/'/g, "")}', serif; font-size: ${fontSize}pt; line-height: ${lineHeight}; text-align: ${textAlign}; }
      h1, h2, h3 { font-family: 'Playfair Display', serif; text-align: center; }
      .cover-page { text-align: center; }
      .title-page { text-align: center; }
      .dedication-page { text-align: right; font-style: italic; }
      .index-page { }
      img { max-width: 100%; height: auto; }
    `;

    const pageBreak = `<br clear="all" style="page-break-before:always; mso-break-type:page-break" />`;

    let coverHtml = `<div class="cover-page"><h1>${book?.title || 'Título'}</h1></div>`;
    if (book?.coverUrl) {
      coverHtml = `<div class="cover-page"><img src="${book.coverUrl}" /></div>`;
    }

    const titlePageHtml = `<div class="title-page">${universe?.typesettingTitlePage || `<h1>${book?.title || 'Título da Obra'}</h1><p>${book?.authorName || 'Autor'}</p>`}</div>`;
    const dedicationHtml = `<div class="dedication-page">${universe?.typesettingDedication || 'A todos que tornaram esta obra possível...'}</div>`;
    const indexHtml = `<div class="index-page"><h2>Índice</h2>${(universe?.chapters || []).map((c, i) => `<p>${c.title} ...... Cap. ${i + 1}</p>`).join('')}</div>`;

    const chaptersHtml = (universe?.chapters || []).map((chapter, idx) => {
      let html = '';
      if (illustrations[idx]) {
        html += `${pageBreak}<div><img src="${illustrations[idx]}" style="width: 100%; height: auto;" /></div>`;
      }
      html += `${pageBreak}<div>`;
      if (chapterOrnament) {
        html += `<p style="text-align: center;"><img src="${chapterOrnament}" style="max-height: 50px;" /></p>`;
      }
      html += `<h2 style="margin-top: ${chapterMarginTop}px;">${chapter.title}</h2>`;
      (chapter.pages || []).forEach(session => {
        if (session.image) html += `<p style="text-align: center;"><img src="${session.image}" /></p>`;
        // Envelopar em div para MS Word mas com classe para Drop Caps
        html += `<div class="chapter-content-block" style="margin-bottom: 15pt;">${session.text}</div>`;
      });
      html += `</div>`;
      return html;
    }).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><style>${css}</style></head>
      <body>
        <div class="Section1">
           ${coverHtml}
           ${pageBreak}
           ${titlePageHtml}
           ${pageBreak}
           ${dedicationHtml}
           ${pageBreak}
           ${indexHtml}
           ${chaptersHtml}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book?.title || 'Livro'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const pageStyle = {
    width: `${PW}px`, height: `${PH}px`, backgroundColor: bgImage ? 'transparent' : '#fff',
    backgroundImage: bgImage ? `url(${bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
    boxShadow: '0 5px 20px rgba(0,0,0,0.15)', position: 'absolute', top: 0,
    overflow: 'hidden', display: 'flex', flexDirection: 'column'
  };

  const contentStyle = {
    fontFamily: fontFamily, fontSize: `${fontSize}pt`, lineHeight: lineHeight,
    textAlign: textAlign, color: '#111', hyphens: textAlign === 'justify' ? 'auto' : 'none', wordWrap: 'break-word',
  };

  const SafetyMargin = () => showMargins ? (
    <div style={{ position: 'absolute', top: '15px', bottom: '15px', left: '15px', right: '15px', border: '1px dashed rgba(255, 0, 0, 0.4)', pointerEvents: 'none', zIndex: 50 }}>
      <span style={{ position: 'absolute', top: -1, left: 2, fontSize: '9px', color: 'rgba(255,0,0,0.4)' }}>ZONA SEGURA DE CORTE</span>
    </div>
  ) : null;

  // Posições X
  const coverX = (PW + PG) / 2; 
  const titleX = STEP; 
  const dedicationX = STEP + PW + PG; 
  const indexX = 2 * STEP; 
  const textFlowX = 2 * STEP + PW + PG; 
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
          
          {/* Botões de Exportação */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrintPDF} style={{ flex: 1, padding: '0.8rem', background: '#d4af37', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              <Download size={18} /> PDF
            </button>
            <button onClick={handleExportWord} style={{ flex: 1, padding: '0.8rem', background: '#2b579a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              <FileText size={18} /> Word
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>Folhear Páginas</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={goPrev} disabled={currentView === 0} style={{ flex: 1, padding: '0.8rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', cursor: currentView === 0 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', opacity: currentView === 0 ? 0.5 : 1 }}>
                <ArrowUp size={20} />
              </button>
              <button onClick={goNext} disabled={currentView >= maxViews} style={{ flex: 1, padding: '0.8rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', cursor: currentView >= maxViews ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', opacity: currentView >= maxViews ? 0.5 : 1 }}>
                <ArrowDown size={20} />
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888' }}>
              Página atual: {currentView === 0 ? 'Capa' : `${2 * currentView - 1} e ${2 * currentView}`}
            </div>
          </div>

          <button onClick={() => setShowMargins(!showMargins)} style={{ width: '100%', padding: '0.8rem', background: showMargins ? 'rgba(212, 175, 55, 0.1)' : '#f0f0f0', border: `1px solid ${showMargins ? '#d4af37' : '#ccc'}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: showMargins ? '#b5952f' : '#666', fontWeight: 'bold' }}>
            <Layout size={18} /> {showMargins ? 'Ocultar Corte' : 'Mostrar Corte'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b5952f' }}>
              Tipografia Avançada (Vellum)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="dropcaps" checked={useDropCaps} onChange={e => updateSetting('typesettingUseDropCaps', e.target.checked)} />
              <label htmlFor="dropcaps" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>Usar Letras Capitulares (Drop Caps)</label>
            </div>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Plano de Fundo das Páginas (Textura)
              <input type="file" accept="image/*" onChange={handleUploadBackground} style={{ fontSize: '0.7rem' }} />
              {bgImage && <button onClick={() => updateSetting('typesettingBackgroundImage', '')} style={{ fontSize: '0.7rem', color: 'red', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Remover Fundo</button>}
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Ornamento do Capítulo (Floral)
              <input type="file" accept="image/*" onChange={handleUploadOrnament} style={{ fontSize: '0.7rem' }} />
              {chapterOrnament && <button onClick={() => updateSetting('typesettingChapterOrnament', '')} style={{ fontSize: '0.7rem', color: 'red', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Remover Ornamento</button>}
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Distância do Título do Capítulo (px)
              <input type="number" value={chapterMarginTop} onChange={e => updateSetting('typesettingChapterMarginTop', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Fonte</label>
              <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} min={8} max={24} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Espaço</label>
              <input type="number" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} min={1} max={3} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#b5952f' }}>
              Ilustrações de Página Inteira
            </label>
            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Escolha um capítulo para inserir uma arte na página à esquerda (Ex: O Dragão).</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              {(universe?.chapters || []).map((c, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: '#fafafa', padding: '0.5rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  <span style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                  <label style={{ cursor: 'pointer', color: illustrations[idx] ? 'green' : '#2b579a', fontWeight: 'bold' }}>
                    {illustrations[idx] ? 'Alterar Arte' : 'Upload'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadIllustration(e, idx)} />
                  </label>
                  {illustrations[idx] && <button onClick={() => updateSetting('typesettingIllustrations', { ...illustrations, [idx]: null })} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>X</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VIEWPORT DA CAMERA */}
      <div onWheel={handleWheel} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: `${(PW * 2) + PG}px`, height: `${PH}px`, position: 'relative' }}>
          
          <div style={{ 
            position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
            transform: `translateX(-${currentView * STEP}px)`,
          }}>
            
            {Array.from({ length: maxViews + 1 }).map((_, i) => i > 0 ? (
              <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * STEP + PW}px`, width: `${PG}px`, background: 'linear-gradient(to right, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.02) 100%)', zIndex: 5, pointerEvents: 'none' }}></div>
            ) : null)}

            <div style={{ ...pageStyle, left: `${coverX}px`, justifyContent: 'center', alignItems: 'center', background: '#222' }}>
              <SafetyMargin />
              {book?.coverUrl ? (
                <img src={book.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Capa" />
              ) : (
                <div style={{ color: '#fff', textAlign: 'center', padding: '2rem', zIndex: 10 }}>
                  <h1 style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif" }}>{book?.title || 'Título'}</h1>
                </div>
              )}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', zIndex: 20 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <label style={{ background: '#d4af37', color: '#000', padding: '1rem 2rem', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <Upload size={18} /> Alterar Capa
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
                </label>
              </div>
            </div>

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

            <div style={{ ...pageStyle, left: `${dedicationX}px`, padding: `${P}px` }}>
              <SafetyMargin />
              <h2 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", marginBottom: '2rem', textAlign: 'right' }}>Agradecimentos</h2>
              <div contentEditable suppressContentEditableWarning onBlur={handleDedicationChange} style={{ ...contentStyle, fontStyle: 'italic', outline: 'none', textAlign: 'right', flex: 1, position: 'relative', zIndex: 10 }}>
                {universe?.typesettingDedication || 'A todos que tornaram esta obra possível... (Clique para editar)'}
              </div>
            </div>

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

            {Array.from({ length: dynamicPagesCount }).map((_, i) => (
              <div key={i} style={{ ...pageStyle, left: `${textFlowX + i * (PW + PG)}px` }}>
                <SafetyMargin />
                <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: '0.75rem', color: '#999' }}>
                  {fixedPagesCount + i + 1}
                </div>
              </div>
            ))}

            <div 
              ref={contentRef}
              contentEditable suppressContentEditableWarning
              style={{ 
                ...contentStyle, position: 'absolute', left: `${textFlowX + P}px`, top: `${P}px`, 
                width: `${colWidth}px`, height: `${PH - 2*P}px`, 
                columnWidth: `${colWidth}px`, columnGap: `${colGap}px`, columnFill: 'auto',
                zIndex: 2, outline: 'none',
              }}
            >
              <style>{`
                .chapter-content p:first-of-type::first-letter,
                .chapter-content div:first-of-type::first-letter {
                  ${useDropCaps ? `
                    font-size: 3.5em;
                    float: left;
                    margin-right: 8px;
                    margin-top: -5px;
                    line-height: 0.9;
                    font-family: 'Playfair Display', serif;
                  ` : ''}
                }
              `}</style>
              {(universe?.chapters || []).map((chapter, idx) => {
                const sessions = chapter.pages || [];
                return (
                  <React.Fragment key={chapter.id || idx}>
                    {illustrations[idx] && (
                      <div style={{ breakBefore: 'column', breakAfter: 'column', height: '100%', position: 'relative' }}>
                        <img src={illustrations[idx]} style={{ position: 'absolute', top: -P, left: -P, width: PW, height: PH, objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ marginBottom: '3rem', breakInside: 'avoid' }}>
                      <h2 style={{ fontSize: '1.5em', marginBottom: '1.5rem', marginTop: `${chapterMarginTop}px`, textAlign: 'center', fontFamily: "'Playfair Display', serif", breakBefore: 'column' }}>
                        {chapterOrnament && <img src={chapterOrnament} style={{ display: 'block', margin: '0 auto 1.5rem', maxHeight: '50px' }} />}
                        {chapter.title}
                      </h2>
                      <div className="chapter-content">
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
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <div style={{ ...pageStyle, left: `${backCoverX}px`, justifyContent: 'center', alignItems: 'center', background: '#222' }}>
               <h2 style={{ color: '#fff', fontFamily: "'Playfair Display', serif" }}>FIM</h2>
            </div>
          </div>
        </div>
      </div>

      {/* PORTAL DE IMPRESSÃO PDF: Totalmente isolado do React Root */}
      {isPrinting && createPortal(
        <div style={{ ...contentStyle, color: '#000', background: '#fff', textAlign: textAlign }}>
          <style>{`
            @media print {
              @page { size: ${currentFormat.printSize}; margin: ${P}px; }
              @page :first { margin: 0; }
              body { margin: 0; background: #fff; }
              #root { display: none !important; }
              .print-book-wrapper { display: block !important; }
            }
          `}</style>
          
          <div className="print-book-wrapper">
            
            {/* Capa */}
            <div style={{ pageBreakAfter: 'always', breakAfter: 'page', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', color: '#fff' }}>
              {book?.coverUrl ? <img src={book.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <h1>{book?.title}</h1>}
            </div>

            {/* Folha de Rosto */}
            <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
              <div dangerouslySetInnerHTML={{ __html: universe?.typesettingTitlePage || `
                <h1 style="font-size: 2.5em; margin-bottom: 1rem; font-family: 'Playfair Display', serif; text-align: center;">${book?.title || 'Título da Obra'}</h1>
                <p style="font-size: 1.2em; color: #555; text-align: center;">${book?.authorName || 'Autor'}</p>
                <div style="margin: 4rem auto; width: 50px; border-bottom: 1px solid #ccc;"></div>
                <p style="font-size: 0.9em; color: #999; text-align: center;">Sagaflix Publicações</p>
              ` }} />
            </div>

            {/* Agradecimentos */}
            <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
              <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                {universe?.typesettingDedication || 'A todos que tornaram esta obra possível...'}
              </div>
            </div>

            {/* Índice */}
            <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
              <h2 style={{ textAlign: 'center', fontFamily: "'Playfair Display', serif", marginBottom: '2rem' }}>Índice</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(universe?.chapters || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{c.title}</span>
                    <span style={{ borderBottom: '1px dotted #ccc', flex: 1, margin: '0 10px', position: 'relative', top: '-5px' }}></span>
                    <span>Cap. {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Capítulos fluindo verticalmente com paginação nativa */}
            <div>
              {(universe?.chapters || []).map((chapter, idx) => (
                <div key={idx} style={{ breakBefore: 'page', pageBreakBefore: 'always', marginBottom: '3rem' }}>
                  <h2 style={{ fontSize: '1.5em', marginBottom: '1.5rem', textAlign: 'center', fontFamily: "'Playfair Display', serif" }}>
                    {chapter.title}
                  </h2>
                  {(chapter.pages || []).map((session, sIdx) => (
                    <div key={sIdx} style={{ marginBottom: '1.5rem' }}>
                      {session.image && (
                        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                          <img src={session.image} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                        </div>
                      )}
                      <div dangerouslySetInnerHTML={{ __html: session.text }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
