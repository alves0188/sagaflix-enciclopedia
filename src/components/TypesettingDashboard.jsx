import React, { useState, useEffect, useRef } from 'react';
import { Settings, Printer, Download, BookOpen, ChevronLeft, Type, AlignLeft, Maximize, ChevronRight, Upload, Layout } from 'lucide-react';

export default function TypesettingDashboard({ book, universe, onUpdateBook, onUpdateData }) {
  // Configurações de Formato Físico
  const [format, setFormat] = useState('14x21'); 
  const [fontFamily, setFontFamily] = useState('Merriweather, serif');
  const [fontSize, setFontSize] = useState(11);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textAlign, setTextAlign] = useState('justify');
  const [showMargins, setShowMargins] = useState(true);

  const contentRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [dynamicPagesCount, setDynamicPagesCount] = useState(1);

  // Formatos físicos (px proporcionais para tela)
  const formats = {
    '14x21': { name: 'Literatura (14x21cm)', width: 530, height: 794, padding: 60 },
    'a5': { name: 'A5 (14.8x21cm)', width: 560, height: 794, padding: 60 },
    'pocket': { name: 'Pocket (11x18cm)', width: 416, height: 680, padding: 40 }
  };

  const currentFormat = formats[format];
  const gap = 0; // O gap entre páginas de um spread deve ser 0 para parecer um livro aberto!
  const spreadGap = 100; // Espaço entre os spreads

  // Atualizar estimativa de páginas
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        const totalWidth = contentRef.current.scrollWidth;
        const pageAreaWidth = currentFormat.width - (currentFormat.padding * 2);
        
        // Com gap 0, a largura da coluna é exata a área útil
        const columnFullWidth = pageAreaWidth + (currentFormat.padding * 2);
        
        const count = Math.ceil(totalWidth / columnFullWidth);
        setDynamicPagesCount(count > 0 ? count : 1);
      }
    };

    const timer = setTimeout(measure, 500);
    window.addEventListener('resize', measure);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [format, fontFamily, fontSize, lineHeight, textAlign, universe]);

  const fixedPagesCount = 4; // Capa, Rosto, Agradecimentos, Índice
  const estimatedPages = fixedPagesCount + dynamicPagesCount + 1; // +1 contracapa

  // Funções de Navegação
  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -(currentFormat.width * 2 + spreadGap), behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: (currentFormat.width * 2 + spreadGap), behavior: 'smooth' });
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

  // Salvar edições visuais da folha de rosto
  const handleTitlePageChange = (e) => {
    if (onUpdateData) {
      onUpdateData({ ...universe, typesettingTitlePage: e.currentTarget.innerHTML });
    }
  };

  const pageStyle = {
    width: `${currentFormat.width}px`,
    height: `${currentFormat.height}px`,
    backgroundColor: '#fff',
    boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
    flexShrink: 0,
    position: 'relative',
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

  // Margem de Segurança Visual
  const SafetyMargin = () => showMargins ? (
    <div style={{
      position: 'absolute',
      top: currentFormat.padding,
      bottom: currentFormat.padding,
      left: currentFormat.padding,
      right: currentFormat.padding,
      border: '1px dashed rgba(212, 175, 55, 0.6)',
      pointerEvents: 'none',
      zIndex: 50
    }} />
  ) : null;

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      width: '100%',
      backgroundColor: '#2b2b2b', // Fundo escuro atrás do livro destaca mais as folhas brancas
      color: '#333',
      fontFamily: 'system-ui, sans-serif'
    }}>
      
      {/* Sidebar de Ferramentas */}
      <div style={{ 
        width: '320px', 
        backgroundColor: '#fff', 
        borderRight: '1px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
        zIndex: 100
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={24} color="#d4af37" />
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: '#000' }}>Diagramação</h2>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Navegação Rápida */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={scrollPrev} style={{ flex: 1, padding: '0.8rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={scrollNext} style={{ flex: 1, padding: '0.8rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
              <ChevronRight size={20} />
            </button>
          </div>

          <button onClick={() => setShowMargins(!showMargins)} style={{ width: '100%', padding: '0.8rem', background: showMargins ? 'rgba(212, 175, 55, 0.1)' : '#f0f0f0', border: `1px solid ${showMargins ? '#d4af37' : '#ccc'}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: showMargins ? '#b5952f' : '#666', fontWeight: 'bold' }}>
            <Layout size={18} /> {showMargins ? 'Ocultar Margens' : 'Mostrar Margens'}
          </button>

          {/* Formato */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Maximize size={16} /> Tamanho do Livro
            </label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }}>
              {Object.entries(formats).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </div>

          {/* Tipografia e Estilos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Type size={16} /> Tipografia
            </label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }}>
              <option value="Merriweather, serif">Merriweather (Clássica)</option>
              <option value="Lora, serif">Lora (Suave)</option>
              <option value="'EB Garamond', serif">Garamond (Elegante)</option>
              <option value="'Open Sans', sans-serif">Open Sans (Moderna)</option>
            </select>
          </div>

          {/* Controles numéricos */}
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

          {/* Alinhamento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlignLeft size={16} /> Alinhamento
            </label>
            <select value={textAlign} onChange={(e) => setTextAlign(e.target.value)} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }}>
              <option value="justify">Justificado</option>
              <option value="left">Alinhado à Esquerda</option>
            </select>
          </div>
          
        </div>

        {/* Footer Sidebar */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Total de Páginas:</span>
            <strong style={{ fontSize: '1.2rem', color: '#000' }}>{estimatedPages}</strong>
          </div>
          
          <button style={{ 
            width: '100%', padding: '1rem', backgroundColor: '#d4af37', color: '#000', 
            border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}>
            <Download size={18} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Mesa de Trabalho (Viewport para simular as duplas de páginas) */}
      <div 
        ref={scrollContainerRef}
        style={{ 
          flex: 1, 
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          alignItems: 'center',
          padding: '2rem 5rem',
          scrollBehavior: 'smooth',
          gap: `${spreadGap}px`
        }}
      >
        
        {/* === SPREAD 1: Vazio (Esquerda) + Capa (Direita) === */}
        <div style={{ display: 'flex', gap: `${gap}px`, flexShrink: 0 }}>
          {/* Lado Esquerdo invisível para empurrar a Capa para a direita */}
          <div style={{ width: `${currentFormat.width}px`, height: `${currentFormat.height}px`, visibility: 'hidden' }}></div>
          
          {/* Lado Direito: Capa */}
          <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center', background: '#222', position: 'relative' }}>
            <SafetyMargin />
            {book?.coverUrl ? (
              <img src={book.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Capa" />
            ) : (
              <div style={{ color: '#fff', textAlign: 'center', padding: '2rem', zIndex: 10 }}>
                <h1 style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif" }}>{book?.title || 'Título'}</h1>
                <p>[Sua capa aparecerá aqui]</p>
              </div>
            )}
            
            {/* Overlay para subir imagem */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', zIndex: 20 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              <label style={{ background: '#d4af37', color: '#000', padding: '1rem 2rem', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                <Upload size={18} /> Alterar Capa
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* === SPREAD 2: Folha de Rosto (Esquerda) + Agradecimentos (Direita) === */}
        <div style={{ display: 'flex', gap: `${gap}px`, flexShrink: 0, position: 'relative' }}>
          {/* Lombada Visual */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '40px', transform: 'translateX(-50%)', background: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 100%)', zIndex: 5, pointerEvents: 'none' }}></div>

          {/* Folha de Rosto */}
          <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center', padding: `${currentFormat.padding}px` }}>
            <SafetyMargin />
            <div 
              contentEditable 
              suppressContentEditableWarning
              onBlur={handleTitlePageChange}
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
          <div style={{ ...pageStyle, padding: `${currentFormat.padding}px` }}>
            <SafetyMargin />
            <h2 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", marginBottom: '2rem', textAlign: 'right' }}>Agradecimentos</h2>
            <div 
              contentEditable 
              suppressContentEditableWarning
              style={{ ...contentStyle, fontStyle: 'italic', outline: 'none', textAlign: 'right', flex: 1, position: 'relative', zIndex: 10 }}
            >
              A todos que tornaram esta obra possível... (Clique para editar)
            </div>
          </div>
        </div>

        {/* === SPREAD 3: Índice (Esquerda) + Início do Texto (Direita -> ...) === */}
        {/* O texto do Índice fica na Esquerda do Spread 3. O Texto flui a partir da Direita! */}
        
        {/* Precisamos de um wrapper que junta o Índice com o início do Fluxo de Texto */}
        <div style={{ display: 'flex', gap: `${gap}px`, flexShrink: 0, position: 'relative' }}>
          {/* Lombada Visual para o primeiro spread de texto */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '40px', transform: 'translateX(-50%)', background: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 100%)', zIndex: 5, pointerEvents: 'none' }}></div>

          {/* Índice */}
          <div style={{ ...pageStyle, padding: `${currentFormat.padding}px` }}>
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

          {/* Início do Fluxo do Texto Principal (CSS Columns) */}
          {/* Ele vai se esticar para a direita gerando os próximos spreads sozinho! */}
          <div style={{ position: 'relative', display: 'flex' }}>
            
            {/* Camada de Fundos (Backdrops das páginas virtuais do texto) */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', gap: `${gap}px`, zIndex: 1, pointerEvents: 'none' }}>
              {Array.from({ length: dynamicPagesCount }).map((_, i) => {
                // Se i for par, é a página da esquerda do spread
                const isLeftPage = i % 2 === 0;
                return (
                  <div key={i} style={{ 
                    width: `${currentFormat.width}px`, 
                    height: `${currentFormat.height}px`, 
                    backgroundColor: '#fff', 
                    boxShadow: '0 5px 20px rgba(0,0,0,0.15)', 
                    flexShrink: 0,
                    position: 'relative',
                    // Adiciona o gap visual de spreads apenas a cada 2 páginas (após a página direita)
                    marginRight: !isLeftPage ? `${spreadGap}px` : '0px'
                  }}>
                    {/* Lombada Visual no meio do spread */}
                    {!isLeftPage && (
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '40px', transform: 'translateX(-50%)', background: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 100%)', zIndex: 5, pointerEvents: 'none' }}></div>
                    )}
                    <SafetyMargin />
                    <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: '0.75rem', color: '#999' }}>
                      {fixedPagesCount + i + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* O Texto Contínuo que preenche as colunas */}
            <div 
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              style={{ 
                ...contentStyle,
                zIndex: 2, 
                position: 'relative',
                outline: 'none',
                
                // A Mágica da Paginação CSS
                height: `${currentFormat.height - (currentFormat.padding * 2)}px`,
                padding: `${currentFormat.padding}px`,
                columnWidth: `${currentFormat.width - (currentFormat.padding * 2)}px`,
                // O gap da coluna precisa compensar o padding E o spreadGap quando pula de spread!
                // MAS O CSS Columns só aceita um gap uniforme.
                // Como não podemos alternar o columnGap, vamos manter o gap 0 e usar os backgrounds espalhados.
                // ESPERA! Se o background tem `marginRight: spreadGap`, a COLUNA CSS também precisa pular esse buraco!
                // Isso não é possível nativamente com css columns. 
                // SOLUÇÃO: Não usamos `spreadGap` no meio do texto contínuo. 
                // Mantemos o `spreadGap` = 0 durante o fluxo do texto, mas desenhamos a lombada a cada 2 páginas.
                // Para simplificar a rolagem, o texto contínuo será um bloco denso de páginas coladas 2-a-2.
                columnGap: `${currentFormat.padding * 2}px`, // O gap é exatamente 2 paddings para que a próxima coluna comece onde deveria
                columnFill: 'auto',
              }}
            >
              {(universe?.chapters || []).map((chapter, idx) => {
                const sessions = chapter.pages || [];
                return (
                  <div key={chapter.id || idx} style={{ marginBottom: '3rem', breakInside: 'avoid' }}>
                    <h2 style={{ 
                      fontSize: '1.5em', 
                      marginBottom: '1.5rem', 
                      textAlign: 'center',
                      fontFamily: "'Playfair Display', serif",
                      breakBefore: 'column'
                    }}>
                      {chapter.title}
                    </h2>
                    
                    {sessions.map((session, sIdx) => (
                      <div key={sIdx} style={{ marginBottom: '1.5rem' }}>
                        {session.image && (
                          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                            <img src={session.image} alt="Ilustração" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                          </div>
                        )}
                        <div 
                          dangerouslySetInnerHTML={{ __html: session.text }} 
                          style={{ all: 'unset', display: 'block' }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
        
        {/* === ÚLTIMO SPREAD: Contracapa sozinha (Esquerda) === */}
        {/* Como ela fica na esquerda do spread vazio, precisamos apenas de um spread normal */}
        <div style={{ display: 'flex', gap: `${gap}px`, flexShrink: 0, marginLeft: `${spreadGap}px` }}>
          <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center', background: '#222' }}>
             <h2 style={{ color: '#fff', fontFamily: "'Playfair Display', serif" }}>FIM</h2>
             <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px' }}>CONTRACAPA</div>
          </div>
          {/* Lado Direito invisível */}
          <div style={{ width: `${currentFormat.width}px`, height: `${currentFormat.height}px`, visibility: 'hidden' }}></div>
        </div>

      </div>
    </div>
  );
}
