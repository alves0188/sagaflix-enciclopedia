import { useState } from 'react';
import { ArrowLeft, Lock, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

export default function DetailModal({ item, events, onClose, bookTitle, onRequestAccess, db, currentUser, onUpdateData }) {
  const [isNoteLifted, setIsNoteLifted] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const isClue = item.type === 'pista';

  const handleFeedback = (noteId, type) => {
    if (!currentUser || !onUpdateData) return;
    const newDb = { ...db };
    if (!newDb.noteFeedback) newDb.noteFeedback = [];
    
    const existingIndex = newDb.noteFeedback.findIndex(f => f.noteId === noteId && f.userId === currentUser.id);
    if (existingIndex !== -1) {
      if (newDb.noteFeedback[existingIndex].type === type) {
        // toggle off
        newDb.noteFeedback.splice(existingIndex, 1);
      } else {
        // switch
        newDb.noteFeedback[existingIndex].type = type;
      }
    } else {
      newDb.noteFeedback.push({
        id: 'fb_' + Date.now() + Math.random(),
        noteId,
        userId: currentUser.id,
        type,
        timestamp: new Date().toISOString()
      });
    }
    onUpdateData(newDb);
  };

  const getNoteFeedbackStats = (noteId) => {
    const feedbackList = db?.noteFeedback || [];
    const likes = feedbackList.filter(f => f.noteId === noteId && f.type === 'like').length;
    const dislikes = feedbackList.filter(f => f.noteId === noteId && f.type === 'dislike').length;
    const userVote = currentUser ? feedbackList.find(f => f.noteId === noteId && f.userId === currentUser.id)?.type : null;
    return { likes, dislikes, userVote };
  };

  const matchingEvents = (events || []).filter(ev => {
    if (!ev.tags) return false;
    const nameStr = (item.name || item.title || '').trim().toLowerCase();
    const tagArray = ev.tags.split(',').map(t => t.trim().toLowerCase());
    return tagArray.some(tag => tag === nameStr || nameStr.includes(tag) || tag.includes(nameStr));
  });

  return (
    <div className="dossier-modal-container">
      
      {/* Coluna Esquerda: Notas do Autor */}
      <div onClick={e => e.stopPropagation()} className="dossier-left-panel">
        
        <h2 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>Notas do Autor</h2>

        {(!item.authorNotes || item.authorNotes.length === 0) && !item.privateNotes ? (
          <div style={{ marginBottom: '2rem', flexShrink: 0, color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Nenhuma nota registrada para este dossiê.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Compatibilidade com nota antiga */}
            {item.privateNotes && (!item.authorNotes || item.authorNotes.length === 0) && (
              <div style={{ flexShrink: 0 }}>
                <label style={{ fontSize: '0.8rem', color: '#ff7777', fontWeight: 'bold' }}>NOTAS DO AUTOR (SECRETO)</label>
                <div style={{ width: '100%', background: 'rgba(255, 100, 100, 0.05)', border: '1px solid rgba(255, 100, 100, 0.3)', color: '#fff', padding: '0.8rem', borderRadius: '4px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {item.privateNotes}
                </div>
              </div>
            )}

            {/* Novas Notas */}
            {item.authorNotes && item.authorNotes.map(note => {
              const req = db?.noteRequests?.find(r => r.noteId === note.id && r.userId === currentUser?.id);
              const hasAccess = req?.status === 'approved';
              
              if (!note.isSecret || hasAccess) {
                const stats = getNoteFeedbackStats(note.id);
                return (
                  <div key={note.id} style={{ flexShrink: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: note.isSecret ? '#ff7777' : 'var(--accent-gold)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {note.title || (note.isSecret ? 'NOTA SECRETA (LIBERADA)' : 'NOTA PÚBLICA')}
                    </label>
                    <div style={{ width: '100%', background: note.isSecret ? 'rgba(255, 100, 100, 0.05)' : 'rgba(212, 175, 55, 0.05)', border: `1px solid ${note.isSecret ? 'rgba(255, 100, 100, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`, color: '#fff', padding: '0.8rem', borderRadius: '4px 4px 0 0', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {note.content}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', background: note.isSecret ? 'rgba(255, 100, 100, 0.1)' : 'rgba(212, 175, 55, 0.1)', border: `1px solid ${note.isSecret ? 'rgba(255, 100, 100, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`, borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '0.5rem 0.8rem', alignItems: 'center' }}>
                      <button 
                        onClick={() => handleFeedback(note.id, 'like')}
                        style={{ background: 'none', border: 'none', color: stats.userVote === 'like' ? '#4CAF50' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <ThumbsUp size={16} /> {stats.likes > 0 && stats.likes}
                      </button>
                      <button 
                        onClick={() => handleFeedback(note.id, 'dislike')}
                        style={{ background: 'none', border: 'none', color: stats.userVote === 'dislike' ? '#f44336' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <ThumbsDown size={16} /> {stats.dislikes > 0 && stats.dislikes}
                      </button>
                    </div>
                  </div>
                );
              }

              // Nota Secreta (Sem acesso)
              const isPending = req?.status === 'pending';
              const isRejected = req?.status === 'rejected';

              return (
                <div key={note.id} style={{ flexShrink: 0 }}>
                  <label style={{ fontSize: '0.8rem', color: '#ff7777', fontWeight: 'bold', textTransform: 'uppercase' }}>{note.title || 'NOTA SECRETA'}</label>
                  <div 
                    onClick={() => onRequestAccess && onRequestAccess(note.id)}
                    style={{ 
                      width: '100%', 
                      background: 'rgba(0, 0, 0, 0.3)', 
                      border: isRejected ? '1px dashed #ff4444' : (isPending ? '1px dashed #ffaa00' : '1px dashed #555'), 
                      color: isRejected ? '#ff4444' : (isPending ? '#ffaa00' : '#888'), 
                      padding: '0.8rem', 
                      borderRadius: '4px', 
                      fontFamily: 'Inter, sans-serif', 
                      fontSize: '0.9rem', 
                      marginTop: '0.5rem', 
                      cursor: isPending || isRejected ? 'default' : 'pointer', 
                      textAlign: 'center', 
                      transition: 'all 0.2s ease' 
                    }}
                    onMouseOver={e => { 
                      if (!isPending && !isRejected) {
                        e.currentTarget.style.color = '#fff'; 
                        e.currentTarget.style.borderColor = '#ff7777'; 
                        e.currentTarget.style.background = 'rgba(255, 100, 100, 0.1)'; 
                      }
                    }}
                    onMouseOut={e => { 
                      e.currentTarget.style.color = isRejected ? '#ff4444' : (isPending ? '#ffaa00' : '#888'); 
                      e.currentTarget.style.borderColor = isRejected ? '#ff4444' : (isPending ? '#ffaa00' : '#555'); 
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'; 
                    }}
                  >
                    {isPending ? (
                      <><Lock size={16} /> ⏳ Acesso Solicitado (Aguardando Aprovação)</>
                    ) : isRejected ? (
                      <><X size={16} /> Acesso Recusado pelo Autor (Clique para tentar novamente)</>
                    ) : (
                      <><Lock size={16} /> Conteúdo Restrito (Pedir Acesso)</>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Coluna Direita: O Papel Dossiê */}
      <div className="dossier-wrapper" onClick={onClose}>
        <div className="dossier-paper" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
          
          {/* Botão Fechar no Topo Direito */}
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px', zIndex: 10 }}>
            FECHAR ARQUIVOS
          </button>

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
