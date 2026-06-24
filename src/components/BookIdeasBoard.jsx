import { useState, useEffect, useRef } from 'react';
import { Palette, Plus, ChevronDown, ChevronUp, Trash2, Maximize2, X } from 'lucide-react';

const COLORS = [
  { hex: '#FFE082', name: 'Amarelo' },
  { hex: '#90CAF9', name: 'Azul' },
  { hex: '#A5D6A7', name: 'Verde' },
  { hex: '#F48FB1', name: 'Rosa' },
  { hex: '#CE93D8', name: 'Roxo' },
  { hex: '#FFCC80', name: 'Laranja' }
];

const DEFAULT_LEGENDS = {
  '#FFE082': 'Ideia Geral',
  '#90CAF9': 'Enredo / Plot',
  '#A5D6A7': 'Personagem',
  '#F48FB1': 'Cena / Diálogo',
  '#CE93D8': 'Worldbuilding',
  '#FFCC80': 'Outros'
};

function DebouncedInput({ value, onChange, placeholder, style }) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(val);
    }, 800);
  };

  return <input type="text" value={localValue || ''} onChange={handleChange} onBlur={() => onChange(localValue)} placeholder={placeholder} style={style} />;
}

function DebouncedTextarea({ value, onChange, placeholder, style, onFocus }) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(val);
    }, 800);
  };

  return <textarea value={localValue || ''} onChange={handleChange} onBlur={() => onChange(localValue)} onFocus={onFocus} placeholder={placeholder} style={style} />;
}

export default function BookIdeasBoard({ book, onUpdateBook }) {
  const [showLegends, setShowLegends] = useState(false);
  const [draggedIdeaIdx, setDraggedIdeaIdx] = useState(null);
  const [expandedIdeaId, setExpandedIdeaId] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setExpandedIdeaId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ideas = book.ideas || [];
  const ideaLegends = { ...DEFAULT_LEGENDS, ...(book.ideaLegends || {}) };

  const handleAddIdea = () => {
    const newIdea = {
      id: 'idea_' + Date.now() + Math.floor(Math.random() * 1000),
      title: '',
      text: '',
      color: '#FFE082' // Default amarelo
    };
    const updatedIdeas = [newIdea, ...ideas];
    onUpdateBook({ ...book, ideas: updatedIdeas });
  };

  const handleDragStart = (idx) => {
    setDraggedIdeaIdx(idx);
  };

  const handleDrop = (idx) => {
    if (draggedIdeaIdx === null || draggedIdeaIdx === idx) return;
    
    const updatedIdeas = [...ideas];
    const draggedItem = updatedIdeas[draggedIdeaIdx];
    
    updatedIdeas.splice(draggedIdeaIdx, 1);
    updatedIdeas.splice(idx, 0, draggedItem);
    
    onUpdateBook({ ...book, ideas: updatedIdeas });
    setDraggedIdeaIdx(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpdateIdeaTitle = (id, newTitle) => {
    const updatedIdeas = ideas.map(idea => idea.id === id ? { ...idea, title: newTitle } : idea);
    onUpdateBook({ ...book, ideas: updatedIdeas });
  };

  const handleUpdateIdeaText = (id, newText) => {
    const updatedIdeas = ideas.map(idea => idea.id === id ? { ...idea, text: newText } : idea);
    onUpdateBook({ ...book, ideas: updatedIdeas });
  };

  const handleUpdateIdeaColor = (id, colorHex) => {
    const updatedIdeas = ideas.map(idea => idea.id === id ? { ...idea, color: colorHex } : idea);
    onUpdateBook({ ...book, ideas: updatedIdeas });
  };

  const handleDeleteIdea = (id) => {
    const updatedIdeas = ideas.filter(idea => idea.id !== id);
    onUpdateBook({ ...book, ideas: updatedIdeas });
  };

  const handleUpdateLegend = (colorHex, text) => {
    const updatedLegends = {
      ...ideaLegends,
      [colorHex]: text
    };
    onUpdateBook({ ...book, ideaLegends: updatedLegends });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0, padding: '1.5rem 1.5rem 0 1.5rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0, fontSize: '15pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Painel de Ideias: {book.title}
        </h2>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowLegends(!showLegends)} 
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center', padding: '0.6rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
          >
            {showLegends ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
            Legendas das Cores
          </button>
          
          <button 
            onClick={handleAddIdea} 
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center', padding: '0.6rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
          >
            <Plus size={16} /> Nova Ideia
          </button>
        </div>
      </div>

      {/* Quadro de Legendas (Colapsável) */}
      {showLegends && (
        <div style={{ background: 'var(--card-bg)', padding: '1.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-gold)' }}>Defina o significado de cada categoria (Máximo 6 cores):</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {COLORS.map(color => (
              <div key={color.hex} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: color.hex, flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                <input 
                  type="text"
                  value={ideaLegends[color.hex] || ''}
                  onChange={(e) => handleUpdateLegend(color.hex, e.target.value)}
                  className="form-input"
                  placeholder={`Legenda para ${color.name}...`}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Ideias */}
      <div style={{ 
        flex: 1,
        marginTop: '1.5rem',
        paddingBottom: '2rem',
        overflowY: 'auto'
      }}>
        {ideas.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
            <Palette size={64} style={{ opacity: 0.15, marginBottom: '1.5rem' }} />
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>O painel de ideias deste livro está vazio.</p>
            <button onClick={handleAddIdea} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Adicionar Ideia
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            {ideas.map((idea, idx) => (
              <div 
                key={idea.id} 
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  padding: '1.5rem 0', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                  cursor: 'grab',
                  opacity: draggedIdeaIdx === idx ? 0.5 : 1,
                  borderRadius: 0
                }}
              >
                {/* Header da Ideia */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '180px' }}>
                    {/* Badge / Pill */}
                    <div style={{ 
                      background: 'transparent', 
                      padding: 0,
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      border: 'none',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: idea.color }} />
                      {ideaLegends[idea.color] || 'Outros'}
                    </div>

                    {/* Título da Ideia */}
                    <DebouncedInput 
                      value={idea.title || ''}
                      onChange={(val) => handleUpdateIdeaTitle(idea.id, val)}
                      placeholder="Título da Ideia..."
                      style={{ 
                        background: 'transparent',
                        border: 'none',
                        width: '100%',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        padding: 0
                      }}
                    />
                  </div>

                  {/* Ações da direita */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Seletor de cores em linha */}
                    <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.4rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                      {COLORS.map(c => (
                        <div 
                          key={c.hex} 
                          onClick={() => handleUpdateIdeaColor(idea.id, c.hex)}
                          title={ideaLegends[c.hex] || c.name}
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            background: c.hex, 
                            cursor: 'pointer',
                            border: idea.color === c.hex ? '2px solid var(--text-main)' : '1px solid rgba(0,0,0,0.1)',
                            boxSizing: 'border-box',
                            opacity: idea.color === c.hex ? 1 : 0.6
                          }} 
                          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = idea.color === c.hex ? 1 : 0.6}
                        />
                      ))}
                    </div>

                    {/* Botão Expandir */}
                    <button 
                      onClick={() => setExpandedIdeaId(idea.id)} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', transition: 'all 0.2s', borderRadius: '4px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                      title="Expandir ideia"
                    >
                      <Maximize2 size={16} />
                    </button>

                    {/* Botão Excluir */}
                    <button 
                      onClick={() => handleDeleteIdea(idea.id)} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', transition: 'all 0.2s', borderRadius: '4px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                      title="Excluir ideia"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Conteúdo Textual da Ideia */}
                <DebouncedTextarea 
                  value={idea.text || ''}
                  onChange={(val) => handleUpdateIdeaText(idea.id, val)}
                  onFocus={() => setExpandedIdeaId(idea.id)}
                  placeholder="Escreva sua ideia aqui..."
                  style={{ 
                    flex: 1, 
                    background: 'transparent', 
                    border: 'none', 
                    width: '100%',
                    minHeight: '120px',
                    resize: 'vertical',
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    outline: 'none',
                    lineHeight: '1.5',
                    marginTop: '0.2rem',
                    fontFamily: 'inherit',
                    padding: 0
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Idea Modal */}
      {expandedIdeaId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setExpandedIdeaId(null)}>
          <div style={{
            background: 'var(--card-bg)',
            width: '100%',
            maxWidth: '900px',
            height: '90vh',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem',
            gap: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)'
          }} onClick={e => e.stopPropagation()}>
            {(() => {
              const idea = ideas.find(i => i.id === expandedIdeaId);
              if (!idea) return null;
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                      <div style={{ 
                        background: 'transparent', 
                        padding: 0,
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        width: 'fit-content'
                      }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: idea.color }} />
                        {ideaLegends[idea.color] || 'Outros'}
                      </div>
                      <DebouncedInput 
                        value={idea.title || ''}
                        onChange={(val) => handleUpdateIdeaTitle(idea.id, val)}
                        placeholder="Título da Ideia..."
                        style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', padding: 0 }}
                      />
                    </div>
                    <button 
                      onClick={() => setExpandedIdeaId(null)} 
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--border-color)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      title="Fechar"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <DebouncedTextarea 
                    value={idea.text || ''}
                    onChange={(val) => handleUpdateIdeaText(idea.id, val)}
                    placeholder="Escreva sua ideia aqui..."
                    style={{ flex: 1, background: 'transparent', border: 'none', width: '100%', resize: 'none', fontSize: '1.1rem', color: 'var(--text-main)', outline: 'none', lineHeight: '1.6', fontFamily: 'inherit', padding: '0.5rem 0' }}
                  />
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
