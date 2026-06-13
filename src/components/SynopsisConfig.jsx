import { useState } from 'react';
import { Save, Upload } from 'lucide-react';
import { uploadImage } from '../lib/supabaseClient';
import { GENRES_LIST } from '../lib/genres';

export default function SynopsisConfig({ book, onUpdateBook, isReadOnly, onLogChange }) {
  const [formData, setFormData] = useState({
    title: book.title || '',
    synopsis: book.synopsis || '',
    cover: book.cover || '',
    releaseMode: book.releaseMode || 'all',
    releaseIntervalDays: book.releaseIntervalDays || 2,
    releaseWeekday: book.releaseWeekday !== undefined ? book.releaseWeekday : 1,
    ageRating: book.ageRating || 'Livre',
    genres: book.genres || (book.category ? book.category.split(',').map(g => g.trim()) : []),
    coAuthorId: book.coAuthorId || ''
  });
  const [uploading, setUploading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({ what: '', why: '', impact: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmitToCuration = () => {
    if (window.confirm("Deseja realmente enviar este livro para a Curadoria? Após o envio, você não poderá mais editar os conteúdos deste livro até a aprovação ou rejeição.")) {
      onUpdateBook({ ...formData, status: 'pending' });
      alert("Livro enviado para curadoria com sucesso!");
    }
  };

  const handleSendRequest = () => {
    if (!requestData.what || !requestData.why) {
      alert("Preencha os campos obrigatórios.");
      return;
    }
    if (onLogChange) {
      onLogChange('Pediu alteração', JSON.stringify(requestData), 'request');
    }
    setShowRequestModal(false);
    setRequestData({ what: '', why: '', impact: '' });
    alert("Pedido enviado para a curadoria com sucesso!");
  };

  const formFieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' };

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '2.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--text-main)' }}>Sinopse e Capa Oficial</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {book.status !== 'draft' && (
            <span style={{ color: '#ff9800', fontWeight: 'bold', marginRight: '1rem' }}>
              Status: {book.status.toUpperCase()}
            </span>
          )}
          {book.status === 'draft' && (
            <button className="btn-primary" onClick={handleSubmitToCuration} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ff9800', color: '#000', border: 'none' }}>
              Enviar para Curadoria
            </button>
          )}
          {book.status !== 'draft' && (
            <button className="btn-primary" onClick={() => setShowRequestModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#2196F3', color: '#fff', border: 'none' }}>
              Pedir Alteração
            </button>
          )}
          {!isReadOnly && (
            <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> Salvar Dados do Livro
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        
        {/* Tutorial Box */}
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

        <div style={{ display: 'flex', gap: '3rem' }}>
          <div style={{ flex: 1, paddingBottom: '3rem' }}>
          <div style={formFieldStyle}>
            <label style={{ color: 'var(--text-muted)' }}>Título do Livro</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} disabled={isReadOnly} className="form-input" style={{ fontSize: '1.2rem', padding: '0.8rem', opacity: isReadOnly ? 0.7 : 1 }} />
          </div>

          <div style={formFieldStyle}>
            <label style={{ color: 'var(--text-muted)' }}>Sinopse Oficial (Aparece na Home e Vitrine)</label>
            <textarea name="synopsis" value={formData.synopsis} onChange={handleChange} disabled={isReadOnly} className="form-input" rows="12" style={{ lineHeight: '1.6', fontSize: '1.05rem', opacity: isReadOnly ? 0.7 : 1 }} placeholder="Escreva a sinopse que vai atrair seus leitores..."></textarea>
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

          {/* Marcação de Coautor */}
          <div style={formFieldStyle}>
            <label style={{ color: 'var(--text-muted)' }}>ID do Coautor (Opcional)</label>
            <input 
              type="text" 
              name="coAuthorId" 
              value={formData.coAuthorId} 
              onChange={handleChange} 
              disabled={isReadOnly} 
              className="form-input" 
              placeholder="Ex: 83920147" 
              style={{ padding: '0.6rem', opacity: isReadOnly ? 0.7 : 1 }} 
            />
            <small style={{ color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block', lineHeight: '1.4' }}>
              Ao colocar o ID de outro autor ativo, a obra ficará visível em seu painel como um espelho de edição (o que um alterar altera no outro).
            </small>
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

        <div style={{ width: '350px', paddingBottom: '3rem' }}>
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
      </div>
      {showRequestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '12px', width: '500px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', marginTop: 0 }}>Pedido de Alteração</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>O livro já foi publicado. A criação de novos capítulos e personagens passará por avaliação.</p>
            
            <div style={formFieldStyle}>
              <label>O que você quer editar/adicionar?</label>
              <input type="text" value={requestData.what} onChange={(e) => setRequestData({...requestData, what: e.target.value})} className="form-input" placeholder="Ex: Adicionar um novo personagem..." />
            </div>
            
            <div style={formFieldStyle}>
              <label>Por que deseja realizar essa alteração?</label>
              <textarea value={requestData.why} onChange={(e) => setRequestData({...requestData, why: e.target.value})} className="form-input" rows="3"></textarea>
            </div>
            
            <div style={formFieldStyle}>
              <label>Qual o impacto na obra já publicada?</label>
              <textarea value={requestData.impact} onChange={(e) => setRequestData({...requestData, impact: e.target.value})} className="form-input" rows="3"></textarea>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setShowRequestModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSendRequest} style={{ background: '#2196F3' }}>Enviar Pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
