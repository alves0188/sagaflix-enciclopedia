import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

export default function DetailModal({ item, events, onClose, bookTitle }) {
  const [isNoteLifted, setIsNoteLifted] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const isClue = item.type === 'pista';

  const matchingEvents = (events || []).filter(ev => {
    if (!ev.tags) return false;
    const nameStr = (item.name || item.title || '').toLowerCase();
    const tagArray = ev.tags.split(',').map(t => t.trim().toLowerCase());
    return tagArray.includes(nameStr);
  });

  return (
    <div className="dossier-modal-container">
      
      {/* Coluna Esquerda: Arquivos Confidenciais */}
      <div onClick={e => e.stopPropagation()} className="dossier-left-panel">
        
        <button className="btn-voltar-dossier" onClick={onClose} style={{ marginBottom: '2rem', background: '#333', color: '#fff', border: 'none', padding: '0.8rem 1rem', fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', borderRadius: '4px' }}>
          <ArrowLeft size={18} /> FECHAR DOSSIÊ
        </button>

        <h2 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>Arquivos Confidenciais</h2>

        {item.privateNotes ? (
          <div style={{ marginBottom: '2rem', flexShrink: 0 }}>
            <label style={{ fontSize: '0.8rem', color: '#ff7777', fontWeight: 'bold' }}>NOTAS DO AUTOR (SECRETO)</label>
            <div style={{ width: '100%', background: 'rgba(255, 100, 100, 0.05)', border: '1px solid rgba(255, 100, 100, 0.3)', color: '#fff', padding: '0.8rem', borderRadius: '4px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {item.privateNotes}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '2rem', flexShrink: 0, color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Nenhuma nota secreta registrada para este dossiê.
          </div>
        )}
      </div>

      {/* Coluna Direita: O Papel Dossiê */}
      <div className="dossier-wrapper" onClick={onClose}>
        <div className="dossier-paper" onClick={e => e.stopPropagation()}>
          
          {/* Paperclip */}
          <div className="dossier-paperclip"></div>
          
          {/* Tab */}
          <div className="dossier-tab">DOSSIÊ</div>

          {/* Header */}
          <div className="dossier-header">
            <div className="dossier-org" style={{ lineHeight: 1.4, alignSelf: 'flex-start' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>FICHA TÉCNICA COMPLEMENTAR:</span>
              <div style={{ fontWeight: 'bold' }}>{(bookTitle || 'Jardim das Flores').toUpperCase()}</div>
            </div>
            <div className="dossier-classification">CLASSIFICAÇÃO: RESTRITO - APENAS PARA LEITURA</div>
          </div>

          <div className="dossier-subheader">
            <div>DOSSIÊ DE: {item.name ? item.name.toUpperCase() : item.title?.toUpperCase()}</div>
            <div className="dossier-status" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              STATUS: 
              <span className="badge-tag-status" style={{ background: 'var(--accent-gold)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {(item.statusTag || (
                  item.type === 'personagem' ? 'Personagem principal' :
                  item.type === 'local' ? 'Território Neutro' :
                  item.type === 'organizacao' ? 'Gangue/Facção' : 'Pista/Evidência'
                )).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="dossier-grid">
            
            {/* Esquerda: Foto e Dados */}
            <div>
              <div className="dossier-photo-container">
                <div className="dossier-photo-title">FOTO DE IDENTIFICAÇÃO</div>
                <img 
                  src={item.image} 
                  alt={item.name || item.title} 
                  className="dossier-photo" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setLightboxImage(item.image)}
                />
              </div>

              <div className="dossier-section-title">
                {item.type === 'personagem' && 'DADOS PESSOAIS'}
                {item.type === 'local' && 'DADOS DO LOCAL'}
                {item.type === 'organizacao' && 'DADOS DA ORGANIZAÇÃO'}
                {item.type === 'pista' && 'DADOS DO COMPLEMENTO'}
              </div>
              
              <div className="dossier-personal-data">
                <div><strong>NOME COMPLETO:</strong> {item.name || item.title}</div>
                {item.role && (
                  <div>
                    <strong>
                      {(item.roleLabel || (
                        item.type === 'personagem' ? 'FUNÇÃO' :
                        item.type === 'local' ? 'TIPO DE ESTRUTURA' :
                        item.type === 'organizacao' ? 'PROPÓSITO/SETOR' : 'CATEGORIA'
                      )).toUpperCase()}:
                    </strong> {item.role}
                  </div>
                )}
                {item.territory && (
                  <div>
                    <strong>
                      {(item.territoryLabel || (
                        item.type === 'personagem' ? 'TERRITÓRIO' :
                        item.type === 'local' ? 'LOCALIZAÇÃO/ZONA' :
                        item.type === 'organizacao' ? 'SEDE/ATUAÇÃO' : 'PORTADOR/ORIGEM'
                      )).toUpperCase()}:
                    </strong> {item.territory}
                  </div>
                )}
                {item.age && <div><strong>IDADE:</strong> {item.age}</div>}
                <div><strong>TIPO:</strong> {item.type ? item.type.toUpperCase() : 'DESCONHECIDO'}</div>
                
                {/* Custom Fields Dinâmicos */}
                {item.customFields && item.customFields.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {item.customFields.map((cf, idx) => (
                      <div key={idx}><strong>{cf.label?.toUpperCase()}:</strong> {cf.value}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Direita: Perfil Operacional e Dinâmica */}
            <div className="dossier-main-content">
              <div className="dossier-section-title">
                {item.type === 'personagem' && 'ESPECIFICAÇÕES'}
                {item.type === 'local' && 'AMBIENTAÇÃO & INFRAESTRUTURA'}
                {item.type === 'organizacao' && 'ESTRUTURA & OPERAÇÃO'}
                {item.type === 'pista' && 'DETALHES DO COMPLEMENTO'}
              </div>
              
              {isClue ? (
                <>
                  <h3>{item.foundLabel || 'Relatório de Campo (O que encontraram):'}</h3>
                  <p>{item.found}</p>
                  <h3>{item.wrongViewLabel || 'Avaliação Inicial (Ótica Errada):'}</h3>
                  <p>{item.wrong_view}</p>
                  <h3>{item.realityLabel || 'Verdadeira Natureza (A Verdade Oculta):'}</h3>
                  <p>{item.reality}</p>
                </>
              ) : (
                <>
                  <h3>
                    {item.type === 'personagem' ? 'Biografia:' :
                     item.type === 'local' ? 'História / Descrição:' :
                     item.type === 'organizacao' ? 'Objetivo / Atividade:' : 'Biografia:'}
                  </h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p>
                  
                  <h3>
                    {item.type === 'personagem' ? 'Perfil Psicológico:' :
                     item.type === 'local' ? 'Importância na Trama:' :
                     item.type === 'organizacao' ? 'Diretrizes / Filosofia:' : 'Perfil Psicológico:'}
                  </h3>
                  <p>{item.motivations}</p>
                </>
              )}

              {!isClue && item.connections && item.connections.length > 0 && (
                <>
                  <div className="dossier-section-title" style={{ marginTop: '2rem' }}>
                    {item.type === 'personagem' ? 'CONEXÕES' :
                     item.type === 'local' ? 'PERSONAGENS FREQUENTADORES' :
                     item.type === 'organizacao' ? 'MEMBROS / AFILIADOS' : 'CONEXÕES'}
                  </div>
                  <ul className="dossier-list">
                    {item.connections.map((conn, idx) => (
                      <li key={idx}><strong>{conn.name}:</strong> {conn.relation}</li>
                    ))}
                  </ul>
                </>
              )}

              {/* Gallery (Attached Evidences) */}
              {item.gallery && item.gallery.length > 0 && (
                <>
                  <div className="dossier-section-title" style={{ marginTop: '2rem' }}>EVIDÊNCIAS ANEXADAS</div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    {item.gallery.map((img, idx) => (
                      <div key={idx} style={{ width: '100px', height: '100px', padding: '0.3rem', background: '#fff', border: '1px solid #999', transform: `rotate(${Math.random() * 6 - 3}deg)`, boxShadow: '2px 2px 5px rgba(0,0,0,0.2)' }}>
                        <img 
                          src={img} 
                          alt={`Evidência ${idx}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.2) sepia(0.3)', cursor: 'pointer' }} 
                          onClick={() => setLightboxImage(img)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="dossier-section-title" style={{ marginTop: '2rem' }}>STATUS FINAL</div>
              <div className="dossier-box">
                <div style={{ fontFamily: "'Courier New', Courier, monospace", fontWeight: 'bold', color: '#111' }}>
                  {item.statusFinalTitle || '✓ APTIDÃO OPERACIONAL'}
                </div>
                <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '0.9rem', color: '#555', marginTop: '0.5rem' }}>
                  {item.statusFinalText || 'APROVADO - CENÁRIO DE ALTA PERFORMANCE'}
                </div>
              </div>

            </div>
          </div>

          {/* Sticky Notes Area */}
          <div className="dossier-sticky-area">
            
            {((!isClue && item.curiosities) || (isClue && item.curiosities)) && (
              <div className="sticky-wrapper" onClick={() => setIsNoteLifted(!isNoteLifted)}>
                <div className="tape-dossier"></div>
                <div className={`sticky-dossier ${isNoteLifted ? 'lifted' : ''}`}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>
                    {item.type === 'personagem' ? 'CURIOSIDADE:' : 
                     item.type === 'local' ? 'CURIOSIDADE DO LOCAL:' : 'CURIOSIDADE:'}
                  </div>
                  {item.curiosities}
                </div>
              </div>
            )}

          {matchingEvents.map((ev, idx) => (
            <div key={idx} className="sticky-wrapper" style={{ zIndex: 35 + idx }}>
              <div className="tape-dossier"></div>
              <div className="sticky-dossier" style={{ backgroundColor: '#a8d8ea', transform: `rotate(${Math.random() * 6 - 3}deg)` }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#444', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>OCORRÊNCIA: {ev.name}</div>
                {ev.content}
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.8rem', fontStyle: 'italic', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.3rem' }}>
                  Envolvidos: {ev.tags}
                </div>
              </div>
            </div>
          ))}

        </div>

      </div>
      
      {/* Lightbox para ampliação */}
      <ImageLightbox 
        imageUrl={lightboxImage} 
        onClose={() => setLightboxImage(null)} 
      />
    </div>
  </div>
  );
}
