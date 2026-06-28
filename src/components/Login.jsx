import { useState } from 'react';
import { BookOpen, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { sendEmail } from '../lib/emailjs';

export default function Login({ onLogin, onNavigateRegister, portalRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const portalName = portalRole === 'curator' ? 'Curadoria Sagaflix' : portalRole === 'author' ? 'Sagaflix Estúdio' : 'Sagaflix';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email, password
      });
      if (authError) {
        if (authError.message === 'Email not confirmed' || authError.message.toLowerCase().includes('confirm')) {
          setError('E-mail não confirmado. Por favor, verifique sua caixa de entrada para confirmar seu cadastro.');
        } else {
          setError('E-mail ou senha incorretos.');
        }
        return;
      }
      // Buscar perfil do usuario e chamar onLogin
      const userId = data.user.id;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profile) {
        const userObj = {
          id: profile.id, role: profile.role, name: profile.name, nickname: profile.nickname,
          email: profile.email, avatar: profile.avatar_url,
          favorites: profile.favorites, readingStatus: profile.reading_status,
          completedTutorials: profile.completed_tutorials || []
        };
        onLogin(userObj);
      } else {
        // Fallback: usar dados do sagaflix_db
        const { data: dbData } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
        if (dbData && dbData.data && dbData.data.users) {
          const fallbackUser = dbData.data.users.find(u => u.email === email);
          if (fallbackUser) {
            onLogin(fallbackUser);
            return;
          }
        }
        // Ultimo recurso: criar usuario basico com dados do auth
        onLogin({ id: userId, email: data.user.email, name: data.user.user_metadata?.name || email.split('@')[0], role: 'author' });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro ao conectar com o servidor: ' + (err.message || 'Erro desconhecido.'));
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    setForgotError('');
    try {
      const { data: dbData, error: dbError } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
      if (dbError) throw dbError;
      
      let db = dbData.data;
      let user = db.users?.find(u => u.email === forgotEmail);
      
      if (user) {
        const token = Math.random().toString(36).substring(2, 15);
        user.resetToken = token;
        
        const { error: updateError } = await supabase.from('sagaflix_db').update({ data: db }).eq('id', 1);
        if (updateError) throw updateError;

        const resetLink = `${window.location.origin}/recuperar-senha?token=${token}`;
        
        const subject = 'Recuperação de Senha - Sagaflix';
        const message = `Olá ${user.name},\n\nVocê solicitou a recuperação da sua senha na Sagaflix. Clique no link abaixo para criar uma nova senha:\n\n${resetLink}\n\nSe você não solicitou isso, pode ignorar este e-mail.\n\nEquipe Sagaflix`;
        
        await sendEmail(user.email, subject, message);
      }

      setForgotMessage('Se o e-mail fornecido estiver em nossos registros, enviaremos um link de recuperação de senha.');
      setForgotEmail('');
    } catch (err) {
      setForgotError('Erro ao se conectar com o servidor.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
        <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          
          <button onClick={() => { setShowForgotPassword(false); setForgotError(''); setForgotMessage(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: 0 }}>
            <ArrowLeft size={16} /> Voltar ao Login
          </button>

          <div style={{ text_align: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <BookOpen size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0, fontSize: '1.8rem', textAlign: 'center' }}>Recuperar Senha</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem', textAlign: 'center' }}>Enviaremos as instruções por e-mail</p>
          </div>

          {forgotError && <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff7777', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{forgotError}</div>}
          {forgotMessage && <div style={{ background: 'rgba(0,255,0,0.05)', color: 'var(--accent-gold)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', border: '1px solid rgba(212,175,55,0.2)' }}>{forgotMessage}</div>}

          <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>E-mail cadastrado</label>
              <input 
                type="email" 
                value={forgotEmail} 
                onChange={e => setForgotEmail(e.target.value)} 
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} 
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '1rem' }} disabled={forgotLoading}>
              {forgotLoading ? 'ENVIANDO...' : 'ENVIAR LINK'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Senha</label>
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
              >
                Esqueci a senha
              </button>
            </div>
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
