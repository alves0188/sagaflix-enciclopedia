import { useState } from 'react';
import { Plus, GripVertical, Trash2, Edit2, Save, X, AlignLeft } from 'lucide-react';

export default function BookEscaletaBoard({ book, onUpdateBook }) {
  const escaleta = book.escaleta || [];
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.parentNode);
    e.dataTransfer.setDragImage(e.target.parentNode, 20, 20);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const items = [...escaleta];
    const draggedItem = items[draggedIdx];
    
    // Remove from old pos
    items.splice(draggedIdx, 1);
    // Add to new pos
    items.splice(index, 0, draggedItem);
    
    setDraggedIdx(index);
    onUpdateBook({ ...book, escaleta: items });
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleAddScene = () => {
    const newScene = {
      id: 'sc_' + Date.now(),
      title: 'Nova Cena',
      description: ''
    };
    onUpdateBook({ ...book, escaleta: [...escaleta, newScene] });
    setEditingId(newScene.id);
    setEditForm({ title: newScene.title, description: newScene.description });
  };

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta cena da escaleta?")) {
      const newEscaleta = escaleta.filter(s => s.id !== id);
      onUpdateBook({ ...book, escaleta: newEscaleta });
      if (editingId === id) setEditingId(null);
    }
  };

  const handleEdit = (scene) => {
    setEditingId(scene.id);
    setEditForm({ title: scene.title || '', description: scene.description || '' });
  };

  const handleSaveEdit = () => {
    const newEscaleta = escaleta.map(s => {
      if (s.id === editingId) {
        return { ...s, title: editForm.title, description: editForm.description };
      }
      return s;
    });
    onUpdateBook({ ...book, escaleta: newEscaleta });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>Escaleta (Step Outline)</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Planeje o esqueleto da sua história. Adicione cartões para cada cena, ato ou capítulo e arraste para reordenar.
          </p>
        </div>
        <button className="btn-primary" onClick={handleAddScene} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontWeight: 'bold' }}>
          <Plus size={16} /> Nova Cena
        </button>
      </div>

      {escaleta.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
          <AlignLeft size={48} color="var(--border-color)" style={{ marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Nenhuma cena planejada ainda</h3>
          <p style={{ color: 'var(--text-muted)' }}>Comece a estruturar sua história adicionando o primeiro cartão de cena.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {escaleta.map((scene, index) => (
            <div 
              key={scene.id}
              onDragOver={(e) => handleDragOver(e, index)}
              style={{
                background: editingId === scene.id ? 'var(--bg-secondary)' : 'var(--bg-color)',
                border: editingId === scene.id ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'all 0.2s',
                opacity: draggedIdx === index ? 0.5 : 1
              }}
            >
              {editingId === scene.id ? (
                // Modo Edição
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input 
                    type="text" 
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    placeholder="Título da Cena (Ex: Ato 1 - A Descoberta)"
                    className="form-input"
                    style={{ fontSize: '1.1rem', fontWeight: 'bold', padding: '0.5rem', border: 'none', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--accent-gold)', borderRadius: '4px 4px 0 0' }}
                    autoFocus
                  />
                  <textarea 
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    placeholder="O que acontece nesta cena? (Resumo)"
                    className="form-input"
                    rows="4"
                    style={{ fontSize: '0.95rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button className="btn-secondary" onClick={handleCancelEdit} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <X size={16} /> Cancelar
                    </button>
                    <button className="btn-primary" onClick={handleSaveEdit} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Save size={16} /> Salvar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo Visualização
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{ color: 'var(--text-muted)', cursor: 'grab', padding: '0.5rem', marginTop: '-0.5rem' }}
                    title="Arrastar para reordenar"
                  >
                    <GripVertical size={20} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent-gold)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        #{index + 1}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{scene.title || 'Sem título'}</h4>
                    </div>
                    {scene.description ? (
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {scene.description}
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--border-color)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                        Nenhum resumo adicionado...
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEdit(scene)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(scene.id)}
                      style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', padding: '0.5rem', opacity: 0.7 }}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
