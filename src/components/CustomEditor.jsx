import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Image as ImageIcon } from 'lucide-react';

export default function CustomEditor({ value, onChange, disabled, placeholder }) {
  const editorRef = useRef(null);
  
  // Guardamos o HTML atual para não acionar o onChange à toa e para saber se o value mudou de fora
  const lastHtml = useRef(value || '');

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

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html !== lastHtml.current) {
        lastHtml.current = html;
        onChange(html);
      }
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
    background: 'var(--card-bg)',
    borderBottom: '1px solid var(--border-color)',
    flexWrap: 'wrap',
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    position: 'sticky',
    top: 0,
    zIndex: 10
  };

  const btnStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--text-main)',
    cursor: 'pointer',
    padding: '0.4rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', height: '60vh', minHeight: '400px' }}>
      <div style={toolbarStyle}>
        <button type="button" onClick={() => execCommand('bold')} style={btnStyle} title="Negrito"><Bold size={16} /></button>
        <button type="button" onClick={() => execCommand('italic')} style={btnStyle} title="Itálico"><Italic size={16} /></button>
        <button type="button" onClick={() => execCommand('underline')} style={btnStyle} title="Sublinhado"><Underline size={16} /></button>
        
        <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
        
        <button type="button" onClick={() => execCommand('justifyLeft')} style={btnStyle} title="Alinhar à Esquerda"><AlignLeft size={16} /></button>
        <button type="button" onClick={() => execCommand('justifyCenter')} style={btnStyle} title="Centralizar"><AlignCenter size={16} /></button>
        <button type="button" onClick={() => execCommand('justifyRight')} style={btnStyle} title="Alinhar à Direita"><AlignRight size={16} /></button>

        <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>

        <button type="button" onClick={() => execCommand('insertUnorderedList')} style={btnStyle} title="Lista"><List size={16} /></button>
        <button type="button" onClick={handleImageInsert} style={btnStyle} title="Inserir Imagem"><ImageIcon size={16} /></button>
      </div>
      
      <div 
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onBlur={handleInput}
        style={{
          flex: 1,
          padding: '1rem',
          outline: 'none',
          color: 'var(--text-main)',
          opacity: disabled ? 0.7 : 1,
          fontFamily: 'inherit',
          lineHeight: '1.6',
          overflowY: 'auto'
        }}
        data-placeholder={placeholder}
        // Sem dangerouslySetInnerHTML aqui para evitar conflitos pesados do React 
        // O useEffect inicializa e gerencia as atualizações de HTML
      />
      
      {/* Basic placeholder styling using css */}
      <style>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-muted);
          pointer-events: none;
          display: block; /* For Firefox */
        }
      `}</style>
    </div>
  );
}
