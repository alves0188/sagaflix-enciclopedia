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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/leitor'
        }
      });
      if (error) setError('Erro ao entrar com Google: ' + error.message);
    } catch (err) {
      setError('Erro de conexão ao autenticar com o Google.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin + '/leitor'
        }
      });
      if (error) setError('Erro ao entrar com Apple: ' + error.message);
    } catch (err) {
      setError('Erro de conexão ao autenticar com a Apple.');
    }
  };

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
      const { data: user, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', forgotEmail)
        .single();
        
      if (user) {
        const token = Math.random().toString(36).substring(2, 15);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ reset_token: token })
          .eq('id', user.id);
          
        if (updateError) throw updateError;

        const resetLink = `${window.location.origin}/recuperar-senha?token=${token}`;
        
        const subject = 'Recuperação de Senha - Sagaflix';
        const message = `Olá ${user.name || user.nickname || 'Leitor'},\n\nVocê solicitou a recuperação da sua senha na Sagaflix. Clique no link abaixo para criar uma nova senha:\n\n${resetLink}\n\nSe você não solicitou isso, pode ignorar este e-mail.\n\nEquipe Sagaflix`;
        
        await sendEmail(user.email, subject, message);
      }

      setForgotMessage('Se o e-mail fornecido estiver em nossos registros, enviaremos um link de recuperação de senha.');
      setForgotEmail('');
    } catch (err) {
      console.error(err);
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
          
          {(!portalRole || (portalRole !== 'curator' && portalRole !== 'author')) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                <span style={{ padding: '0 1rem' }}>OU ENTRAR COM</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <button 
                  type="button" 
                  onClick={handleGoogleLogin} 
                  style={{ 
                    width: '100%', 
                    padding: '0.8rem', 
                    borderRadius: '4px', 
                    border: '1px solid var(--border-color)', 
                    background: 'rgba(255,255,255,0.02)', 
                    color: 'var(--text-main)', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.6rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                
                <button 
                  type="button" 
                  onClick={handleAppleLogin} 
                  style={{ 
                    width: '100%', 
                    padding: '0.8rem', 
                    borderRadius: '4px', 
                    border: '1px solid var(--border-color)', 
                    background: 'rgba(255,255,255,0.02)', 
                    color: 'var(--text-main)', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.6rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.1.08.2.12.3.12.87 0 1.96-.54 2.52-1.45z"/>
                  </svg>
                  Apple
                </button>
              </div>
            </>
          )}
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
