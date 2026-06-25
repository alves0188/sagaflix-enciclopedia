import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Save, Upload, Trash2, X, Plus } from 'lucide-react';
import TagBadge from './TagBadge';

const getStatusOptions = (type) => {
  if (type === 'personagem') {
    return [
      { value: 'Personagem principal', label: 'PRINCIPAL' },
      { value: 'Secundário', label: 'SECUNDÁRIO' },
      { value: 'Antagonistas', label: 'ANTAGONISTA' },
      { value: 'Coadjuvante', label: 'COADJUVANTE' },
      { value: 'Figurante', label: 'FIGURANTE' },
      { value: 'Vilão', label: 'VILÃO' },
      { value: 'Outros', label: 'OUTROS' }
    ];
  }
  if (type === 'local') {
    return [
      { value: 'Território Neutro', label: 'TERRITÓRIO NEUTRO' },
      { value: 'Esconderijo', label: 'ESCONDERIJO' },
      { value: 'Ponto de Encontro', label: 'PONTO DE ENCONTRO' },
      { value: 'Residência', label: 'RESIDÊNCIA' },
      { value: 'Área Comercial', label: 'ÁREA COMERCIAL' },
      { value: 'Área Industrial', label: 'ÁREA INDUSTRIAL' },
      { value: 'Prédio Público', label: 'PRÉDIO PÚBLICO' },
      { value: 'Outros', label: 'OUTROS' }
    ];
  }
  if (type === 'organizacao') {
    return [
      { value: 'Gangue/Facção', label: 'GANGUE / FACÇÃO' },
      { value: 'Órgão Público', label: 'ÓRGÃO PÚBLICO' },
      { value: 'Corporação/Empresa', label: 'CORPORAÇÃO / EMPRESA' },
      { value: 'Clã/Sociedade Secreta', label: 'CLÃ / SOCIEDADE SECRETA' },
      { value: 'Clube/Grupo Social', label: 'CLUBE / GRUPO SOCIAL' },
      { value: 'Sindicato/Classe', label: 'SINDICATO / CLASSE' },
      { value: 'Outros', label: 'OUTROS' }
    ];
  }
  // Pista / Complemento
  return [
    { value: 'Pista/Evidência', label: 'PISTA / EVIDÊNCIA' },
    { value: 'Artefato/Item', label: 'ARTEFATO / ITEM' },
    { value: 'Tecnologia/Equipamento', label: 'TECNOLOGIA / EQUIPAMENTO' },
    { value: 'Segredo/Documento', label: 'SEGREDO / DOCUMENTO' },
    { value: 'Criatura/Entidade', label: 'CRIATURA / ENTIDADE' },
    { value: 'Mitologia/Lenda', label: 'MITOLOGIA / LENDA' },
    { value: 'Outros', label: 'OUTROS' }
  ];
};

const getDefaultStatusTag = (type) => {
  if (type === 'personagem') return 'Personagem principal';
  if (type === 'local') return 'Território Neutro';
  if (type === 'organizacao') return 'Gangue/Facção';
  return 'Pista/Evidência';
};

const getDefaultLabels = (type) => {
  if (type === 'personagem') return { role: 'FUNÇÃO', territory: 'TERRITÓRIO' };
  if (type === 'local') return { role: 'TIPO DE ESTRUTURA', territory: 'LOCALIZAÇÃO/ZONA' };
  if (type === 'organizacao') return { role: 'PROPÓSITO/SETOR', territory: 'SEDE/ATUAÇÃO' };
  return { role: 'CATEGORIA', territory: 'PORTADOR/ORIGEM' };
};

export default function DossierEditor({ formData, setFormData, onSave, onCancel, uploading, handleFileUpload, isReadOnly = false, bookTitle, universe, events = [] }) {
  const isClue = formData.type === 'pista';
  const defaults = getDefaultLabels(formData.type);
  const currentRoleLabel = formData.roleLabel || defaults.role;
  const currentTerritoryLabel = formData.territoryLabel || defaults.territory;
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [isNoteLifted, setIsNoteLifted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedEventDetail) {
          setSelectedEventDetail(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEventDetail]);

  const matchingEvents = (events || []).filter(ev => {
    if (!ev.tags) return false;
    const nameStr = (formData.name || formData.title || '').trim().toLowerCase();
    if (!nameStr) return false;
    const tagArray = ev.tags.split(',').map(t => t.trim().toLowerCase());
    return tagArray.some(tag => tag === nameStr || nameStr.includes(tag) || tag.includes(nameStr));
  });

  const renderDossierTutorial = (type) => {
    const tutorials = {
      personagem: {
        title: "👥 Ficha de Personagem",
        purpose: "Mapear a identidade, biografia, conexões de relacionamento e curiosidades de um personagem.",
        fields: "Defina o Nome, edite os rótulos de 'FUNÇÃO' e 'TERRITÓRIO' (clicando no texto tracejado) e detalhe as especificações, biografia e conexões.",
        where: "Na galeria de Personagens do Universo. O leitor clica no card para abrir o dossiê.",
        image: "Foto de perfil: recomendável proporção 1:1 (quadrada) ou 2:3 (retrato) com foco no rosto."
      },
      local: {
        title: "📍 Ficha de Local / Território",
        purpose: "Mapear edifícios, zonas, geografia ou locais de interesse de forma estruturada.",
        fields: "Defina o Nome, edite os rótulos de 'TIPO DE ESTRUTURA' e 'LOCALIZAÇÃO/ZONA' (clicando no texto tracejado) e liste frequentadores nas conexões.",
        where: "Na galeria de Locais do Universo do livro.",
        image: "Foto do local: imagens de paisagens, prédios ou ilustrações (proporções livres)."
      },
      organizacao: {
        title: "🏢 Ficha de Organização / Grupo",
        purpose: "Mapear corporações, gangues, clãs, prefeituras ou grupos que influenciam o poder na história.",
        fields: "Defina o Nome, edite os rótulos de 'PROPÓSITO/SETOR' e 'SEDE/ATUAÇÃO' (clicando no texto tracejado) e liste membros nas conexões.",
        where: "Na aba 'Organizações' do Universo.",
        image: "Foto da organização: emblemas, logos, sedes ou foto do grupo."
      },
      pista: {
        title: "🔮 Ficha de Complemento / Lore",
        purpose: "Registrar itens mágicos, diários, lendas, raças ou segredos que enriquecem o lore da obra.",
        fields: "Defina o Nome, configure rótulos de 'CATEGORIA' e 'PORTADOR/ORIGEM'. Você pode clicar e alterar os títulos das 3 caixas de relatórios do dossiê.",
        where: "Na aba 'Complementos' do Universo do livro.",
        image: "Foto do complemento: imagens de objetos, artefatos ou ilustrações conceituais."
      }
    };

    const tut = tutorials[type];
    if (!tut) return null;

    return (
      <div style={{ 
        background: 'rgba(212, 175, 55, 0.05)', 
        border: '1px solid rgba(212, 175, 55, 0.2)', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1.5rem',
        fontSize: '0.8rem',
        lineHeight: 1.4,
        color: '#e2d4b7'
      }}>
        <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
          {tut.title}
        </div>
        <p style={{ margin: '0 0 0.4rem 0' }}><strong>Para que serve:</strong> {tut.purpose}</p>
        <p style={{ margin: '0 0 0.4rem 0' }}><strong>Como usar:</strong> {tut.fields}</p>
        <p style={{ margin: '0 0 0.4rem 0' }}><strong>Onde o leitor vê:</strong> {tut.where}</p>
        <p style={{ margin: 0 }}><strong>Imagens:</strong> {tut.image}</p>
      </div>
    );
  };

  const handleChange = (e) => {
    if (isReadOnly) return;
    setHasChanges(true);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addCustomField = () => {
    if (isReadOnly) return;
    setHasChanges(true);
    setFormData({ 
      ...formData, 
      customFields: [...(formData.customFields || []), { label: '', value: '' }] 
    });
  };

  const updateCustomField = (index, key, val) => {
    if (isReadOnly) return;
    setHasChanges(true);
    const newFields = [...(formData.customFields || [])];
    newFields[index][key] = val;
    setFormData({ ...formData, customFields: newFields });
  };

  const removeCustomField = (index) => {
    if (isReadOnly) return;
    setHasChanges(true);
    const newFields = (formData.customFields || []).filter((_, i) => i !== index);
    setFormData({ ...formData, customFields: newFields });
  };

  const addConnection = () => {
    if (isReadOnly) return;
    setHasChanges(true);
    setFormData({ 
      ...formData, 
      connections: [...(formData.connections || []), { name: '', relation: '' }] 
    });
  };

  const updateConnection = (index, key, val) => {
    if (isReadOnly) return;
    setHasChanges(true);
    const newConns = [...(formData.connections || [])];
    newConns[index][key] = val;
    setFormData({ ...formData, connections: newConns });
  };

  const removeConnection = (index) => {
    if (isReadOnly) return;
    setHasChanges(true);
    const newConns = (formData.connections || []).filter((_, i) => i !== index);
    setFormData({ ...formData, connections: newConns });
  };

  const addAuthorNote = () => {
    if (isReadOnly) return;
    setHasChanges(true);
    setFormData({ 
      ...formData, 
      authorNotes: [...(formData.authorNotes || []), { id: Date.now().toString(), title: '', content: '', isSecret: false }] 
    });
  };

  const updateAuthorNote = (index, key, val) => {
    if (isReadOnly) return;
    setHasChanges(true);
    const newNotes = [...(formData.authorNotes || [])];
    newNotes[index][key] = val;
    setFormData({ ...formData, authorNotes: newNotes });
  };

  const removeAuthorNote = (index) => {
    if (isReadOnly) return;
    setHasChanges(true);
    const newNotes = (formData.authorNotes || []).filter((_, i) => i !== index);
    setFormData({ ...formData, authorNotes: newNotes });
  };

  const handleBack = () => {
    if (hasChanges && !isReadOnly) {
      if (window.confirm("Você tem alterações não salvas. Deseja realmente sair sem salvar?")) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.4)',
    border: '1px dashed #999',
    padding: '0.2rem 0.5rem',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: '#111',
    width: '100%',
    borderRadius: '2px',
    marginBottom: '4px'
  };

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: '60px'
  };

  return (
    <div className="dossier-modal-container">
      
      {/* Coluna Esquerda: Painel Adm (Ferramentas de Edição) */}
      <div className="dossier-left-panel">
        
        <h2 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>
          {isReadOnly ? 'Painel de Leitura' : 'Ferramentas de Controle'}
        </h2>
        
        {!isReadOnly && renderDossierTutorial(formData.type)}
        
        {!isReadOnly && (
          <>
            <button className="btn-secondary" onClick={addCustomField} style={{ width: '100%', marginBottom: '0.5rem', justifyContent: 'center' }}>+ Novo Campo Dinâmico</button>
            {!isClue && <button className="btn-secondary" onClick={addConnection} style={{ width: '100%', marginBottom: '0.5rem', justifyContent: 'center' }}>+ Nova Conexão</button>}
            <button className="btn-secondary" onClick={addAuthorNote} style={{ width: '100%', marginBottom: '2rem', justifyContent: 'center' }}>+ Nova Nota do Autor</button>
          </>
        )}

        <div style={{ marginBottom: '2rem', flexShrink: 0 }}>
          <label style={{ fontSize: '0.8rem', color: '#ff7777', fontWeight: 'bold' }}>NOTAS DO AUTOR</label>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.5rem 0', lineHeight: 1.2 }}>Essas notas aparecerão em uma aba especial no dossiê. Notas secretas exigirão pedido de acesso.</p>
          
          {/* Conversor de Notas Antigas (Compatibilidade) */}
          {formData.privateNotes && (!formData.authorNotes || formData.authorNotes.length === 0) && (
            <div style={{ width: '100%', background: 'rgba(255, 100, 100, 0.05)', border: '1px solid rgba(255, 100, 100, 0.3)', color: '#fff', padding: '0.8rem', minHeight: '80px', borderRadius: '4px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
              <strong>NOTA ANTIGA (Migre para uma nova nota!):</strong><br/><br/>
              {formData.privateNotes}
            </div>
          )}

          {(formData.authorNotes || []).map((note, idx) => (
            <div key={note.id || idx} style={{ background: note.isSecret ? 'rgba(255, 100, 100, 0.05)' : 'rgba(212, 175, 55, 0.05)', border: `1px solid ${note.isSecret ? 'rgba(255, 100, 100, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`, padding: '0.8rem', borderRadius: '4px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
              <input 
                value={note.title || ''} 
                onChange={e => updateAuthorNote(idx, 'title', e.target.value)} 
                disabled={isReadOnly} 
                placeholder="Título da Nota (Ex: Paixão Secreta)" 
                style={{ 
                  width: '100%', 
                  fontWeight: 'bold', 
                  color: note.isSecret ? '#ff7777' : 'var(--accent-gold)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.6rem',
                  borderRadius: '4px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.95rem',
                  outline: 'none'
                }} 
              />
              <textarea 
                value={note.content || ''} 
                onChange={e => updateAuthorNote(idx, 'content', e.target.value)} 
                disabled={isReadOnly} 
                placeholder="Conteúdo da nota..." 
                style={{ 
                  width: '100%', 
                  minHeight: '100px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  padding: '0.6rem',
                  borderRadius: '4px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  outline: 'none'
                }} 
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={note.isSecret || false} 
                    onChange={e => updateAuthorNote(idx, 'isSecret', e.target.checked)} 
                    disabled={isReadOnly} 
                  />
                  <span>É um segredo? (Pedir Acesso)</span>
                </label>
                {!isReadOnly && (
                  <button onClick={() => removeAuthorNote(idx)} style={{ background: 'none', border: 'none', color: '#ff7777', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {(!formData.authorNotes || formData.authorNotes.length === 0) && !formData.privateNotes && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              Nenhuma nota criada.
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0, paddingBottom: '2rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 'bold' }}>GALERIA DE EVIDÊNCIAS</label>
          
          {!isReadOnly && (
            <label className="btn-secondary" style={{ width: '100%', cursor: 'pointer', marginTop: '0.5rem', justifyContent: 'center' }}>
              {uploading ? 'Enviando...' : 'Fazer Upload de Fotos'}
              <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, null, true)} />
            </label>
          )}
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            {(formData.gallery || []).map((img, idx) => (
              <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                {!isReadOnly && (
                  <button 
                    onClick={() => { setHasChanges(true); setFormData({ ...formData, gallery: formData.gallery.filter((_, i) => i !== idx) }); }} 
                    style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    X
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Coluna Direita: O Papel Dossiê */}
      <div className="dossier-wrapper">
        
        <div className="dossier-paper">
          
          {/* Paperclip */}
          <div className="dossier-paperclip"></div>
          <div className="dossier-tab">DOSSIÊ</div>

          {/* Action Buttons */}
          <div className="dossier-actions-wrapper">
            <button className="btn-voltar-dossier" onClick={handleBack} style={{ position: 'static', background: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              VOLTAR
            </button>
            {!isReadOnly && (
              <button className="btn-voltar-dossier" onClick={() => { setHasChanges(false); onSave(); }} style={{ position: 'static', background: 'var(--accent-gold)', color: '#000', border: 'none', padding: '0.5rem 1rem', fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} /> SALVAR
              </button>
            )}
          </div>

          {/* Header */}
          <div className="dossier-header">
            <div className="dossier-org" style={{ lineHeight: 1.4, alignSelf: 'flex-start' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>FICHA TÉCNICA COMPLEMENTAR:</span>
              <div style={{ fontWeight: 'bold' }}>{(bookTitle || 'Jardim das Flores').toUpperCase()}</div>
            </div>
            <div className="dossier-classification">CLASSIFICAÇÃO: {isReadOnly ? 'APENAS LEITURA' : 'RESTRITO - MODO EDIÇÃO'}</div>
          </div>

          <div className="dossier-subheader">
            <div style={{ width: '100%' }}>DOSSIÊ DE: <input name="name" value={formData.name || formData.title || ''} onChange={handleChange} disabled={isReadOnly} placeholder="Nome" style={{ ...inputStyle, width: '100%', maxWidth: '300px', textTransform: 'uppercase', fontWeight: 'bold', opacity: isReadOnly ? 0.8 : 1 }} /></div>
            <div className="dossier-status" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
              STATUS: 
              {isReadOnly ? (
                <span className="badge-tag-status" style={{ background: 'var(--accent-gold)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {(formData.statusTag || getDefaultStatusTag(formData.type)).toUpperCase()}
                </span>
              ) : (
                <select 
                  name="statusTag" 
                  value={formData.statusTag || getDefaultStatusTag(formData.type)} 
                  onChange={handleChange} 
                  style={{ ...inputStyle, width: '100%', maxWidth: '200px', background: '#fff', color: '#000', padding: '0.1rem', height: '24px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  {getStatusOptions(formData.type).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="dossier-grid">
            
            {/* Esquerda: Foto e Dados */}
            <div>
              <div className="dossier-photo-container">
                <div className="dossier-photo-title">FOTO DE IDENTIFICAÇÃO</div>
                {formData.image ? (
                  <div style={{ position: 'relative' }}>
                    <img src={formData.image} alt="Preview" className="dossier-photo" />
                    {!isReadOnly && (
                      <label style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(0,0,0,0.7)', color: '#fff', textAlign: 'center', padding: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        {uploading ? 'Enviando...' : 'Trocar Foto'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'image')} />
                      </label>
                    )}
                  </div>
                ) : (
                  isReadOnly ? (
                    <div className="dossier-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', border: '2px dashed #999', color: '#666', fontSize: '0.8rem' }}>SEM FOTO</div>
                  ) : (
                    <label className="dossier-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.1)', border: '2px dashed #999' }}>
                      {uploading ? 'Enviando...' : <><Upload size={24} /><br/>Upload Foto</>}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'image')} />
                    </label>
                  )
                )}
              </div>

              {formData.type === 'pista' && !isReadOnly && (
                <div style={{ 
                  background: 'rgba(212, 175, 55, 0.12)', 
                  border: '1px solid rgba(212, 175, 55, 0.4)', 
                  borderRadius: '8px', 
                  padding: '1.5rem', 
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  color: '#4f3a12'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#8c6508', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.95rem' }}>
                    💡 Ideias de Complementos para sua Obra
                  </div>
                  Esta seção é livre para você criar dossiês de qualquer item, objeto ou lore que enriqueça a história. Exemplos:
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <li><strong style={{ color: '#735200' }}>Mistério:</strong> Armas do crime, pistas, cartas misteriosas.</li>
                    <li><strong style={{ color: '#735200' }}>Ficção/Fantasia:</strong> Sistemas de magia, grimórios, artefatos, raças, planetas, tecnologias.</li>
                    <li><strong style={{ color: '#735200' }}>Romance/Drama:</strong> Objetos sentimentais, diários, cartas trocadas, segredos.</li>
                    <li><strong style={{ color: '#735200' }}>Terror:</strong> Entidades, rituais, regras de sobrevivência, lendas.</li>
                  </ul>
                </div>
              )}

              <div className="dossier-section-title">
                {formData.type === 'personagem' && 'DADOS PESSOAIS'}
                {formData.type === 'local' && 'DADOS DO LOCAL'}
                {formData.type === 'organizacao' && 'DADOS DA ORGANIZAÇÃO'}
                {formData.type === 'pista' && 'DADOS DO COMPLEMENTO'}
              </div>
              
              <div className="dossier-personal-data">
                <div style={{ marginBottom: '0.5rem' }}><strong>NOME COMPLETO:</strong> <input name="name" value={formData.name || ''} onChange={handleChange} disabled={isReadOnly} style={{ ...inputStyle, opacity: isReadOnly ? 0.8 : 1 }} /></div>
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {isReadOnly ? (
                    <strong>{currentRoleLabel.toUpperCase()}:</strong>
                  ) : (
                    <input 
                      name="roleLabel" 
                      value={currentRoleLabel} 
                      onChange={handleChange} 
                      style={{ ...inputStyle, width: '120px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px dashed #999', background: 'transparent' }} 
                    />
                  )}
                  <input name="role" value={formData.role || ''} onChange={handleChange} disabled={isReadOnly} style={{ ...inputStyle, opacity: isReadOnly ? 0.8 : 1, flex: 1 }} />
                </div>
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {isReadOnly ? (
                    <strong>{currentTerritoryLabel.toUpperCase()}:</strong>
                  ) : (
                    <input 
                      name="territoryLabel" 
                      value={currentTerritoryLabel} 
                      onChange={handleChange} 
                      style={{ ...inputStyle, width: '120px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px dashed #999', background: 'transparent' }} 
                    />
                  )}
                  <input name="territory" value={formData.territory || ''} onChange={handleChange} disabled={isReadOnly} style={{ ...inputStyle, opacity: isReadOnly ? 0.8 : 1, flex: 1 }} />
                </div>
                {formData.type === 'personagem' && (
                  <div style={{ marginBottom: '0.5rem' }}><strong>IDADE:</strong> <input type="number" name="age" value={formData.age || ''} onChange={handleChange} disabled={isReadOnly} style={{ ...inputStyle, opacity: isReadOnly ? 0.8 : 1 }} /></div>
                )}

                {/* Custom Fields */}
                {(formData.customFields || []).map((cf, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                    <input value={cf.label} onChange={e => updateCustomField(idx, 'label', e.target.value)} disabled={isReadOnly} placeholder="Título" style={{ ...inputStyle, width: '40%', fontWeight: 'bold', opacity: isReadOnly ? 0.8 : 1 }} />
                    <input value={cf.value} onChange={e => updateCustomField(idx, 'value', e.target.value)} disabled={isReadOnly} placeholder="Valor" style={{ ...inputStyle, width: '50%', opacity: isReadOnly ? 0.8 : 1 }} />
                    {!isReadOnly && <button onClick={() => removeCustomField(idx)} style={{ background: 'none', border: 'none', color: '#aa0000', cursor: 'pointer', padding: '0.2rem' }}><Trash2 size={16} /></button>}
                  </div>
                ))}
              </div>
            </div>

            {/* Direita: Perfil Operacional e Dinâmica */}
            <div className="dossier-main-content">
              <div className="dossier-section-title">
                {formData.type === 'personagem' && 'ESPECIFICAÇÕES'}
                {formData.type === 'local' && 'AMBIENTAÇÃO & INFRAESTRUTURA'}
                {formData.type === 'organizacao' && 'ESTRUTURA & OPERAÇÃO'}
                {formData.type === 'pista' && 'DETALHES DO COMPLEMENTO'}
              </div>
              
              {isClue ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '1rem 0 0.5rem 0' }}>
                    {isReadOnly ? (
                      <h3 style={{ margin: 0 }}>{formData.foundLabel || 'Relatório de Campo (O que encontraram):'}</h3>
                    ) : (
                      <input 
                        name="foundLabel" 
                        value={formData.foundLabel || 'Relatório de Campo (O que encontraram):'} 
                        onChange={handleChange} 
                        style={{ ...inputStyle, fontWeight: 'bold', borderBottom: '1px dashed #999', background: 'transparent', width: '100%', fontSize: '1.17em' }} 
                      />
                    )}
                  </div>
                  <textarea name="found" value={formData.found || ''} onChange={handleChange} disabled={isReadOnly} style={{ ...textareaStyle, opacity: isReadOnly ? 0.8 : 1 }} rows="3" />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '1.5rem 0 0.5rem 0' }}>
                    {isReadOnly ? (
                      <h3 style={{ margin: 0 }}>{formData.wrongViewLabel || 'Avaliação Inicial (Ótica Errada):'}</h3>
                    ) : (
                      <input 
                        name="wrongViewLabel" 
                        value={formData.wrongViewLabel || 'Avaliação Inicial (Ótica Errada):'} 
                        onChange={handleChange} 
                        style={{ ...inputStyle, fontWeight: 'bold', borderBottom: '1px dashed #999', background: 'transparent', width: '100%', fontSize: '1.17em' }} 
                      />
                    )}
                  </div>
                  <textarea name="wrong_view" value={formData.wrong_view || ''} onChange={handleChange} disabled={isReadOnly} style={{ ...textareaStyle, opacity: isReadOnly ? 0.8 : 1 }} rows="3" />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '1.5rem 0 0.5rem 0' }}>
                    {isReadOnly ? (
                      <h3 style={{ margin: 0 }}>{formData.realityLabel || 'Verdadeira Natureza (A Verdade Oculta):'}</h3>
                    ) : (
                      <input 
                        name="realityLabel" 
                        value={formData.realityLabel || 'Verdadeira Natureza (A Verdade Oculta):'} 
                        onChange={handleChange} 
                        style={{ ...inputStyle, fontWeight: 'bold', borderBottom: '1px dashed #999', background: 'transparent', width: '100%', fontSize: '1.17em' }} 
                      />
                    )}
                  </div>
                  <textarea name="reality" value={formData.reality || ''} onChange={handleChange} disabled={isReadOnly} style={{ ...textareaStyle, opacity: isReadOnly ? 0.8 : 1 }} rows="3" />
                </>
              ) : (
                <>
                  <h3 style={{ margin: '1rem 0 0.5rem 0' }}>
                    {formData.type === 'personagem' && 'Biografia:'}
                    {formData.type === 'local' && 'História / Descrição:'}
                    {formData.type === 'organizacao' && 'Objetivo / Atividade:'}
                  </h3>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} disabled={isReadOnly} style={{ ...textareaStyle, opacity: isReadOnly ? 0.8 : 1 }} rows="5" />
                  
                  <h3 style={{ margin: '1rem 0 0.5rem 0' }}>
                    {formData.type === 'personagem' && 'Perfil Psicológico:'}
                    {formData.type === 'local' && 'Importância na Trama:'}
                    {formData.type === 'organizacao' && 'Diretrizes / Filosofia:'}
                  </h3>
                  <textarea name="motivations" value={formData.motivations || ''} onChange={handleChange} disabled={isReadOnly} style={{ ...textareaStyle, opacity: isReadOnly ? 0.8 : 1 }} rows="3" />
                </>
              )}

              {!isClue && (
                <>
                  <div className="dossier-section-title" style={{ marginTop: '2rem' }}>
                    {formData.type === 'personagem' && 'CONEXÕES'}
                    {formData.type === 'local' && 'PERSONAGENS FREQUENTADORES'}
                    {formData.type === 'organizacao' && 'MEMBROS / AFILIADOS'}
                  </div>
                  <ul className="dossier-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
                    {(formData.connections || []).map((conn, idx) => (
                      <li key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <input value={conn.name} onChange={e => updateConnection(idx, 'name', e.target.value)} disabled={isReadOnly} placeholder="Nome" style={{ ...inputStyle, width: '30%', fontWeight: 'bold', opacity: isReadOnly ? 0.8 : 1 }} />
                        <input value={conn.relation} onChange={e => updateConnection(idx, 'relation', e.target.value)} disabled={isReadOnly} placeholder="Relação" style={{ ...inputStyle, width: '60%', opacity: isReadOnly ? 0.8 : 1 }} />
                        {!isReadOnly && <button onClick={() => removeConnection(idx)} style={{ background: 'none', border: 'none', color: '#aa0000', cursor: 'pointer', padding: '0.2rem' }}><Trash2 size={16} /></button>}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Gallery Preview in paper (only showing, no upload button) */}
              {formData.gallery && formData.gallery.length > 0 && (
                <>
                  <div className="dossier-section-title" style={{ marginTop: '2rem' }}>EVIDÊNCIAS ANEXADAS (GALERIA)</div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {formData.gallery.map((img, idx) => (
                      <div key={idx} style={{ width: '100px', height: '100px', padding: '0.3rem', background: '#fff', border: '1px solid #999', transform: `rotate(${Math.random() * 6 - 3}deg)`, boxShadow: '2px 2px 5px rgba(0,0,0,0.2)' }}>
                        <img src={img} alt={`Evidence ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.2) sepia(0.3)' }} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="dossier-section-title" style={{ marginTop: '2rem' }}>STATUS FINAL</div>
              <div className="dossier-box">
                {isReadOnly ? (
                  <>
                    <div style={{ fontFamily: "'Courier New', Courier, monospace", fontWeight: 'bold', color: '#111' }}>
                      {formData.statusFinalTitle || '✓ APTIDÃO OPERACIONAL'}
                    </div>
                    <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '0.9rem', color: '#555', marginTop: '0.5rem' }}>
                      {formData.statusFinalText || 'APROVADO - CENÁRIO DE ALTA PERFORMANCE'}
                    </div>
                  </>
                ) : (
                  <>
                    <input 
                      name="statusFinalTitle" 
                      value={formData.statusFinalTitle || '✓ APTIDÃO OPERACIONAL'} 
                      onChange={handleChange} 
                      placeholder="Título do Status Final"
                      style={{ ...inputStyle, fontFamily: "'Courier New', Courier, monospace", fontWeight: 'bold', color: '#111', width: '100%', marginBottom: '0.3rem', background: 'transparent', borderBottom: '1px dashed rgba(0,0,0,0.2)' }} 
                    />
                    <input 
                      name="statusFinalText" 
                      value={formData.statusFinalText || 'APROVADO - CENÁRIO DE ALTA PERFORMANCE'} 
                      onChange={handleChange} 
                      placeholder="Descrição do Status Final"
                      style={{ ...inputStyle, fontFamily: "'Courier New', Courier, monospace", fontSize: '0.9rem', color: '#555', width: '100%', background: 'transparent', borderBottom: '1px dashed rgba(0,0,0,0.2)' }} 
                    />
                  </>
                )}
              </div>

              {matchingEvents.length > 0 && (
                <div className="marcacoes-container" style={{ marginTop: '4rem', paddingBottom: '2rem', width: '100%', clear: 'both' }}>
                  <div className="dossier-section-title">MARCAÇÕES (EVENTOS)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {matchingEvents.map((ev, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedEventDetail(ev);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedEventDetail(ev);
                        }}
                        style={{ 
                          textAlign: 'left', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.1)', 
                          padding: '0.6rem 1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Courier New', Courier, monospace",
                          fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                      >
                        <span style={{ fontSize: '0.95rem' }}>{ev.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#666', background: 'rgba(255,255,255,0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Ver Detalhes »</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Sticky Notes Area */}
          <div className="dossier-sticky-area">
            
            {/* Sticky Note - Curiosities */}
            <div className="sticky-wrapper" style={{ pointerEvents: 'none' }}>
              <div className="tape-dossier" style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => setIsNoteLifted(!isNoteLifted)}></div>
              <div className={`sticky-dossier ${isNoteLifted ? 'lifted' : ''}`} style={{ pointerEvents: isNoteLifted ? 'none' : 'auto', cursor: 'pointer' }} onClick={() => setIsNoteLifted(true)}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#666', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>
                  {formData.type === 'personagem' ? 'CURIOSIDADE:' : 
                   formData.type === 'local' ? 'CURIOSIDADE DO LOCAL:' : 'CURIOSIDADE:'}
                </div>
                <textarea 
                  name="curiosities" 
                  value={formData.curiosities || ''} 
                  onChange={handleChange} 
                  disabled={isReadOnly}
                  style={{ ...textareaStyle, background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(0,0,0,0.3)', minHeight: '120px', opacity: isReadOnly ? 0.8 : 1 }} 
                  placeholder={isReadOnly ? "Sem observações adicionais." : "Adicione uma observação curiosa..."} 
                />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Event Details Modal */}
      {selectedEventDetail && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '4rem 1rem', overflowY: 'auto' }} onClick={() => setSelectedEventDetail(null)}>
          <div style={{ background: 'var(--card-bg)', width: '100%', maxWidth: '600px', borderRadius: '12px', padding: '2rem', position: 'relative', display: 'flex', flexDirection: 'column', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedEventDetail(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
            
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent-gold)', fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', paddingRight: '2rem' }}>{selectedEventDetail.name}</h3>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold' }}>Informativo</label>
                <div 
                  style={{ fontSize: '1rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}
                  dangerouslySetInnerHTML={{ __html: selectedEventDetail.content }}
                />
              </div>
              
              <div style={{ position: 'relative', zIndex: 10 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold' }}>Participantes / Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(selectedEventDetail.tags || '').split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                    <TagBadge key={i} tag={tag} universe={universe} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
