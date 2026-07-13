import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { Link2, Trash2, Plus, Sparkles, User, Map, Building, HelpCircle, Activity, X } from 'lucide-react';

const NODE_COLORS = {
  character: { bg: '#2196F3', border: '#0d8aee', label: 'Personagem' },
  location: { bg: '#4CAF50', border: '#3e8e41', label: 'Local' },
  organization: { bg: '#9C27B0', border: '#801d95', label: 'Organização' },
  clue: { bg: '#FF9800', border: '#e68a00', label: 'Complemento' },
  event: { bg: '#F44336', border: '#da190b', label: 'Evento' }
};

export default function UniverseGraph({ bookId, universe, isAuthor }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Connection Form States
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relationType, setRelationType] = useState('');
  const [description, setDescription] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Nodes positioning mapping
  const [positions, setPositions] = useState({});
  const containerRef = useRef(null);
  const dragNodeRef = useRef(null);

  // Build the list of all entities in the universe
  const entities = [
    ...(universe.characters || []).map(item => ({ ...item, type: 'character' })),
    ...(universe.locations || []).map(item => ({ ...item, type: 'location' })),
    ...(universe.organizations || []).map(item => ({ ...item, type: 'organization' })),
    ...(universe.clues || []).map(item => ({ ...item, type: 'clue' })),
    ...(universe.events || []).map(item => ({ ...item, type: 'event' }))
  ];

  useEffect(() => {
    fetchConnections();
  }, [bookId]);

  useEffect(() => {
    // Generate initial random coordinates for nodes inside the SVG viewport
    if (entities.length > 0) {
      const initialPos = {};
      const width = containerRef.current?.clientWidth || 700;
      const height = containerRef.current?.clientHeight || 450;
      
      entities.forEach((entity, idx) => {
        // Place nodes in a circle format to look neat on load
        const angle = (idx / entities.length) * 2 * Math.PI;
        initialPos[entity.id] = {
          x: width / 2 + Math.cos(angle) * Math.min(width, height) * 0.35,
          y: height / 2 + Math.sin(angle) * Math.min(width, height) * 0.35
        };
      });
      setPositions(initialPos);
    }
  }, [universe]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const baseUrl = window.API_BASE_URL || '';
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${baseUrl}/api/universe/connections/${bookId}`, {
        headers: {
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async (e, overrideSourceId) => {
    e?.preventDefault();
    const finalSourceId = overrideSourceId || sourceId;
    if (!finalSourceId || !targetId || !relationType) {
      toast.error('Preencha as entidades e o tipo de relação.');
      return;
    }

    if (finalSourceId === targetId) {
      toast.error('Não é possível conectar uma entidade a ela mesma.');
      return;
    }

    const sourceEntity = entities.find(ent => ent.id === finalSourceId);
    const targetEntity = entities.find(ent => ent.id === targetId);

    if (!sourceEntity || !targetEntity) {
      toast.error('Entidade de origem ou destino não encontrada.');
      return;
    }

    setActionLoading(true);
    try {
      const baseUrl = window.API_BASE_URL || '';
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${baseUrl}/api/universe/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({
          book_id: bookId,
          source_id: finalSourceId,
          source_type: sourceEntity.type,
          target_id: targetId,
          target_type: targetEntity.type,
          relation_type: relationType,
          description
        })
      });

      if (res.ok) {
        toast.success('Conexão criada com sucesso!');
        setSourceId('');
        setTargetId('');
        setRelationType('');
        setDescription('');
        setIsFormOpen(false);
        fetchConnections();
      } else {
        toast.error('Erro ao salvar conexão no servidor.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao criar relação.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConnection = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar essa conexão?')) return;

    try {
      const baseUrl = window.API_BASE_URL || '';
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${baseUrl}/api/universe/connections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        }
      });

      if (res.ok) {
        toast.success('Conexão removida com sucesso!');
        fetchConnections();
      } else {
        toast.error('Erro ao remover conexão.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao deletar.');
    }
  };

  // Node Drag Handlers (Vanilla Drag and Drop on SVG)
  const handleMouseDown = (nodeId, e) => {
    e.preventDefault();
    dragNodeRef.current = nodeId;
  };

  const handleMouseMove = (e) => {
    if (!dragNodeRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPositions(prev => ({
      ...prev,
      [dragNodeRef.current]: { x, y }
    }));
  };

  const handleMouseUp = () => {
    dragNodeRef.current = null;
  };

  const handleCreateQuickConnection = async (source, target) => {
    if (!source || !target || source === target) return;
    const sourceEntity = entities.find(ent => ent.id === source);
    const targetEntity = entities.find(ent => ent.id === target);
    if (!sourceEntity || !targetEntity) return;

    setActionLoading(true);
    try {
      const baseUrl = window.API_BASE_URL || '';
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${baseUrl}/api/universe/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': session ? `Bearer ${session.access_token}` : '' },
        body: JSON.stringify({
          book_id: bookId,
          source_id: source,
          source_type: sourceEntity.type,
          target_id: target,
          target_type: targetEntity.type,
          relation_type: 'Nova Conexão (Editar)',
          description: ''
        })
      });
      if (res.ok) {
        toast.success('Conexão rápida criada!');
        fetchConnections();
      } else {
        toast.error('Erro ao salvar conexão.');
      }
    } catch (err) {
      toast.error('Erro ao conectar.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNodeMouseUp = (targetId, e) => {
    e.stopPropagation();
    if (dragNodeRef.current && dragNodeRef.current !== targetId) {
      if (isAuthor) {
        handleCreateQuickConnection(dragNodeRef.current, targetId);
      }
    }
    dragNodeRef.current = null;
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'character': return <User size={14} />;
      case 'location': return <Map size={14} />;
      case 'organization': return <Building size={14} />;
      case 'event': return <Activity size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '350px', color: 'var(--text-muted)' }}>
        <p style={{ color: 'var(--accent-gold)' }}>Carregando mapa mental do universo...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Top Title & Header Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', fontSize: '1.4rem' }}>
            Mapa Constelação de Obras
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Arraste os nós para ajustar o mapa. As linhas representam os relacionamentos.
          </p>
        </div>
        {isAuthor && (
          <button onClick={() => setIsFormOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem' }}>
            <Plus size={16} /> Conectar Elementos
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'row', flexWrap: 'wrap', height: '550px' }}>
        
        {/* Constellation Canvas View */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            flex: 1, 
            background: 'radial-gradient(circle, #101216 0%, #08090b 100%)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            position: 'relative',
            overflow: 'hidden',
            minWidth: '320px',
            height: '100%'
          }}
        >
          {/* Constellation Starry background decoration */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'url(https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop) center/cover', opacity: 0.05, pointerEvents: 'none' }} />

          {/* SVG Connection Lines */}
          <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(212,175,55,0.4)" />
              </marker>
            </defs>
            {connections.map(conn => {
              const start = positions[conn.source_id];
              const end = positions[conn.target_id];
              
              if (!start || !end) return null;

              return (
                <g key={conn.id}>
                  {/* Glowing line background */}
                  <line 
                    x1={start.x} 
                    y1={start.y} 
                    x2={end.x} 
                    y2={end.y} 
                    stroke="rgba(212,175,55,0.08)" 
                    strokeWidth="4" 
                  />
                  {/* Sharp connection line */}
                  <line 
                    x1={start.x} 
                    y1={start.y} 
                    x2={end.x} 
                    y2={end.y} 
                    stroke="rgba(212,175,55,0.35)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 2"
                    markerEnd="url(#arrow)"
                  />
                  {/* Label relation text midpoint */}
                  <text 
                    x={(start.x + end.x) / 2} 
                    y={(start.y + end.y) / 2 - 6} 
                    fill="rgba(212,175,55,0.85)" 
                    fontSize="9px" 
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{ background: '#000', padding: '2px' }}
                  >
                    {conn.relation_type}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Nodes */}
          {entities.map(ent => {
            const pos = positions[ent.id] || { x: 100, y: 100 };
            const cfg = NODE_COLORS[ent.type] || { bg: '#555', border: '#333' };
            const isSelected = selectedNode?.id === ent.id;

            return (
              <div 
                key={ent.id}
                onMouseDown={(e) => handleMouseDown(ent.id, e)}
                onMouseUp={(e) => handleNodeMouseUp(ent.id, e)}
                onClick={() => setSelectedNode(ent)}
                style={{ 
                  position: 'absolute',
                  left: `${pos.x - 24}px`,
                  top: `${pos.y - 24}px`,
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: cfg.bg,
                  border: `2.5px solid ${isSelected ? '#fff' : cfg.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  zIndex: isSelected ? 10 : 5,
                  boxShadow: isSelected ? '0 0 15px #fff' : '0 4px 10px rgba(0,0,0,0.5)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  color: '#fff'
                }}
                title={`${ent.name} (${cfg.label})`}
              >
                {getNodeIcon(ent.type)}
                
                {/* Node label */}
                <span style={{ 
                  position: 'absolute',
                  top: '54px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '4px',
                  border: '1.5px solid var(--border-color)',
                  color: '#fff',
                  pointerEvents: 'none'
                }}>
                  {ent.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Entity Details Sidebar */}
        {selectedNode && (
          <div style={{ 
            width: '280px', 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            animation: 'slideIn 0.2s ease-out',
            height: '100%',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 'bold', 
                color: '#000',
                backgroundColor: NODE_COLORS[selectedNode.type]?.bg,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px'
              }}>
                {NODE_COLORS[selectedNode.type]?.label}
              </span>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div>
              <h4 style={{ margin: 0, fontSize: '1.3rem', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>
                {selectedNode.name}
              </h4>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Status: {selectedNode.status === 'draft' ? 'Rascunho' : 'Publicado'} | Acesso: {selectedNode.access_level || 'Gratuito'}
              </p>
            </div>

            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5', maxHeight: '180px', overflowY: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              {selectedNode.description || selectedNode.bio || 'Nenhuma descrição detalhada.'}
            </p>

            {/* Quick Connect inside Sidebar */}
            {isAuthor && (
              <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CRIAR CONEXÃO A PARTIR DAQUI</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <select 
                    value={targetId} 
                    onChange={(e) => setTargetId(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Selecione o Destino --</option>
                    {entities.filter(e => e.id !== selectedNode.id).map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({NODE_COLORS[e.type]?.label})</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Tipo de Relação (Ex: Irmão)"
                    value={relationType}
                    onChange={(e) => setRelationType(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}
                  />
                  <button 
                    disabled={actionLoading || !targetId || !relationType}
                    onClick={(e) => handleAddConnection(e, selectedNode.id)}
                    className="btn-primary" 
                    style={{ width: '100%', padding: '0.4rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}
                  >
                    {actionLoading ? 'Conectando...' : <><Link2 size={14} /> Conectar</>}
                  </button>
                </div>
              </div>
            )}

            {/* List relations for this node */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>RELAÇÕES NESTE MAPA</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {connections.filter(c => c.source_id === selectedNode.id || c.target_id === selectedNode.id).map(conn => {
                  const isSource = conn.source_id === selectedNode.id;
                  const partnerId = isSource ? conn.target_id : conn.source_id;
                  const partner = entities.find(e => e.id === partnerId);
                  
                  if (!partner) return null;

                  return (
                    <div key={conn.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem' }}>
                        {isSource ? '➡️' : '⬅️'} <strong>{conn.relation_type}</strong> {partner.name}
                      </span>
                      {isAuthor && (
                        <button 
                          onClick={() => handleDeleteConnection(conn.id)}
                          style={{ background: 'none', border: 'none', color: '#F44336', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Remover conexão"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Connection Form Modal (Authors Only) */}
      {isFormOpen && isAuthor && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', fontSize: '1.4rem' }}>
              Conectar Elementos do Universo
            </h3>

            <form onSubmit={handleAddConnection} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Elemento de Origem</label>
                <select 
                  required 
                  value={sourceId} 
                  onChange={e => setSourceId(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                >
                  <option value="" disabled style={{ background: '#222' }}>Selecionar...</option>
                  {entities.map(ent => (
                    <option key={ent.id} value={ent.id} style={{ background: '#222' }}>{ent.name} ({NODE_COLORS[ent.type]?.label})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Relacionamento / Vínculo</label>
                <input 
                  type="text" 
                  required 
                  value={relationType} 
                  onChange={e => setRelationType(e.target.value)} 
                  placeholder="Ex: Nativo de, Amigo de, Rival de, Membro de..."
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Elemento de Destino</label>
                <select 
                  required 
                  value={targetId} 
                  onChange={e => setTargetId(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                >
                  <option value="" disabled style={{ background: '#222' }}>Selecionar...</option>
                  {entities.map(ent => (
                    <option key={ent.id} value={ent.id} style={{ background: '#222' }}>{ent.name} ({NODE_COLORS[ent.type]?.label})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Descrição do Vínculo (Opcional)</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Ex: Nascido na cidade há 30 anos..."
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>Cancelar</button>
                <button type="submit" disabled={actionLoading} className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                  Conectar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
