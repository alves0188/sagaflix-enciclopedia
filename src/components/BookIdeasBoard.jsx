import { useState } from 'react';
import { Palette, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

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

export default function BookIdeasBoard({ book, onUpdateBook }) {
  const [showLegends, setShowLegends] = useState(false);
  const [draggedIdeaIdx, setDraggedIdeaIdx] = useState(null);

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
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-gold)' }}>Defina o significado de cada cor de post-it (Máximo 6 cores):</h3>
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

      {/* Mural de Cortiça Corkboard */}
      <div className="corkboard" style={{ 
        flex: 1,
        background: 'radial-gradient(circle, #2d2e33 0%, #151619 100%)', 
        padding: '2rem'
      }}>
        {ideas.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
            <Palette size={64} style={{ opacity: 0.15, marginBottom: '1.5rem' }} />
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>O quadro de ideias deste livro está vazio.</p>
            <button onClick={handleAddIdea} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Criar meu primeiro Post-it
            </button>
          </div>
        ) : (
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '2.5rem' }}>
            {ideas.map((idea, idx) => {
              // Rotação pseudo-aleatória sutil para visual de post-it natural
              const rotations = [-2, -1, 1, 2, -1.5, 1.5];
              const rotation = rotations[idx % rotations.length];
              
              return (
                <div 
                  key={idea.id} 
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  style={{ 
                    background: idea.color,
                    color: '#1e1e24',
                    padding: '1.5rem', 
                    borderRadius: '2px', 
                    boxShadow: '4px 6px 15px rgba(0,0,0,0.4), inset -2px -2px 10px rgba(0,0,0,0.1)',
                    minHeight: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.2s',
                    position: 'relative',
                    cursor: 'grab',
                    opacity: draggedIdeaIdx === idx ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = `scale(1.03) rotate(0deg)`;
                    e.currentTarget.style.boxShadow = '10px 10px 25px rgba(0,0,0,0.5)';
                    e.currentTarget.style.zIndex = 10;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = `scale(1) rotate(${rotation}deg)`;
                    e.currentTarget.style.boxShadow = '5px 5px 15px rgba(0,0,0,0.4)';
                    e.currentTarget.style.zIndex = 1;
                  }}
                >
                  {/* Alfinete / Fita Adesiva visual */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    width: '45px', 
                    height: '14px', 
                    background: 'rgba(255,255,255,0.45)', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
                  }} />

                  {/* Post-it Header Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', opacity: 0.8 }}>
                    {/* Color select palette trigger */}
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
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
                            border: idea.color === c.hex ? '1.5px solid #1e1e24' : '0.5px solid rgba(0,0,0,0.3)',
                            boxSizing: 'border-box'
                          }} 
                        />
                      ))}
                    </div>

                    {/* Excluir button */}
                    <button 
                      onClick={() => handleDeleteIdea(idea.id)} 
                      style={{ background: 'none', border: 'none', color: '#1e1e24', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', opacity: 0.6 }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Título da Ideia */}
                  <input 
                    type="text"
                    value={idea.title || ''}
                    onChange={(e) => handleUpdateIdeaTitle(idea.id, e.target.value)}
                    placeholder="Título da Ideia..."
                    style={{ 
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(0,0,0,0.1)',
                      width: '100%',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#1e1e24',
                      padding: '0 0 0.5rem 0',
                      marginBottom: '1rem',
                      outline: 'none',
                      fontFamily: "'Playfair Display', serif"
                    }}
                  />

                  {/* Post-it Text Content */}
                  <textarea 
                    value={idea.text}
                    onChange={(e) => handleUpdateIdeaText(idea.id, e.target.value)}
                    placeholder="Clique aqui e digite a sua ideia..."
                    style={{ 
                      flex: 1, 
                      background: 'transparent', 
                      border: 'none', 
                      width: '100%',
                      resize: 'none',
                      fontSize: '0.95rem',
                      color: '#1e1e24',
                      outline: 'none',
                      lineHeight: '1.5'
                    }}
                  />

                  {/* Exibe o nome da legenda em baixo do post-it sutilmente */}
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: 'rgba(0,0,0,0.4)', 
                    fontWeight: 'bold', 
                    textAlign: 'right', 
                    marginTop: '0.5rem',
                    borderTop: '0.5px solid rgba(0,0,0,0.06)',
                    paddingTop: '0.3rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {ideaLegends[idea.color] || 'Outros'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
