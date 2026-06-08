import { useState } from 'react';
import { BookOpen } from 'lucide-react';

export default function Login({ onLogin, onNavigateRegister, portalRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const portalName = portalRole === 'curator' ? 'Curadoria Sagaflix' : portalRole === 'author' ? 'Sagaflix Estúdio' : 'Sagaflix';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(window.API_BASE_URL + '/api/data');
      const data = await res.json();
      
      const user = data.users.find(u => u.email === email && u.password === password);
      
      if (user) {
        if (user.role !== portalRole) {
          setError(`Esta conta não tem permissão de ${portalRole}. Verifique a URL.`);
          return;
        }

        if (user.role === 'author' && user.status !== 'approved') {
          setError('Sua conta de autor ainda está sob análise da curadoria.');
          return;
        }
        onLogin(user, data);
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
      <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BookOpen size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0 }}>{portalName}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Acesso restrito</p>
        </div>

        {error && <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff7777', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>E-mail</label>
            <input 
              type="text" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} 
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} 
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '1rem' }}>ENTRAR</button>
        </form>

        {portalRole !== 'curator' && (
          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Ainda não tem conta? <button onClick={onNavigateRegister} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 'bold' }}>Cadastre-se</button>
          </div>
        )}
      </div>
    </div>
  );
}
