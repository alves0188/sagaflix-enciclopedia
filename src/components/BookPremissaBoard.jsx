import { useState } from 'react';

export default function BookPremissaBoard({ book, onUpdateBook }) {
  const [formData, setFormData] = useState({
    premise: book.premise || '',
    synopsis: book.synopsis || ''
  });

  const handleChange = (e) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newFormData);
    onUpdateBook({ ...book, ...newFormData });
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0, fontSize: '15pt' }}>
        Resumo da Obra
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ color: 'var(--text-muted)', margin: 0 }}>Premissa / Argumento (Logline)</label>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontStyle: 'italic' }}>* Sua bússola</span>
        </div>
        <textarea 
          name="premise" 
          value={formData.premise} 
          onChange={handleChange} 
          className="form-input" 
          rows="4" 
          style={{ lineHeight: '1.6', fontSize: '1.05rem', border: '1px solid rgba(212, 175, 55, 0.5)' }} 
          placeholder="Ex: Um detetive insone precisa resolver o assassinato..."
        ></textarea>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ color: 'var(--text-muted)' }}>Sinopse Oficial</label>
        <textarea 
          name="synopsis" 
          value={formData.synopsis} 
          onChange={handleChange} 
          className="form-input" 
          rows="12" 
          style={{ lineHeight: '1.6', fontSize: '1.05rem', flex: 1 }} 
          placeholder="Escreva a sinopse que vai atrair seus leitores..."
        ></textarea>
      </div>
    </div>
  );
}
