import { useState } from 'react';
import { ArrowLeft, Save, Upload, Trash2 } from 'lucide-react';

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

export default function DossierEditor({ formData, setFormData, onSave, onCancel, uploading, handleFileUpload, isReadOnly = false, bookTitle }) {
  const isClue = formData.type === 'pista';
  const defaults = getDefaultLabels(formData.type);
  const currentRoleLabel = formData.roleLabel || defaults.role;
  const currentTerritoryLabel = formData.territoryLabel || defaults.territory;
  const [hasChanges, setHasChanges] = useState(false);

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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Coluna Esquerda: Painel Adm (Ferramentas de Edição) */}
      <div style={{ width: '300px', backgroundColor: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 10, boxShadow: '5px 0 25px rgba(0,0,0,0.5)', height: '100%' }}>
        
        <h2 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>
          {isReadOnly ? 'Painel de Leitura' : 'Ferramentas de Controle'}
        </h2>
        
        {!isReadOnly && renderDossierTutorial(formData.type)}
        
        {!isReadOnly && (
          <>
            <button className="btn-secondary" onClick={addCustomField} style={{ width: '100%', marginBottom: '0.5rem', justifyContent: 'center' }}>+ Novo Campo Dinâmico</button>
            {!isClue && <button className="btn-secondary" onClick={addConnection} style={{ width: '100%', marginBottom: '2rem', justifyContent: 'center' }}>+ Nova Conexão</button>}
          </>
        )}

        <div style={{ marginBottom: '2rem', flexShrink: 0 }}>
          <label style={{ fontSize: '0.8rem', color: '#ff7777', fontWeight: 'bold' }}>NOTAS DO AUTOR (SECRETO)</label>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.5rem 0', lineHeight: 1.2 }}>Estas anotações não aparecerão no Dossiê do leitor final.</p>
          <textarea 
            name="privateNotes" 
            value={formData.privateNotes || ''} 
            onChange={handleChange} 
            disabled={isReadOnly}
            style={{ width: '100%', background: 'rgba(255, 100, 100, 0.05)', border: '1px solid rgba(255, 100, 100, 0.3)', color: '#fff', padding: '0.8rem', minHeight: '150px', borderRadius: '4px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', resize: 'vertical', opacity: isReadOnly ? 0.7 : 1 }} 
            placeholder={isReadOnly ? "Sem anotações privadas." : "Segredos, ideias futuras, pontos a trabalhar..."}
          ></textarea>
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
      <div className="dossier-wrapper" style={{ flex: 1, padding: '3rem', overflowY: 'auto', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '100%' }}>
        
        <div className="dossier-paper" style={{ maxWidth: '1000px', width: '100%', position: 'relative', cursor: 'default', transform: 'none', margin: '0 auto' }}>
          
          {/* Paperclip */}
          <div className="dossier-paperclip"></div>
          <div className="dossier-tab">DOSSIÊ</div>

          {/* Action Buttons */}
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '1rem', zIndex: 110 }}>
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
            <div>DOSSIÊ DE: <input name="name" value={formData.name || formData.title || ''} onChange={handleChange} disabled={isReadOnly} placeholder="Nome" style={{ ...inputStyle, width: '300px', textTransform: 'uppercase', fontWeight: 'bold', opacity: isReadOnly ? 0.8 : 1 }} /></div>
            <div className="dossier-status" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
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
                  style={{ ...inputStyle, width: '180px', background: '#fff', color: '#000', padding: '0.1rem', height: '24px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #ccc', borderRadius: '4px' }}
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

            </div>
          </div>

          {/* Sticky Notes Area */}
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', display: 'flex', gap: '1rem', zIndex: 45, alignItems: 'flex-end', flexDirection: 'row-reverse' }}>
            
            {/* Sticky Note - Curiosities */}
            <div className="sticky-wrapper" style={{ position: 'relative', bottom: 0, right: 0, zIndex: 40, cursor: 'default' }}>
              <div className="tape-dossier"></div>
              <div className="sticky-dossier">
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
    </div>
  );
}
