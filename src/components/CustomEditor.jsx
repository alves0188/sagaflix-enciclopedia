import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Image as ImageIcon } from 'lucide-react';

export default function CustomEditor({ value, onChange, disabled, placeholder }) {
  const [content, setContent] = useState(value || '');
  const editorRef = useRef(null);

  useEffect(() => {
    if (value !== content) {
      setContent(value || '');
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setContent(newHtml);
      onChange(newHtml);
    }
  };

  const execCommand = (command, value = null) => {
    if (disabled) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
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
    pointerEvents: disabled ? 'none' : 'auto'
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
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
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
        style={{
          minHeight: '200px',
          padding: '1rem',
          outline: 'none',
          color: 'var(--text-main)',
          opacity: disabled ? 0.7 : 1,
          fontFamily: 'inherit',
          lineHeight: '1.6',
          overflowY: 'auto'
        }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        data-placeholder={placeholder}
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
