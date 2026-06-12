import { useState, useEffect } from 'react';
import { CheckCircle, BookOpen, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function EmailConfirmationView({ token, onConfirm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null); // null = checking, true = valid, false = invalid
  const [db, setDb] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const { data: result, error: fetchError } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
        if (fetchError) throw fetchError;
        const data = result.data;
        setDb(data);

        // Verifica se existe algum usuário pendente com esse token
        const user = data.users.find(u => u.verificationToken === token && u.status === 'pending_email');
        if (user) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
        }
      } catch (err) {
        console.error("Erro ao validar token:", err);
        setIsTokenValid(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const userIndex = db.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.verificationToken === token && u.status === 'pending_email');
      
      if (userIndex !== -1) {
        const user = db.users[userIndex];
        // Atualiza status
        db.users[userIndex].status = 'active';
        db.users[userIndex].verificationToken = null; // Limpa o token

        await supabase.from('sagaflix_db').update({ data: db }).eq('id', 1);

        alert('E-mail confirmado com sucesso! Seja bem-vindo(a) à Sagaflix.');
        onConfirm(user, db); // Faz login automático
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao se comunicar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Validando link de segurança...</p>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
        <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ color: '#f44336', margin: '0 0 1rem 0' }}>Link Inválido ou Expirado</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>O link de confirmação que você tentou acessar não é mais válido ou o e-mail já foi confirmado.</p>
          <a href="/" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Voltar para a Home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)', padding: '2rem' }}>
      <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <CheckCircle size={56} color="#4CAF50" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', margin: 0, fontSize: '1.8rem' }}>E-mail Verificado!</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.5' }}>
            Estamos muito felizes em ter você conosco. A equipe da Sagaflix deseja-lhe boas-vindas!
          </p>
          <p style={{ color: 'var(--accent-gold)', marginTop: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Para ativar sua conta e finalizar, confirme sua senha abaixo:
          </p>
        </div>

        {error && <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff7777', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>E-mail cadastrado</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} 
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem 2.5rem 0.8rem 0.8rem', borderRadius: '4px' }} 
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={isLoading}>
            {isLoading ? 'ATIVANDO...' : (
              <>ATIVAR CONTA E ENTRAR <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
