import { useState } from 'react';
import { Plus, GripVertical, Trash2, Edit2, Save, X, AlignLeft, Layers, Settings, ChevronDown, ChevronRight, BookOpen, Menu } from 'lucide-react';

export default function BookEscaletaBoard({ book, onUpdateBook, onOpenMenu }) {
  const mode = book.escaletaMode || null;
  const groups = book.escaletaGroups || [];

  const [draggedItem, setDraggedItem] = useState(null); // { groupIdx, sceneIdx }
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  
  const [sceneForm, setSceneForm] = useState({ title: '', description: '' });
  const [groupForm, setGroupForm] = useState({ name: '' });
  
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const handleSelectMode = (selectedMode) => {
    // Migração de dados caso já exista uma escaleta antiga
    const oldFlatEscaleta = book.escaleta || [];
    let initialGroups = [];

    if (groups.length > 0) {
      // Se já existirem grupos (o usuário está apenas trocando de modo)
      // Agrupa tudo no primeiro grupo do novo modelo
      const allScenes = groups.flatMap(g => g.scenes);
      initialGroups = [{
        id: 'g_' + Date.now(),
        name: selectedMode === 'acts' ? 'Ato 1' : selectedMode === 'chapters' ? 'Capítulo 1' : 'História',
        scenes: allScenes
      }];
    } else {
      initialGroups = [{
        id: 'g_' + Date.now(),
        name: selectedMode === 'acts' ? 'Ato 1' : selectedMode === 'chapters' ? 'Capítulo 1' : 'História',
        scenes: oldFlatEscaleta
      }];
    }

    onUpdateBook({ ...book, escaletaMode: selectedMode, escaletaGroups: initialGroups, escaleta: [] });
  };

  const handleAddGroup = () => {
    let nextName = 'Novo Grupo';
    if (mode === 'acts') nextName = `Ato ${groups.length + 1}`;
    if (mode === 'chapters') nextName = `Capítulo ${groups.length + 1}`;

    const newGroup = { id: 'g_' + Date.now(), name: nextName, scenes: [] };
    onUpdateBook({ ...book, escaletaGroups: [...groups, newGroup] });
  };

  const handleAddScene = (groupIdx) => {
    const newScene = { id: 'sc_' + Date.now(), title: 'Nova Cena', description: '' };
    const newGroups = [...groups];
    newGroups[groupIdx].scenes.push(newScene);
    
    onUpdateBook({ ...book, escaletaGroups: newGroups });
    setEditingSceneId(newScene.id);
    setSceneForm({ title: newScene.title, description: newScene.description });
    
    // Ensure group is not collapsed
    setCollapsedGroups(prev => ({ ...prev, [newGroups[groupIdx].id]: false }));
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e, groupIdx, sceneIdx) => {
    setDraggedItem({ groupIdx, sceneIdx });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(e.target.parentNode, 20, 20);
  };

  const handleDragOverScene = (e, targetGroupIdx, targetSceneIdx) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const { groupIdx: sourceGroupIdx, sceneIdx: sourceSceneIdx } = draggedItem;
    if (sourceGroupIdx === targetGroupIdx && sourceSceneIdx === targetSceneIdx) return;
    
    const newGroups = JSON.parse(JSON.stringify(groups));
    const sceneToMove = newGroups[sourceGroupIdx].scenes[sourceSceneIdx];
    
    newGroups[sourceGroupIdx].scenes.splice(sourceSceneIdx, 1);
    newGroups[targetGroupIdx].scenes.splice(targetSceneIdx, 0, sceneToMove);
    
    setDraggedItem({ groupIdx: targetGroupIdx, sceneIdx: targetSceneIdx });
    onUpdateBook({ ...book, escaletaGroups: newGroups });
  };

  const handleDragOverGroupEmpty = (e, targetGroupIdx) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const { groupIdx: sourceGroupIdx, sceneIdx: sourceSceneIdx } = draggedItem;
    if (groups[targetGroupIdx].scenes.length > 0) return; // Only apply if group is empty
    
    const newGroups = JSON.parse(JSON.stringify(groups));
    const sceneToMove = newGroups[sourceGroupIdx].scenes[sourceSceneIdx];
    
    newGroups[sourceGroupIdx].scenes.splice(sourceSceneIdx, 1);
    newGroups[targetGroupIdx].scenes.push(sceneToMove);
    
    setDraggedItem({ groupIdx: targetGroupIdx, sceneIdx: 0 });
    onUpdateBook({ ...book, escaletaGroups: newGroups });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };
  // ---------------------------

  const handleDeleteScene = (groupIdx, sceneId) => {
    if (window.confirm("Tem certeza que deseja excluir esta cena? Ela será movida para a Lixeira.")) {
      const newGroups = [...groups];
      const sceneToDelete = newGroups[groupIdx].scenes.find(s => s.id === sceneId);
      newGroups[groupIdx].scenes = newGroups[groupIdx].scenes.filter(s => s.id !== sceneId);
      
      const trashItem = { ...sceneToDelete, deletedAt: new Date().toISOString(), itemType: 'escaleta', itemData: sceneToDelete };
      const updatedTrash = [...(book.trash || []), trashItem];
      
      onUpdateBook({ ...book, escaletaGroups: newGroups, trash: updatedTrash });
      if (editingSceneId === sceneId) setEditingSceneId(null);
    }
  };

  const handleToggleCompleted = (groupIdx, sceneId) => {
    const newGroups = [...groups];
    const group = newGroups[groupIdx];
    const sceneIdx = group.scenes.findIndex(s => s.id === sceneId);
    if (sceneIdx === -1) return;
    
    const scene = group.scenes[sceneIdx];
    scene.completed = !scene.completed;
    
    // Move to end if completed, or to top if uncompleted (optional, but end is requested)
    group.scenes.splice(sceneIdx, 1);
    if (scene.completed) {
      group.scenes.push(scene);
    } else {
      group.scenes.unshift(scene); // Move to top when uncompleted
    }
    
    onUpdateBook({ ...book, escaletaGroups: newGroups });
  };

  const handleDeleteGroup = (groupIdx) => {
    if (groups[groupIdx].scenes.length > 0) {
      alert("Você não pode excluir um bloco que possui cenas. Remova ou mova as cenas antes.");
      return;
    }
    if (window.confirm("Tem certeza que deseja excluir este bloco vazio?")) {
      const newGroups = groups.filter((_, idx) => idx !== groupIdx);
      onUpdateBook({ ...book, escaletaGroups: newGroups });
    }
  };

  const handleSaveScene = (groupIdx) => {
    const newGroups = [...groups];
    newGroups[groupIdx].scenes = newGroups[groupIdx].scenes.map(s => 
      s.id === editingSceneId ? { ...s, title: sceneForm.title, description: sceneForm.description } : s
    );
    onUpdateBook({ ...book, escaletaGroups: newGroups });
    setEditingSceneId(null);
  };

  const handleSaveGroup = (groupIdx) => {
    const newGroups = [...groups];
    newGroups[groupIdx].name = groupForm.name;
    onUpdateBook({ ...book, escaletaGroups: newGroups });
    setEditingGroupId(null);
  };

  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (!mode) {
    return (
      <div style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: '100%' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '2rem' }}>Assistente de Escaleta</h2>
          {onOpenMenu && (
            <button 
              className="mobile-only admin-mobile-menu-btn"
              onClick={onOpenMenu}
              style={{ background: 'var(--accent-gold)', color: '#000', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Menu size={20} />
            </button>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', textAlign: 'center', maxWidth: '600px' }}>
          Escolha como você deseja planejar as cenas da sua história. Você poderá alterar essa estrutura no futuro sem perder seus dados.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1000px' }}>
          {/* Livre */}
          <div 
            onClick={() => handleSelectMode('free')}
            style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-gold)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <AlignLeft size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Livre</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Uma única lista contínua. Sem divisões. Ideal para contos, roteiros curtos e histórias menores ou fluidas.
            </p>
          </div>

          {/* Atos */}
          <div 
            onClick={() => handleSelectMode('acts')}
            style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-gold)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <Layers size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Em Atos</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Crie blocos estruturais (Ato 1, Ato 2, etc) e coloque suas cenas dentro deles. Ideal para estruturas clássicas como a Jornada do Herói.
            </p>
          </div>

          {/* Capítulos */}
          <div 
            onClick={() => handleSelectMode('chapters')}
            style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-gold)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <BookOpen size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Por Capítulos</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Crie blocos de Capítulos e planeje as micro-cenas que acontecerão dentro de cada um deles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Escaleta 
              <span style={{ fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'sans-serif' }}>
                {mode === 'free' ? 'Livre' : mode === 'acts' ? 'Atos' : 'Capítulos'}
              </span>
            </h2>
            {onOpenMenu && (
              <button 
                className="mobile-only admin-mobile-menu-btn"
                onClick={onOpenMenu}
                style={{ background: 'var(--accent-gold)', color: '#000', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Menu size={20} />
              </button>
            )}
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Planeje o esqueleto da sua história. Adicione cartões para cada cena e arraste para reordenar.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => onUpdateBook({ ...book, escaletaMode: null })} style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} title="Trocar Modelo (Suas cenas não serão apagadas)">
            <Settings size={18} /> <span className="desktop-only">Alterar Estrutura</span>
          </button>
          {mode !== 'free' && (
            <button className="btn-secondary" onClick={handleAddGroup} style={{ padding: '0.6rem 1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Novo Bloco
            </button>
          )}
          {mode === 'free' && (
            <button className="btn-primary" onClick={() => handleAddScene(0)} style={{ padding: '0.6rem 1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Nova Cena
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {groups.map((group, groupIdx) => {
          const isCollapsed = collapsedGroups[group.id];

          return (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: mode === 'free' ? '0' : '1.5rem', background: mode === 'free' ? 'transparent' : 'rgba(0,0,0,0.15)', borderRadius: '12px', border: mode === 'free' ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
              
              {/* Group Header */}
              {mode !== 'free' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => toggleGroup(group.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                      {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                    </button>
                    
                    {editingGroupId === group.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={groupForm.name} 
                          onChange={e => setGroupForm({ name: e.target.value })}
                          className="form-input"
                          style={{ padding: '0.3rem', fontSize: '1.2rem', fontWeight: 'bold', width: '200px' }}
                          autoFocus
                        />
                        <button onClick={() => handleSaveGroup(groupIdx)} style={{ background: 'none', border: 'none', color: '#4CAF50', cursor: 'pointer' }}><Save size={18} /></button>
                      </div>
                    ) : (
                      <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {group.name}
                        <button onClick={() => { setEditingGroupId(group.id); setGroupForm({ name: group.name }); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5 }}>
                          <Edit2 size={14} />
                        </button>
                      </h3>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" onClick={() => handleDeleteGroup(groupIdx)} style={{ padding: '0.4rem', color: '#f44336', border: 'none' }} title="Excluir Bloco (deve estar vazio)">
                      <Trash2 size={16} />
                    </button>
                    <button className="btn-secondary" onClick={() => handleAddScene(groupIdx)} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Plus size={16} /> <span className="desktop-only">Cena</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Scenes List */}
              {!isCollapsed && (
                <div 
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: group.scenes.length === 0 ? '60px' : 'auto' }}
                  onDragOver={(e) => {
                    if (group.scenes.length === 0) handleDragOverGroupEmpty(e, groupIdx);
                  }}
                >
                  {group.scenes.length === 0 && mode !== 'free' && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                      Arraste cenas para cá ou clique em "Cena" para adicionar
                    </div>
                  )}
                  {group.scenes.length === 0 && mode === 'free' && (
                    <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                      <AlignLeft size={48} color="var(--border-color)" style={{ marginBottom: '1rem', display: 'inline-block' }} />
                      <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Nenhuma cena planejada ainda</h3>
                      <p style={{ color: 'var(--text-muted)' }}>Comece a estruturar sua história adicionando o primeiro cartão de cena no topo.</p>
                    </div>
                  )}

                  {group.scenes.map((scene, sceneIdx) => {
                    const isDragging = draggedItem?.groupIdx === groupIdx && draggedItem?.sceneIdx === sceneIdx;
                    return (
                      <div 
                        key={scene.id}
                        onDragOver={(e) => handleDragOverScene(e, groupIdx, sceneIdx)}
                        style={{
                          background: editingSceneId === scene.id ? 'var(--bg-secondary)' : 'var(--bg-color)',
                          border: editingSceneId === scene.id ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          transition: 'all 0.2s',
                          opacity: isDragging ? 0.3 : 1
                        }}
                      >
                        {editingSceneId === scene.id ? (
                          // Modo Edição Cena
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                              type="text" 
                              value={sceneForm.title}
                              onChange={(e) => setSceneForm({...sceneForm, title: e.target.value})}
                              placeholder="Título da Cena (Ex: Ato 1 - A Descoberta)"
                              className="form-input"
                              style={{ fontSize: '1.1rem', fontWeight: 'bold', padding: '0.5rem', border: 'none', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--accent-gold)', borderRadius: '4px 4px 0 0' }}
                              autoFocus
                            />
                            <textarea 
                              value={sceneForm.description}
                              onChange={(e) => setSceneForm({...sceneForm, description: e.target.value})}
                              placeholder="O que acontece nesta cena? (Resumo)"
                              className="form-input"
                              rows="4"
                              style={{ fontSize: '0.95rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button className="btn-secondary" onClick={() => setEditingSceneId(null)} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <X size={16} /> Cancelar
                              </button>
                              <button className="btn-primary" onClick={() => handleSaveScene(groupIdx)} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Save size={16} /> Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Modo Visualização Cena
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', opacity: scene.completed ? 0.4 : 1 }}>
                            <div 
                              draggable
                              onDragStart={(e) => handleDragStart(e, groupIdx, sceneIdx)}
                              onDragEnd={handleDragEnd}
                              style={{ color: 'var(--text-muted)', cursor: 'grab', padding: '0.5rem', marginTop: '-0.5rem' }}
                              title="Arrastar para reordenar"
                            >
                              <GripVertical size={20} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input 
                                  type="checkbox" 
                                  checked={!!scene.completed}
                                  onChange={() => handleToggleCompleted(groupIdx, scene.id)}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-gold)' }}
                                  title="Marcar como Concluído"
                                />
                                <span style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent-gold)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                  #{sceneIdx + 1}
                                </span>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', textDecoration: scene.completed ? 'line-through' : 'none' }}>{scene.title || 'Sem título'}</h4>
                              </div>
                              {scene.description ? (
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', textDecoration: scene.completed ? 'line-through' : 'none' }}>
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
                                onClick={() => { setEditingSceneId(scene.id); setSceneForm({ title: scene.title, description: scene.description }); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteScene(groupIdx, scene.id)}
                                style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', padding: '0.5rem', opacity: 0.7 }}
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
