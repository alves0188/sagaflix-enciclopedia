import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Image as ImageIcon } from 'lucide-react';

export default function CustomEditor({ value, onChange, disabled, placeholder, themeColors, editorTheme, headerContent }) {
  const editorRef = useRef(null);
  
  // Guardamos o HTML atual para não acionar o onChange à toa e para saber se o value mudou de fora
  const lastHtml = useRef(value || '');

  // Cores do tema — usa props se recebidas, senão usa cores padrão (escuro)
  const isLight = editorTheme === 'light';
  const tc = themeColors || {
    bg: '#121212', text: '#e0e0e0', panelBg: '#1e1e1e',
    border: '#333', gold: '#d4af37', toolbarBg: 'var(--card-bg)'
  };

  // Sincroniza estado inicial no mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
      lastHtml.current = value || '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza o DOM apenas se o value mudar externamente (ex: trocar de sessão ou livro)
  useEffect(() => {
    if (editorRef.current && value !== lastHtml.current) {
      editorRef.current.innerHTML = value || '';
      lastHtml.current = value || '';
    }
  }, [value]);

  const ensureCursorVisible = () => {
    setTimeout(() => {
      if (!editorRef.current) return;
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) return;

      let rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        const rects = range.getClientRects();
        if (rects.length > 0) {
          rect = rects[0];
        } else {
          const element = range.commonAncestorContainer.nodeType === 1 
            ? range.commonAncestorContainer 
            : range.commonAncestorContainer.parentElement;
          if (element) rect = element.getBoundingClientRect();
          else return;
        }
      }
      
      const editorRect = editorRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;
      
      // No celular, assumimos que o teclado pode cobrir até 50% da tela/editor.
      // Então a zona segura é apenas a metade superior do editor.
      const safeHeight = isMobile ? editorRect.height * 0.45 : editorRect.height;
      const effectiveBottom = editorRect.top + safeHeight;

      const padding = isMobile ? 0 : 40; 

      if (rect.bottom > effectiveBottom - padding) {
        editorRef.current.scrollTop += (rect.bottom - effectiveBottom) + padding + 20;
      } else if (rect.top < editorRect.top + 20) {
        editorRef.current.scrollTop -= (editorRect.top - rect.top) + 20;
      }
    }, 10);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html !== lastHtml.current) {
        lastHtml.current = html;
        onChange(html);
      }
      ensureCursorVisible();
    }
  };

  const execCommand = (command, val = null) => {
    if (disabled) return;
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    // Dispara o input manualmente para capturar mudanças de formatação
    handleInput();
  };

  const handleImageInsert = () => {
    const url = prompt("Insira a URL da imagem:");
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const toolbarStyle = {
    display: 'flex',
    gap: '0.4rem',
    padding: '0.4rem 0.6rem',
    background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
    border: `1px solid ${tc.border}`,
    borderRadius: '8px',
    margin: '0.5rem 0 1rem 0',
    flexWrap: 'wrap',
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{ border: 'none', borderRadius: 0, background: 'transparent', display: 'flex', flexDirection: 'column', minHeight: '80vh', transition: 'background 0.3s ease' }}>
      <div className="sticky-editor-header" style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: tc.bg, transition: 'background-color 0.3s ease' }}>
        {headerContent}
        <div style={toolbarStyle}>
          <button type="button" onClick={() => execCommand('bold')} className="editor-toolbar-btn" title="Negrito"><Bold size={16} /></button>
          <button type="button" onClick={() => execCommand('italic')} className="editor-toolbar-btn" title="Itálico"><Italic size={16} /></button>
          <button type="button" onClick={() => execCommand('underline')} className="editor-toolbar-btn" title="Sublinhado"><Underline size={16} /></button>
          
          <div style={{ width: '1px', background: tc.border, margin: '0 0.4rem' }}></div>

          <button type="button" onClick={() => execCommand('formatBlock', '<h1>')} className="editor-toolbar-btn" style={{ fontWeight: 'bold', fontSize: '13px' }} title="Título H1">H1</button>
          <button type="button" onClick={() => execCommand('formatBlock', '<h2>')} className="editor-toolbar-btn" style={{ fontWeight: 'bold', fontSize: '13px' }} title="Título H2">H2</button>
          <button type="button" onClick={() => execCommand('formatBlock', '<h3>')} className="editor-toolbar-btn" style={{ fontWeight: 'bold', fontSize: '13px' }} title="Título H3">H3</button>
          <button type="button" onClick={() => execCommand('formatBlock', '<p>')} className="editor-toolbar-btn" style={{ fontSize: '13px' }} title="Texto Normal">P</button>

          <div style={{ width: '1px', background: tc.border, margin: '0 0.4rem' }}></div>
          
          <button type="button" onClick={() => execCommand('justifyLeft')} className="editor-toolbar-btn" title="Alinhar à Esquerda"><AlignLeft size={16} /></button>
          <button type="button" onClick={() => execCommand('justifyCenter')} className="editor-toolbar-btn" title="Centralizar"><AlignCenter size={16} /></button>
          <button type="button" onClick={() => execCommand('justifyRight')} className="editor-toolbar-btn" title="Alinhar à Direita"><AlignRight size={16} /></button>

          <div style={{ width: '1px', background: tc.border, margin: '0 0.4rem' }}></div>

          <button type="button" onClick={() => execCommand('insertUnorderedList')} className="editor-toolbar-btn" title="Lista"><List size={16} /></button>
          <button type="button" onClick={handleImageInsert} className="editor-toolbar-btn" title="Inserir Imagem"><ImageIcon size={16} /></button>
        </div>
      </div>
      
      <div 
        ref={editorRef}
        contentEditable={!disabled}
        className="custom-editor-content"
        onInput={(e) => {
          lastHtml.current = e.currentTarget.innerHTML;
          onChange(e.currentTarget.innerHTML);
          ensureCursorVisible();
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
        onMouseUp={ensureCursorVisible}
        onKeyUp={ensureCursorVisible}
        style={{
          flex: 1,
          padding: '1rem 0 50vh 0',
          outline: 'none',
          color: tc.text,
          background: 'transparent',
          opacity: disabled ? 0.7 : 1,
          fontFamily: 'inherit',
          lineHeight: '1.8',
          fontSize: '1.15rem',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          WebkitUserSelect: 'text',
          userSelect: 'text',
          cursor: 'text',
          WebkitTouchCallout: 'default',
          transition: 'background 0.3s ease, color 0.3s ease'
        }}
        data-placeholder={placeholder}
      />
      
      {/* Basic placeholder styling and hover effects using css */}
      <style>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${isLight ? '#999' : 'var(--text-muted)'};
          pointer-events: none;
          display: block; /* For Firefox */
        }
        .editor-toolbar-btn {
          background: none;
          border: none;
          color: ${tc.text};
          cursor: pointer;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0.65;
        }
        .editor-toolbar-btn:hover {
          opacity: 1;
          background: ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'};
          color: ${tc.gold || 'var(--accent-gold)'};
        }
      `}</style>
    </div>
  );
}
