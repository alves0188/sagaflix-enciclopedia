import { useState } from 'react';
import { Save, Upload, Trash2, AlertTriangle, Lock, Eye, EyeOff, X, UserPlus, UserCheck, Info } from 'lucide-react';
import { uploadImage } from '../lib/supabaseClient';
import { GENRES_LIST } from '../lib/genres';

export default function SynopsisConfig({ book, onUpdateBook, isReadOnly, onLogChange, currentUser, db, onUpdateData, onLeave }) {
  const [formData, setFormData] = useState({
    title: book.title || '',
    synopsis: book.synopsis || '',
    cover: book.cover || '',
    releaseMode: book.releaseMode || 'all',
    releaseIntervalDays: book.releaseIntervalDays || 2,
    releaseWeekday: book.releaseWeekday !== undefined ? book.releaseWeekday : 1,
    ageRating: book.ageRating || 'Livre',
    genres: book.genres || (book.category ? book.category.split(',').map(g => g.trim()) : []),
    coAuthorIds: book.coAuthorIds || (book.coAuthorId ? [book.coAuthorId] : []),
    publicationStatus: book.publicationStatus || 'ongoing',
    distributionMode: book.distributionMode || '',
    universeVisibility: book.universeVisibility || {
      home: false,
      characters: false,
      locations: false,
      organizations: false,
      clues: false,
      events: false
    }
  });
  const [uploading, setUploading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const isCoAuthor = formData.coAuthorIds.includes(currentUser?.id);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [coAuthorInput, setCoAuthorInput] = useState('');
  const [pendingCoAuthor, setPendingCoAuthor] = useState(null);
  const [coAuthorError, setCoAuthorError] = useState('');

  const handleSearchCoAuthor = () => {
    if (!coAuthorInput.trim()) return;
    const found = db?.users?.find(u => u.id === coAuthorInput.trim() && u.id !== currentUser.id);
    if (found) {
      if (formData.coAuthorIds.includes(found.id)) {
        setCoAuthorError('Este autor já é coautor desta obra.');
        setPendingCoAuthor(null);
      } else {
        setPendingCoAuthor(found);
        setCoAuthorError('');
      }
    } else {
      setCoAuthorError('Nenhum usuário encontrado com este ID (ou você tentou adicionar a si mesmo).');
      setPendingCoAuthor(null);
    }
  };

  const handleConfirmCoAuthor = () => {
    if (pendingCoAuthor) {
      const newCoAuthorIds = [...formData.coAuthorIds, pendingCoAuthor.id];
      const newFormData = { ...formData, coAuthorIds: newCoAuthorIds };
      setFormData(newFormData);
      onUpdateBook(book.id, newFormData);
      setPendingCoAuthor(null);
      setCoAuthorInput('');
      setCoAuthorError('');
    }
  };

  const handleRemoveCoAuthor = (idToRemove) => {
    const newCoAuthorIds = formData.coAuthorIds.filter(id => id !== idToRemove);
    const newFormData = { ...formData, coAuthorIds: newCoAuthorIds };
    setFormData(newFormData);
    onUpdateBook(book.id, newFormData);
  };


  const handleConfirmDelete = () => {
    if (!passwordInput) {
      setDeleteError("Por favor, digite sua senha.");
      return;
    }
    if (passwordInput === currentUser?.password) {
      if (db && onUpdateData && onLeave) {
        const newDb = { ...db, books: db.books.filter(b => b.id !== book.id) };
        onUpdateData(newDb);
        onLeave();
      }
    } else {
      setDeleteError("Senha incorreta.");
    }
  };

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({ what: '', why: '', impact: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggleVisibility = (key) => {
    setFormData({
      ...formData,
      universeVisibility: {
        ...formData.universeVisibility,
        [key]: !formData.universeVisibility[key]
      }
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setFormData({ ...formData, cover: url });
      }
    } catch (err) {
      console.error('Erro no upload', err);
      alert(err.message || 'Erro ao fazer upload da capa.');
    }
    setUploading(false);
  };

  const handleSave = () => {
    const updatedData = {
      ...formData,
      category: formData.genres.join(', ')
    };
    onUpdateBook(updatedData);
    if (onLogChange) {
      onLogChange('Editou a Sinopse', `Livro: ${book.title}`);
    }
    alert("Dados do livro salvos com sucesso!");
  };

  const handleTogglePublish = () => {
    if (book.status === 'draft') {
      if (window.confirm("Deseja publicar este livro para os leitores?")) {
        onUpdateBook({ ...formData, status: 'published' });
      }
    } else {
      if (window.confirm("Deseja voltar este livro para Rascunho? Ninguém mais poderá ler até você publicar novamente.")) {
        onUpdateBook({ ...formData, status: 'draft' });
      }
    }
  };

  const formFieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' };

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="synopsis-header-top" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', fontSize: '1.5rem', flex: '1 1 100%', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Sinopse e Capa Oficial
          <button onClick={() => setShowInfo(!showInfo)} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', display: 'flex', padding: '0.2rem' }}>
            <Info size={20} />
          </button>
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {book.status !== 'draft' && (
            <span style={{ color: '#ff9800', fontWeight: 'bold' }}>
              Status: {(book.status || 'draft').toUpperCase()}
            </span>
          )}
          {!isReadOnly && (
            <button id="tour-btn-publish" className="btn-primary" onClick={handleTogglePublish} style={{ flex: 1, minWidth: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: book.status === 'draft' ? '#4CAF50' : '#f44336', color: '#fff', border: 'none' }}>
              {book.status === 'draft' ? 'Publicar Obra' : 'Despublicar'}
            </button>
          )}
          {!isReadOnly && (
            <button className="btn-primary" onClick={handleSave} style={{ flex: 1, minWidth: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', paddingRight: '2.5rem' }}>
              <Save size={18} /> Salvar
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        
        {/* Tutorial Box */}
        {showInfo && (
          <div style={{ 
            background: 'rgba(212, 175, 55, 0.05)', 
            border: '1px solid rgba(212, 175, 55, 0.2)', 
            borderRadius: '8px', 
            padding: '1.2rem', 
            marginBottom: '2rem',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            color: '#e2d4b7'
          }}>
            <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '1rem' }}>
              🚀 Sinopse, Capa e Configurações de Publicação do Livro
            </div>
            <p style={{ margin: '0 0 0.5rem 0' }}><strong>Para que serve:</strong> Centralizar os metadados fundamentais da obra (título, sinopse, classificação etária, múltiplos gêneros) e controlar a publicação (modo de liberação de capítulos, ID de coautor para escrita compartilhada e envio à curadoria).</p>
            <p style={{ margin: '0 0 0.5rem 0' }}><strong>Onde o leitor acessa:</strong> Na vitrine principal da plataforma. Os leitores verão a capa (proporção 2:3), gêneros, classificação indicativa e coautor nos cards do livro, nos popovers e na página inicial.</p>
            <p style={{ margin: 0 }}><strong>Configuração de Capa:</strong> O upload aceita qualquer imagem, mas para manter a padronização visual da plataforma e evitar distorções, recomendamos o formato vertical clássico de livros em **proporção 2:3 (como 800 x 1200 pixels)**.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
          <div style={{ flex: '1 1 300px', paddingBottom: '3rem' }}>
          <div style={formFieldStyle}>
            <label style={{ color: 'var(--text-muted)' }}>Título do Livro</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} disabled={isReadOnly} className="form-input" style={{ fontSize: '1.2rem', padding: '0.8rem', opacity: isReadOnly ? 0.7 : 1 }} />
          </div>

          <div style={formFieldStyle}>
            <label style={{ color: 'var(--text-muted)' }}>Sinopse Oficial (Aparece na Home e Vitrine)</label>
            <textarea name="synopsis" value={formData.synopsis} onChange={handleChange} disabled={isReadOnly} className="form-input" rows="12" style={{ lineHeight: '1.6', fontSize: '1.05rem', opacity: isReadOnly ? 0.7 : 1 }} placeholder="Escreva a sinopse que vai atrair seus leitores..."></textarea>
          </div>

          {/* Modelo de Lançamento */}
          <div style={formFieldStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <label style={{ color: 'var(--text-muted)', margin: 0 }}>Modelo de Lançamento</label>
              <span style={{ fontSize: '0.75rem', color: '#ff9800', fontStyle: 'italic' }}>
                * Altere o modelo se necessário.
              </span>
            </div>
            <select 
              name="distributionMode" 
              value={formData.distributionMode || 'complete'} 
              onChange={handleChange}
              disabled={isReadOnly}
              className="form-input" 
              style={{ padding: '0.6rem', opacity: isReadOnly ? 0.7 : 1 }}
            >
              <option value="complete">Conteúdo Completo</option>
              <option value="weekly">Distribuição Semanal</option>
              <option value="webnovel">Webnovel / Contínuo</option>
              <option value="short_story">Histórias Curtas / Contos (Sem Universo)</option>
            </select>
          </div>

          {/* Classificação Etária */}
          <div style={formFieldStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <label style={{ color: 'var(--text-muted)', margin: 0 }}>Classificação Etária</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontStyle: 'italic' }}>
                * A curadoria pode alterar se julgar necessário
              </span>
            </div>
            <select 
              name="ageRating" 
              value={formData.ageRating} 
              onChange={handleChange} 
              disabled={isReadOnly} 
              className="form-input" 
              style={{ padding: '0.6rem', opacity: isReadOnly ? 0.7 : 1 }}
            >
              <option value="Livre">Livre</option>
              <option value="10">10 anos</option>
              <option value="12">12 anos</option>
              <option value="14">14 anos</option>
              <option value="16">16 anos</option>
              <option value="18">18 anos</option>
            </select>
          </div>

          {/* Status de Publicação da Obra */}
          <div style={formFieldStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <label style={{ color: 'var(--text-muted)', margin: 0 }}>Status da Obra</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontStyle: 'italic' }}>
                * Leitores adoram acompanhar obras em andamento!
              </span>
            </div>
            <select 
              name="publicationStatus" 
              value={formData.publicationStatus} 
              onChange={handleChange} 
              disabled={isReadOnly} 
              className="form-input" 
              style={{ padding: '0.6rem', opacity: isReadOnly ? 0.7 : 1 }}
            >
              <option value="ongoing">Em Andamento</option>
              <option value="completed">Concluída</option>
            </select>
          </div>

          {/* Gêneros da Obra */}
          <div style={formFieldStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ color: 'var(--text-muted)', margin: 0 }}>Gêneros da Obra (Selecione um ou mais)</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontStyle: 'italic' }}>
                * A curadoria também pode alterar se for o caso
              </span>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', 
              gap: '0.8rem', 
              background: 'rgba(0,0,0,0.15)', 
              padding: '1.2rem', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color)' 
            }}>
              {GENRES_LIST.map(genre => (
                <label key={genre} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isReadOnly ? 'default' : 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <input 
                    type="checkbox" 
                    disabled={isReadOnly}
                    checked={formData.genres.includes(genre)}
                    onChange={(e) => {
                      if (isReadOnly) return;
                      if (e.target.checked) {
                        setFormData({ ...formData, genres: [...formData.genres, genre] });
                      } else {
                        setFormData({ ...formData, genres: formData.genres.filter(g => g !== genre) });
                      }
                    }}
                    style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px' }}
                  />
                  {genre}
                </label>
              ))}
            </div>
          </div>

          {formData.distributionMode !== 'short_story' && (
            <div style={{ ...formFieldStyle, background: 'rgba(212, 175, 55, 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)', marginBottom: '2rem' }}>
              <label style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Visibilidade do Universo Expandido
              </label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
                Selecione quais áreas do seu Universo Expandido ficarão visíveis para os leitores que clicarem em "Explorar Universo". Por padrão, tudo é oculto (para Histórias Curtas, este painel não aparece).
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { key: 'home', label: 'Página Inicial (Home)' },
                  { key: 'characters', label: 'Personagens' },
                  { key: 'locations', label: 'Locais' },
                  { key: 'organizations', label: 'Organizações' },
                  { key: 'clues', label: 'Complementos / Pistas' },
                  { key: 'events', label: 'Eventos' }
                ].map(opt => (
                  <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isReadOnly ? 'default' : 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <input 
                      type="checkbox" 
                      disabled={isReadOnly}
                      checked={formData.universeVisibility && formData.universeVisibility[opt.key]}
                      onChange={() => { if(!isReadOnly) handleToggleVisibility(opt.key); }}
                      style={{ accentColor: 'var(--accent-gold)', width: '16px', height: '16px' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Marcação de Coautor */}
          <div style={formFieldStyle}>
            <label style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Gerenciar Coautores (Opcional)</label>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              
              {/* Lista de coautores atuais */}
              {formData.coAuthorIds.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  {formData.coAuthorIds.map(caId => {
                    const caUser = db?.users?.find(u => u.id === caId);
                    return (
                      <div key={caId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--accent-gold)' }}>
                            {caUser?.avatar ? (
                              <img src={caUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                                <UserCheck size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>{caUser?.name || 'Usuário Desconhecido'}</strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>ID: {caId}</span>
                          </div>
                        </div>
                        {!isReadOnly && (!isCoAuthor || caId === currentUser?.id) && (
                          <button 
                            onClick={(e) => { e.preventDefault(); handleRemoveCoAuthor(caId); }}
                            style={{ background: 'rgba(255,59,48,0.1)', color: '#ff3b30', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title={isCoAuthor ? "Remover-se da Coautoria" : "Remover Coautor"}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Adicionar novo coautor */}
              {!isReadOnly && !isCoAuthor && (
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Cole aqui o ID do autor..." 
                      value={coAuthorInput}
                      onChange={(e) => {
                        setCoAuthorInput(e.target.value);
                        setCoAuthorError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchCoAuthor();
                        }
                      }}
                      style={{ flex: 1, padding: '0.6rem' }}
                    />
                    <button 
                      onClick={(e) => { e.preventDefault(); handleSearchCoAuthor(); }}
                      className="btn-secondary"
                      style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <UserPlus size={16} /> OK
                    </button>
                  </div>
                  {coAuthorError && (
                    <small style={{ color: '#ff3b30', display: 'block', marginTop: '0.5rem' }}>{coAuthorError}</small>
                  )}
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    Ao vincular o ID de outro autor ativo, a obra ficará visível no painel dele como um espelho de edição (o que um alterar, altera no outro).
                  </small>
                </div>
              )}
            </div>

            {/* Modal de Confirmação de Coautor */}
            {pendingCoAuthor && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'var(--card-bg)', width: '90%', maxWidth: '400px', borderRadius: '12px', padding: '2rem', border: '1px solid var(--accent-gold)', position: 'relative' }}>
                  <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent-gold)', textAlign: 'center', fontFamily: "'Playfair Display', serif" }}>Confirmar Coautor</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-gold)', marginBottom: '1rem' }}>
                      {pendingCoAuthor.avatar ? (
                        <img src={pendingCoAuthor.avatar} alt={pendingCoAuthor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                          <UserCheck size={40} />
                        </div>
                      )}
                    </div>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{pendingCoAuthor.name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>ID: {pendingCoAuthor.id}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Membro desde: {pendingCoAuthor.createdAt ? new Date(pendingCoAuthor.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setPendingCoAuthor(null);
                        setCoAuthorInput('');
                      }}
                      style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Não é esse
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); handleConfirmCoAuthor(); }}
                      style={{ flex: 1, padding: '0.8rem', background: 'var(--accent-gold)', border: 'none', color: 'var(--bg-color)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Sim, é este!
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={formFieldStyle}>
            <label style={{ color: 'var(--text-muted)' }}>Agendamento de Liberação de Capítulos (Apenas Novos Livros)</label>
            <select 
              name="releaseMode" 
              value={formData.releaseMode} 
              onChange={handleChange} 
              disabled={isReadOnly} 
              className="form-input" 
              style={{ padding: '0.6rem', opacity: isReadOnly ? 0.7 : 1 }}
            >
              <option value="all">Publicar tudo de uma vez (Imediato)</option>
              <option value="daily">Um capítulo por dia</option>
              <option value="interval">A cada X dias (Intervalo personalizado)</option>
              <option value="weekly">Semanalmente (Em um dia específico da semana)</option>
              <option value="monthly">Mensalmente (Um capítulo por mês)</option>
            </select>
          </div>

          {formData.releaseMode === 'interval' && (
            <div style={formFieldStyle}>
              <label style={{ color: 'var(--text-muted)' }}>Intervalo de Dias</label>
              <input 
                type="number" 
                name="releaseIntervalDays" 
                value={formData.releaseIntervalDays} 
                onChange={handleChange} 
                disabled={isReadOnly} 
                min="1" 
                className="form-input" 
                style={{ padding: '0.6rem', opacity: isReadOnly ? 0.7 : 1 }} 
              />
            </div>
          )}

          {formData.releaseMode === 'weekly' && (
            <div style={formFieldStyle}>
              <label style={{ color: 'var(--text-muted)' }}>Dia de Lançamento Semanal</label>
              <select 
                name="releaseWeekday" 
                value={formData.releaseWeekday} 
                onChange={handleChange} 
                disabled={isReadOnly} 
                className="form-input" 
                style={{ padding: '0.6rem', opacity: isReadOnly ? 0.7 : 1 }}
              >
                <option value="1">Segunda-feira</option>
                <option value="2">Terça-feira</option>
                <option value="3">Quarta-feira</option>
                <option value="4">Quinta-feira</option>
                <option value="5">Sexta-feira</option>
                <option value="6">Sábado</option>
                <option value="0">Domingo</option>
              </select>
            </div>
          )}


          <div style={{ height: '120px' }} />
        </div>

        <div style={{ flex: '1 1 300px', maxWidth: '350px', paddingBottom: '3rem', margin: '0 auto' }}>
          <div style={formFieldStyle}>
            <label style={{ color: 'var(--text-muted)' }}>Capa Oficial do Livro</label>
            <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: '#000', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              {formData.cover ? (
                <>
                  <img 
                    src={formData.cover} 
                    alt="" 
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      filter: 'blur(15px)', 
                      opacity: 0.3, 
                      zIndex: 0 
                    }} 
                  />
                  <img 
                    src={formData.cover} 
                    alt="Capa" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain', 
                      zIndex: 1,
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))' 
                    }} 
                  />
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Nenhuma capa</span>
              )}
            </div>
            
            {!isReadOnly && (
              <>
                <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  {uploading ? 'Enviando...' : <><Upload size={16} /> Enviar Nova Capa</>}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
                <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.6rem', textAlign: 'center', fontSize: '0.75rem', fontStyle: 'italic' }}>
                  Dimensão sugerida: <strong>800 x 1200 pixels</strong> (Proporção 2:3)
                </small>
              </>
            )}
            <div style={{ height: '120px' }} />
          </div>
        </div>
      </div>

      {/* ZONA DE PERIGO */}
      {!isReadOnly && currentUser?.role === 'author' && (
        <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,59,48,0.2)', paddingTop: '2rem' }}>
          <h3 style={{ color: '#ff3b30', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.2rem' }}>
            <AlertTriangle size={20} /> Zona de Perigo
          </h3>
          <div style={{ background: 'rgba(255,59,48,0.05)', border: '1px solid rgba(255,59,48,0.1)', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.3rem' }}>Excluir Obra Permanentemente</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Esta ação não poderá ser desfeita. Todo o conteúdo, personagens, locais e complementos vinculados a esta obra serão perdidos.</span>
            </div>
            <button 
              onClick={() => {
                if (window.confirm(`Tem certeza absoluta que deseja excluir a obra "${book.title}"?\n\nEsta ação é IRREVERSÍVEL!`)) {
                  setShowDeleteModal(true);
                  setPasswordInput('');
                  setDeleteError('');
                }
              }}
              style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Excluir Obra
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE SENHA PARA EXCLUSÃO */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg)', width: '90%', maxWidth: '400px', borderRadius: '12px', padding: '2rem', border: '1px solid rgba(255,59,48,0.3)', position: 'relative' }}>
            <button 
              onClick={() => setShowDeleteModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,59,48,0.1)', color: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={30} />
              </div>
              <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.3rem' }}>Confirmar Exclusão</h2>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Para confirmar a exclusão de <strong>{book.title}</strong>, digite sua senha de autor.
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Senha</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0 1rem' }}>
                <Lock size={16} color="var(--text-muted)" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Sua senha..."
                  style={{ flex: 1, background: 'none', border: 'none', color: '#fff', padding: '0.8rem', outline: 'none' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmDelete()}
                  autoFocus
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {deleteError && (
                <div style={{ color: '#ff3b30', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>
                  {deleteError}
                </div>
              )}
            </div>

            <button 
              onClick={handleConfirmDelete}
              style={{ width: '100%', background: '#ff3b30', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
            >
              Confirmar Exclusão
            </button>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
