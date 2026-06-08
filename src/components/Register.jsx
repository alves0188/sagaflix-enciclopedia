import { useState } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function Register({ onNavigateLogin, onRegisterSuccess, portalRole }) {
  const [role, setRole] = useState(portalRole === 'author' ? 'author' : 'reader');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    tastes: [],
    avatar: '', // Novo campo para foto
    // Author specific:
    phone: '',
    about: '',
    bookTitle: '',
    sampleText: '',
    synopsis: ''
  });

  const ALL_GENRES = [
    'Fantasia', 'Ficção Científica', 'Romance', 'Terror', 
    'Suspense', 'Mistério', 'Aventura', 'Jovem Adulto', 
    'Distopia', 'Alta Fantasia', 'Realismo Mágico', 'Drama'
  ];
  
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const fieldName = e.target.name; // 'sampleText' ou 'avatar'
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 4MB.');
      e.target.value = null; // Clear input
      return;
    }
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    try {
      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await res.json();
      setFormData({ ...formData, [fieldName]: data.url }); // Salva a URL no campo certo
    } catch (err) {
      console.error('Erro no upload do arquivo', err);
      alert('Erro ao enviar o arquivo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/data');
      const db = await res.json();
      
      if (db.users.find(u => u.email === formData.email)) {
        setError('Este e-mail já está em uso.');
        return;
      }

      const existingUserIds = db.users.map(u => u.id.toString());
      let newId;
      do {
        newId = Math.floor(10000000 + Math.random() * 90000000).toString();
      } while (existingUserIds.includes(newId));

      const newUser = {
        id: newId,
        role: role,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: formData.age,
        tastes: formData.tastes,
        about: formData.about, // Bio do autor
        avatar: formData.avatar, // Foto de perfil
        status: role === 'author' ? 'pending' : 'approved'
      };

      db.users.push(newUser);

      if (role === 'author') {
        db.authorRequests.push({
          id: 'req_' + Date.now(),
          userId: newUser.id,
          phone: formData.phone,
          bookTitle: formData.bookTitle,
          sampleText: formData.sampleText,
          synopsis: formData.synopsis,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }

      await fetch('http://localhost:3001/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db)
      });

      if (role === 'author') {
        alert('Cadastro enviado! Sua solicitação passará pela curadoria. Aguarde nosso e-mail.');
        onNavigateLogin();
      } else {
        alert('Cadastro realizado com sucesso!');
        onRegisterSuccess(newUser, db);
      }

    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', width: '100vw', background: 'var(--bg-main)', padding: '2rem' }}>
      <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <button onClick={onNavigateLogin} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Voltar para o Login
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BookOpen size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0 }}>Nova Conta</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Junte-se à Sagaflix</p>
        </div>

        {portalRole === 'reader' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              type="button"
              style={{ flex: 1, padding: '1rem', background: 'var(--accent-gold)', color: '#000', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'default', fontWeight: 'bold' }}
            >
              CADASTRO DE LEITOR
            </button>
          </div>
        )}

        {portalRole === 'author' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              type="button"
              style={{ flex: 1, padding: '1rem', background: 'var(--accent-gold)', color: '#000', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'default', fontWeight: 'bold' }}
            >
              SOLICITAÇÃO DE AUTOR
            </button>
          </div>
        )}

        {error && <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff7777', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Foto de Perfil (Opcional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-main)', border: '1px solid var(--accent-gold)', overflow: 'hidden' }}>
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem foto</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                name="avatar"
                accept="image/*"
                onChange={handleFileChange} 
                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px', cursor: 'pointer' }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome Completo</label>
            <input name="name" value={formData.name} onChange={handleChange} type="text" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>E-mail</label>
              <input name="email" value={formData.email} onChange={handleChange} type="email" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Idade</label>
              <input name="age" value={formData.age} onChange={handleChange} type="number" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
            </div>
          </div>

          {role === 'author' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Telefone / WhatsApp</label>
              <input name="phone" value={formData.phone} onChange={handleChange} type="text" placeholder="(DD) 99999-9999" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Senha</label>
            <input name="password" value={formData.password} onChange={handleChange} type="password" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quais seus gostos literários principais?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              {ALL_GENRES.map(genre => (
                <label key={genre} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.tastes.includes(genre)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, tastes: [...formData.tastes, genre] });
                      } else {
                        setFormData({ ...formData, tastes: formData.tastes.filter(g => g !== genre) });
                      }
                    }}
                    style={{ accentColor: 'var(--accent-gold)' }}
                  />
                  {genre}
                </label>
              ))}
            </div>
          </div>

          {role === 'author' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sobre o Autor</label>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Conte aos leitores sobre você, seu estilo de escrita e o que o inspira. Isso aparecerá no seu perfil de autor publicamente.</p>
              <textarea name="about" value={formData.about} onChange={handleChange} rows={4} placeholder="Sou um escritor apaixonado por construir mundos épicos..." style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
            </div>
          )}

          {role === 'author' && (
            <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--border-color)', borderRadius: '4px', marginTop: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-gold)', fontSize: '1rem' }}>Material para Curadoria</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                A Plataforma Sagaflix é um ambiente curado para garantir obras de qualidade aos nossos leitores.
                Precisamos de uma pequena amostra do seu trabalho para entender seu nível técnico, narrativa e potencial. 
                Envie o arquivo do seu livro atual para nossa avaliação.
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome da Obra</label>
                <input name="bookTitle" value={formData.bookTitle} onChange={handleChange} type="text" placeholder="Ex: O Jardim das Flores" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sinopse da Obra</label>
                <textarea name="synopsis" value={formData.synopsis} onChange={handleChange} rows={3} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Amostra de Texto (Primeiro Capítulo)</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                  A nossa equipe de curadores avaliará rigorosamente a qualidade, fluidez e coerência do seu texto. 
                  Por favor, anexe o <strong>primeiro capítulo</strong> da sua obra em formato PDF ou DOC. 
                  Certifique-se de que o material representa a versão final e revisada da sua história.
                </p>
                <input 
                  type="file" 
                  name="sampleText"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px', cursor: 'pointer' }} 
                  required 
                />
                {formData.sampleText && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                    Arquivo anexado com sucesso!
                  </div>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '1rem' }}>
            {role === 'author' ? 'ENVIAR PARA APROVAÇÃO' : 'CRIAR CONTA'}
          </button>
        </form>

      </div>
    </div>
  );
}
