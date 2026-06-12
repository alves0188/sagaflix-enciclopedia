import { useState } from 'react';
import { X, Upload, Save } from 'lucide-react';
import { uploadImage } from '../lib/supabaseClient';

export default function NewBookModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    cover: ''
  });
  const [uploading, setUploading] = useState(false);

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

  const generateSKU = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sku = 'LIV-';
    for (let i = 0; i < 8; i++) {
      sku += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sku;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert("O título é obrigatório");
      return;
    }
    const finalData = {
      ...formData,
      sku: generateSKU()
    };
    onSave(finalData);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '2rem'
    }}>
      <div style={{
        background: 'var(--card-bg)', width: '100%', maxWidth: '600px',
        borderRadius: '12px', border: '1px solid var(--accent-gold)', overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0 }}>Nova História</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Título da Obra *</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px', fontSize: '1.1rem' }} 
              placeholder="Ex: As Crônicas de Gelo e Fogo"
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Sinopse</label>
            <textarea 
              name="synopsis" 
              value={formData.synopsis} 
              onChange={handleChange} 
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px', height: '120px', resize: 'vertical' }} 
              placeholder="Um breve resumo da história..."
            ></textarea>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Capa da História</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {formData.cover ? (
                <img src={formData.cover} alt="Preview" style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
              ) : (
                <div style={{ width: '80px', height: '120px', background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--text-muted)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sem Capa</span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}>
                  {uploading ? 'Enviando...' : <><Upload size={16} /> Fazer Upload</>}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={18} /> Criar Rascunho</button>
          </div>
        </form>
      </div>
    </div>
  );
}
