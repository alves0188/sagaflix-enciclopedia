import React, { useState, useEffect, useRef } from 'react';
import { Settings, Printer, Download, BookOpen, ChevronLeft, Type, AlignLeft, Maximize, ChevronRight } from 'lucide-react';

export default function TypesettingDashboard({ book, universe }) {
  // Configurações de Formato Físico
  const [format, setFormat] = useState('14x21'); // '14x21', 'a5', 'pocket'
  const [fontFamily, setFontFamily] = useState('Merriweather, serif');
  const [fontSize, setFontSize] = useState(11);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textAlign, setTextAlign] = useState('justify');

  // Referência para calcular páginas dinâmicas
  const contentRef = useRef(null);
  const [dynamicPagesCount, setDynamicPagesCount] = useState(1);

  // Formatos físicos
  const formats = {
    '14x21': { name: 'Literatura (14x21cm)', width: 530, height: 794, padding: 60 }, // approx px for print
    'a5': { name: 'A5 (14.8x21cm)', width: 560, height: 794, padding: 60 },
    'pocket': { name: 'Pocket (11x18cm)', width: 416, height: 680, padding: 40 }
  };

  const currentFormat = formats[format];
  const gap = 40; // espaço visual entre páginas

  // Atualizar estimativa de páginas
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        // scrollWidth do container de colunas nos diz quantas colunas foram criadas
        const totalWidth = contentRef.current.scrollWidth;
        const pageAreaWidth = currentFormat.width - (currentFormat.padding * 2);
        
        // Cada coluna tem a largura da área útil + o gap
        const columnFullWidth = pageAreaWidth + gap;
        
        const count = Math.ceil(totalWidth / columnFullWidth);
        setDynamicPagesCount(count > 0 ? count : 1);
      }
    };

    // Timeout para esperar renderização da fonte e imagens
    const timer = setTimeout(measure, 300);
    window.addEventListener('resize', measure);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [format, fontFamily, fontSize, lineHeight, textAlign, universe]);

  // Total de páginas incluindo as fixas (Capa + Rosto + Dedicatória + Índice)
  const fixedPagesCount = 4;
  const estimatedPages = fixedPagesCount + dynamicPagesCount;

  // Estilos comuns das páginas para não repetir
  const pageStyle = {
    width: `${currentFormat.width}px`,
    height: `${currentFormat.height}px`,
    backgroundColor: '#fff',
    boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
    borderRadius: '2px',
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

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      width: '100%',
      backgroundColor: '#e5e5e5',
      color: '#333',
      fontFamily: 'system-ui, sans-serif'
    }}>
      
      {/* Sidebar de Ferramentas (Design) */}
      <div style={{ 
        width: '300px', 
        backgroundColor: '#fff', 
        borderRight: '1px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
        zIndex: 10
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={24} color="#d4af37" />
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: '#000' }}>Diagramação</h2>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#8a6d3b' }}>
            Role a tela para o lado direito para folhear as páginas do seu livro. As páginas obrigatórias foram adicionadas automaticamente.
          </div>

          {/* Formato */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Maximize size={16} /> Tamanho do Livro
            </label>
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa', fontSize: '0.9rem' }}
            >
              {Object.entries(formats).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Tipografia e Estilos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Type size={16} /> Tipografia
            </label>
            <select 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa', fontSize: '0.9rem' }}
            >
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
              <input 
                type="number" 
                value={fontSize} 
                onChange={(e) => setFontSize(Number(e.target.value))}
                min={8} max={24}
                style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Espaçamento</label>
              <input 
                type="number" 
                step="0.1"
                value={lineHeight} 
                onChange={(e) => setLineHeight(Number(e.target.value))}
                min={1} max={3}
                style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa' }}
              />
            </div>
          </div>

          {/* Alinhamento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlignLeft size={16} /> Alinhamento
            </label>
            <select 
              value={textAlign} 
              onChange={(e) => setTextAlign(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fafafa', fontSize: '0.9rem' }}
            >
              <option value="justify">Justificado</option>
              <option value="left">Alinhado à Esquerda</option>
            </select>
          </div>
          
        </div>

        {/* Footer Sidebar */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Páginas Est.:</span>
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

      {/* Mesa de Trabalho (Scroll Horizontal para Folhear) */}
      <div style={{ 
        flex: 1, 
        overflowX: 'auto',
        overflowY: 'auto',
        padding: '4rem',
        display: 'flex',
        alignItems: 'center',
        gap: `${gap}px` // Espaço entre as páginas
      }}>
        
        {/* 1. Página de Capa (Obrigatória) */}
        <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center', background: '#222' }}>
          {book?.coverUrl ? (
            <img src={book.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Capa" />
          ) : (
            <div style={{ color: '#fff', textAlign: 'center', padding: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif" }}>{book?.title || 'Título'}</h1>
              <p>[Sua capa aparecerá aqui]</p>
            </div>
          )}
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px' }}>CAPA</div>
        </div>

        {/* 2. Folha de Rosto (Obrigatória) */}
        <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center', padding: `${currentFormat.padding}px` }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2em', marginBottom: '1rem', fontFamily: "'Playfair Display', serif" }}>{book?.title || 'Título da Obra'}</h1>
            <p style={{ fontSize: '1.2em', color: '#555' }}>{book?.authorName || 'Autor'}</p>
            <div style={{ margin: '4rem auto', width: '50px', borderBottom: '1px solid #ccc' }}></div>
            <p style={{ fontSize: '0.9em', color: '#999' }}>Sagaflix Publicações</p>
          </div>
          <div style={{ position: 'absolute', top: 10, left: 10, color: '#ccc', fontSize: '0.7rem' }}>FOLHA DE ROSTO</div>
        </div>

        {/* 3. Agradecimentos (Obrigatória) */}
        <div style={{ ...pageStyle, padding: `${currentFormat.padding}px` }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", marginBottom: '2rem', textAlign: 'right' }}>Agradecimentos</h2>
          <div 
            contentEditable 
            suppressContentEditableWarning
            style={{ ...contentStyle, fontStyle: 'italic', outline: 'none', textAlign: 'right', flex: 1 }}
          >
            A todos que tornaram esta obra possível... (Clique para editar)
          </div>
          <div style={{ position: 'absolute', top: 10, left: 10, color: '#ccc', fontSize: '0.7rem' }}>AGRADECIMENTOS</div>
        </div>

        {/* 4. Índice (Obrigatória) */}
        <div style={{ ...pageStyle, padding: `${currentFormat.padding}px` }}>
          <h2 style={{ fontSize: '1.5em', fontFamily: "'Playfair Display', serif", marginBottom: '2rem', textAlign: 'center' }}>Índice</h2>
          <div style={{ ...contentStyle, outline: 'none', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(universe?.chapters || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{c.title}</span>
                <span style={{ borderBottom: '1px dotted #ccc', flex: 1, margin: '0 10px', position: 'relative', top: '-5px' }}></span>
                <span>...</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', top: 10, left: 10, color: '#ccc', fontSize: '0.7rem' }}>ÍNDICE</div>
        </div>

        {/* Fluxo do Texto Principal (Auto-paginado pelo CSS Columns) */}
        <div style={{ position: 'relative', display: 'flex' }}>
          
          {/* Camada de Fundos (Backdrops das páginas virtuais) */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', gap: `${gap}px`, zIndex: 1, pointerEvents: 'none' }}>
            {Array.from({ length: dynamicPagesCount }).map((_, i) => (
              <div key={i} style={{ 
                width: `${currentFormat.width}px`, 
                height: `${currentFormat.height}px`, 
                backgroundColor: '#fff', 
                boxShadow: '0 5px 20px rgba(0,0,0,0.15)', 
                flexShrink: 0,
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: '0.75rem', color: '#999' }}>
                  {fixedPagesCount + i + 1}
                </div>
              </div>
            ))}
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
              columnGap: `${gap + (currentFormat.padding * 2)}px`,
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
                    breakBefore: 'column' // Força o capítulo a começar numa nova coluna (página)
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
    </div>
  );
}
