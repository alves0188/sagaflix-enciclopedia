import React, { useState, useEffect, useRef } from 'react';
import { Settings, Printer, Download, BookOpen, ChevronLeft, Type, AlignLeft, Maximize } from 'lucide-react';

export default function TypesettingDashboard({ book, universe }) {
  // Configurações de Formato Físico
  const [format, setFormat] = useState('14x21'); // '14x21', 'a5', 'pocket'
  const [fontFamily, setFontFamily] = useState('Merriweather, serif');
  const [fontSize, setFontSize] = useState(11);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textAlign, setTextAlign] = useState('justify');

  // Referência para calcular páginas
  const contentRef = useRef(null);
  const [estimatedPages, setEstimatedPages] = useState(0);

  // Formatos
  const formats = {
    '14x21': { name: 'Literatura (14x21cm)', width: '14cm', height: '21cm', padding: '2cm 1.5cm' },
    'a5': { name: 'A5 (14.8x21cm)', width: '14.8cm', height: '21cm', padding: '2cm 1.5cm' },
    'pocket': { name: 'Pocket (11x18cm)', width: '11cm', height: '18cm', padding: '1.5cm 1cm' }
  };

  const currentFormat = formats[format];

  // Atualizar estimativa de páginas
  useEffect(() => {
    if (contentRef.current) {
      // Pega a altura total renderizada em pixels
      const totalHeightPx = contentRef.current.scrollHeight;
      
      // Converte a altura física da página de CM para PX (aproximadamente 38px por cm)
      const pageHeightCm = parseFloat(currentFormat.height.replace('cm', ''));
      const pageHeightPx = pageHeightCm * 38; 
      
      const pages = Math.ceil(totalHeightPx / pageHeightPx);
      setEstimatedPages(pages || 1);
    }
  }, [format, fontFamily, fontSize, lineHeight, textAlign, book]);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      width: '100%',
      backgroundColor: '#e5e5e5', // Tema claro forçado na mesa de trabalho
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

          {/* Fonte */}
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

          {/* Controles de Tamanho */}
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
            <strong style={{ fontSize: '1.2rem', color: '#000' }}>~{estimatedPages}</strong>
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

      {/* Mesa de Trabalho (Canvas) */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}>
        
        {/* Aviso */}
        <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#8a6d3b', padding: '1rem 2rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(212, 175, 55, 0.3)', textAlign: 'center', maxWidth: '600px' }}>
          <strong>Modo de Visualização Contínua:</strong> Aqui você vê o fluxo do texto com a largura exata da página. A quebra de página real será calculada no PDF final.
        </div>

        {/* Papel Virtual */}
        <div 
          ref={contentRef}
          className="typesetting-paper"
          style={{
            backgroundColor: '#fff',
            width: currentFormat.width,
            minHeight: currentFormat.height,
            padding: currentFormat.padding,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            borderRadius: '2px',
            
            // Configurações Tipográficas Dinâmicas
            fontFamily: fontFamily,
            fontSize: `${fontSize}pt`,
            lineHeight: lineHeight,
            textAlign: textAlign,
            color: '#111',
            
            // Permite hifenação no justificado
            hyphens: textAlign === 'justify' ? 'auto' : 'none',
            wordWrap: 'break-word',
          }}
        >
          {/* Título do Livro como Folha de Rosto Simulada */}
          <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '4rem' }}>
            <h1 style={{ fontSize: '2em', marginBottom: '1rem', fontFamily: "'Playfair Display', serif" }}>{book?.title || 'Título da Obra'}</h1>
            <p style={{ fontSize: '1.2em', color: '#555' }}>Por: {book?.authorName || 'Autor'}</p>
          </div>
          
          <div style={{ borderBottom: '1px solid #ccc', margin: '4rem 0' }}></div>

          {/* Capítulos Renderizados */}
          {(universe?.chapters || []).map((chapter, idx) => {
            const sessions = chapter.pages || [];
            return (
              <div key={chapter.id || idx} style={{ marginBottom: '3rem' }}>
                <h2 style={{ 
                  fontSize: '1.5em', 
                  marginBottom: '1.5rem', 
                  textAlign: 'center',
                  fontFamily: "'Playfair Display', serif",
                  pageBreakBefore: 'always' // Ajuda na exportação
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
                      className="typesetting-content"
                      dangerouslySetInnerHTML={{ __html: session.text }} 
                      style={{
                        // Remove estilos injetados pelo editor web que quebram a impressão
                        all: 'unset', 
                        display: 'block'
                      }}
                    />
                  </div>
                ))}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
