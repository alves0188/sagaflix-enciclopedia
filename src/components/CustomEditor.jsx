import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Image as ImageIcon } from 'lucide-react';

export default function CustomEditor({ value, onChange, disabled, placeholder, themeColors, editorTheme }) {
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
      
      const visibleBottom = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const editorRect = editorRef.current.getBoundingClientRect();
      const effectiveBottom = Math.min(editorRect.bottom, visibleBottom);

      const padding = 40; 

      if (rect.bottom > effectiveBottom - padding) {
        editorRef.current.scrollTop += (rect.bottom - effectiveBottom) + padding + 20;
      } else if (rect.top < editorRect.top + padding) {
        editorRef.current.scrollTop -= (editorRect.top - rect.top) + padding;
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
    gap: '0.5rem',
    padding: '0.5rem',
    background: tc.toolbarBg || tc.panelBg,
    borderBottom: `1px solid ${tc.border}`,
    flexWrap: 'wrap',
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    transition: 'background 0.3s ease'
  };

  const btnStyle = {
    background: 'none',
    border: 'none',
    color: tc.text,
    cursor: 'pointer',
    padding: '0.4rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.3s ease'
  };

  return (
    <div style={{ border: `1px solid ${tc.border}`, borderRadius: '8px', overflow: 'hidden', background: tc.bg, display: 'flex', flexDirection: 'column', height: '60vh', minHeight: '400px', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
      <div style={toolbarStyle}>
        <button type="button" onClick={() => execCommand('bold')} style={btnStyle} title="Negrito"><Bold size={16} /></button>
        <button type="button" onClick={() => execCommand('italic')} style={btnStyle} title="Itálico"><Italic size={16} /></button>
        <button type="button" onClick={() => execCommand('underline')} style={btnStyle} title="Sublinhado"><Underline size={16} /></button>
        
        <div style={{ width: '1px', background: tc.border, margin: '0 0.5rem' }}></div>
        
        <button type="button" onClick={() => execCommand('justifyLeft')} style={btnStyle} title="Alinhar à Esquerda"><AlignLeft size={16} /></button>
        <button type="button" onClick={() => execCommand('justifyCenter')} style={btnStyle} title="Centralizar"><AlignCenter size={16} /></button>
        <button type="button" onClick={() => execCommand('justifyRight')} style={btnStyle} title="Alinhar à Direita"><AlignRight size={16} /></button>

        <div style={{ width: '1px', background: tc.border, margin: '0 0.5rem' }}></div>

        <button type="button" onClick={() => execCommand('insertUnorderedList')} style={btnStyle} title="Lista"><List size={16} /></button>
        <button type="button" onClick={handleImageInsert} style={btnStyle} title="Inserir Imagem"><ImageIcon size={16} /></button>
      </div>
      
      <div 
        ref={editorRef}
        contentEditable={!disabled}
        tabIndex={0}
        onInput={handleInput}
        onBlur={handleInput}
        spellCheck="true"
        onClick={() => {
          if (!disabled && editorRef.current) {
            editorRef.current.focus();
          }
          ensureCursorVisible();
        }}
        onKeyUp={ensureCursorVisible}
        style={{
          flex: 1,
          padding: '1rem',
          outline: 'none',
          color: tc.text,
          background: tc.bg,
          opacity: disabled ? 0.7 : 1,
          fontFamily: 'inherit',
          lineHeight: '1.6',
          overflowY: 'auto',
          WebkitUserSelect: 'text',
          userSelect: 'text',
          cursor: 'text',
          WebkitTouchCallout: 'default',
          transition: 'background 0.3s ease, color 0.3s ease'
        }}
        data-placeholder={placeholder}
        // Sem dangerouslySetInnerHTML aqui para evitar conflitos pesados do React 
        // O useEffect inicializa e gerencia as atualizações de HTML
      />
      
      {/* Basic placeholder styling using css */}
      <style>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${isLight ? '#999' : 'var(--text-muted)'};
          pointer-events: none;
          display: block; /* For Firefox */
        }
      `}</style>
    </div>
  );
}
