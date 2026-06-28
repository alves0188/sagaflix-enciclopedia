import { useState } from 'react';
import { BookOpen, User, Upload, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase, uploadImage } from '../lib/supabaseClient';
import { sendEmail } from '../lib/emailjs';
import TermsModal from './TermsModal';
import { GENRES_LIST as ALL_GENRES } from '../lib/genres';
import toast from 'react-hot-toast';

export default function Register({ onNavigateLogin, onRegisterSuccess, portalRole }) {
  const [role, setRole] = useState(portalRole === 'author' ? 'author' : 'reader');
  const [isRegistered, setIsRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    displayMode: 'nickname',
    email: '',
    password: '',
    age: '',
    tastes: [],
    avatar: '',
    phone: '',
    about: '',
    bookTitle: '',
    sampleText: '',
    synopsis: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  const totalSteps = role === 'author' ? 4 : 3;

  const canGoNext = () => {
    if (step === 1) {
      return formData.email && formData.password && formData.password === confirmPassword;
    }
    if (step === 2) {
      if (role === 'author') return formData.name && formData.nickname && formData.age && formData.phone;
      return formData.name && formData.nickname && formData.age;
    }
    if (step === 3 && role === 'author') {
      return formData.tastes.length > 0;
    }
    return true;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const fieldName = e.target.name;
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 4MB.');
      e.target.value = null;
      return;
    }
    
    try {
      const url = await uploadImage(file);
      if (url) {
        setFormData({ ...formData, [fieldName]: url });
        toast.success('Arquivo enviado com sucesso!');
      }
    } catch (err) {
      console.error('Erro no upload do arquivo', err);
      toast.error(err.message || 'Erro ao enviar o arquivo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < totalSteps) return;
    
    setError('');
    setIsLoading(true);
    const toastId = toast.loading('Criando sua conta...');
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });
      
      if (authError) {
        toast.error('Erro ao criar conta: ' + authError.message, { id: toastId });
        setIsLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: formData.email,
        role: portalRole,
        name: formData.name,
        nickname: formData.nickname,
        bio: formData.about || '',
        writing_style: formData.writingStyle || '',
        avatar_url: formData.avatar || ''
      });

      if (profileError) {
        toast.error('Conta criada, mas erro ao salvar perfil.', { id: toastId });
        setIsLoading(false);
        return;
      }
      
      toast.success('Conta criada com sucesso!', { id: toastId });
      setIsRegistered(true);
    } catch (err) {
      toast.error('Erro ao conectar com o servidor.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: 'var(--bg-main)', padding: '2rem' }}>
        <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '12px', border: '1px solid var(--accent-gold)', width: '100%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', border: '2px solid var(--accent-gold)' }}>
            <CheckCircle size={40} color="var(--accent-gold)" />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0, fontSize: '2rem' }}>
            {role === 'author' ? 'Solicitação Enviada!' : 'Cadastro Concluído!'}
          </h2>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.6', margin: 0 }}>
            {role === 'author' 
              ? 'Sua solicitação de autor foi enviada. Enviamos um e-mail de confirmação para o endereço cadastrado. Por favor, verifique sua caixa de entrada e clique no link de ativação antes de realizar o login.'
              : 'Enviamos um e-mail de confirmação para você. Por favor, verifique seu e-mail e ative sua conta para liberar seu acesso.'}
          </p>
          <button 
            onClick={onNavigateLogin} 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
          >
            IR PARA O LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', width: '100vw', background: 'var(--bg-main)', padding: '2rem' }}>
      <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <button onClick={onNavigateLogin} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Voltar para o Login
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BookOpen size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0 }}>Nova Conta</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{role === 'author' ? 'Autor Parceiro' : 'Leitor'}</p>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', top: '50%', left: 0, width: `${((step - 1) / (totalSteps - 1)) * 100}%`, height: '2px', background: 'var(--accent-gold)', zIndex: 0, transition: 'width 0.3s ease' }}></div>
            
            {Array.from({length: totalSteps}).map((_, i) => (
                <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: step >= i + 1 ? 'var(--accent-gold)' : 'var(--bg-main)', border: `2px solid ${step >= i + 1 ? 'var(--accent-gold)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, color: step >= i + 1 ? '#000' : 'var(--text-muted)', fontWeight: 'bold', transition: 'all 0.3s ease' }}>
                    {i + 1}
                </div>
            ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* STEP 1: CONTA */}
          {step === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>1. Dados da Conta</h3>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>E-mail</label>
                <input name="email" value={formData.email} onChange={handleChange} type="email" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Senha</label>
                    <div style={{ position: 'relative' }}>
                    <input name="password" value={formData.password} onChange={handleChange} type={showPassword ? 'text' : 'password'} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem 2.5rem 0.8rem 0.8rem', borderRadius: '4px' }} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Confirmar Senha</label>
                    <div style={{ position: 'relative' }}>
                    <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type={showConfirmPassword ? 'text' : 'password'} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem 2.5rem 0.8rem 0.8rem', borderRadius: '4px' }} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PERFIL */}
          {step === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>2. Perfil Pessoal</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome Completo {role === 'author' && '(Para Curadoria)'}</label>
                  <input name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Seu nome real" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pseudônimo / Apelido (Único)</label>
                  <input name="nickname" value={formData.nickname} onChange={handleChange} type="text" placeholder="Ex: Machado de Assis" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Idade</label>
                  <input name="age" value={formData.age} onChange={handleChange} type="number" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
                </div>
                {role === 'author' && (
                    <div style={{ flex: 2 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Telefone / WhatsApp</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} type="text" placeholder="(DD) 99999-9999" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
                    </div>
                )}
              </div>

              {role === 'author' && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Como você deseja ser visto pelos Leitores?</label>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input type="radio" name="displayMode" value="nickname" checked={formData.displayMode === 'nickname'} onChange={handleChange} style={{ accentColor: 'var(--accent-gold)' }} />
                      Meu Pseudônimo
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input type="radio" name="displayMode" value="name" checked={formData.displayMode === 'name'} onChange={handleChange} style={{ accentColor: 'var(--accent-gold)' }} />
                      Meu Nome Real
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PREFERENCIAS E AVATAR */}
          {step === 3 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <h3 style={{ color: 'var(--text-main)', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>3. Preferências e Avatar</h3>
               <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Foto de Perfil (Opcional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--accent-gold)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={32} color="var(--text-muted)" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                      <label htmlFor="avatar-upload" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', background: 'rgba(226, 192, 68, 0.1)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                          Escolher Imagem
                      </label>
                      <input id="avatar-upload" type="file" name="avatar" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quais seus gostos literários principais?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {ALL_GENRES.map(genre => (
                    <label key={genre} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <input type="checkbox" checked={formData.tastes.includes(genre)} onChange={(e) => {
                          if (e.target.checked) setFormData({ ...formData, tastes: [...formData.tastes, genre] });
                          else setFormData({ ...formData, tastes: formData.tastes.filter(g => g !== genre) });
                        }} style={{ accentColor: 'var(--accent-gold)' }} />
                      {genre}
                    </label>
                  ))}
                </div>
              </div>

              {role === 'reader' && (
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '1rem', background: 'rgba(226, 192, 68, 0.05)', border: '1px solid rgba(226, 192, 68, 0.2)', borderRadius: '8px' }}>
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ accentColor: 'var(--accent-gold)', marginTop: '0.2rem', cursor: 'pointer', transform: 'scale(1.2)' }} />
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    Eu declaro que li e concordo com os <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>Termos de Uso e Política de Privacidade</button> da plataforma Sagaflix.
                    </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: AUTOR / OBRA */}
          {step === 4 && role === 'author' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>4. Material de Curadoria</h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sobre o Autor</label>
                <textarea name="about" value={formData.about} onChange={handleChange} rows={3} placeholder="Conte aos leitores sobre você..." style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
              </div>

              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--border-color)', borderRadius: '4px' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome da Obra</label>
                  <input name="bookTitle" value={formData.bookTitle} onChange={handleChange} type="text" placeholder="Ex: O Jardim das Flores" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sinopse da Obra</label>
                  <textarea name="synopsis" value={formData.synopsis} onChange={handleChange} rows={2} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px' }} required />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Amostra de Texto (Primeiro Capítulo)</label>
                  <label htmlFor="sample-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', border: '1px dashed var(--accent-gold)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(226, 192, 68, 0.05)', transition: 'background 0.2s' }}>
                      <Upload size={24} color="var(--accent-gold)" />
                      <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{formData.sampleText ? 'Arquivo Selecionado!' : 'Clique para selecionar o PDF/DOC'}</span>
                  </label>
                  <input id="sample-upload" type="file" name="sampleText" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '1rem', background: 'rgba(226, 192, 68, 0.05)', border: '1px solid rgba(226, 192, 68, 0.2)', borderRadius: '8px' }}>
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ accentColor: 'var(--accent-gold)', marginTop: '0.2rem', cursor: 'pointer', transform: 'scale(1.2)' }} />
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  Eu declaro que li e concordo com os <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>Termos de Uso e Política de Privacidade</button> da plataforma Sagaflix.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {step > 1 && (
                <button type="button" onClick={prevStep} style={{ flex: 1, padding: '1rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Voltar
                </button>
            )}
            
            {step < totalSteps ? (
                <button type="button" onClick={nextStep} disabled={!canGoNext()} style={{ flex: 2, padding: '1rem', background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '4px', cursor: canGoNext() ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: canGoNext() ? 1 : 0.5 }}>
                    Próximo Passo
                </button>
            ) : (
                <button type="submit" disabled={isLoading || !termsAccepted} style={{ flex: 2, padding: '1rem', background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '4px', cursor: (isLoading || !termsAccepted) ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: (isLoading || !termsAccepted) ? 0.5 : 1 }}>
                    {isLoading ? 'ENVIANDO...' : (role === 'author' ? 'ENVIAR PARA APROVAÇÃO' : 'CRIAR CONTA')}
                </button>
            )}
          </div>
        </form>

      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} role={role} />
      <style>{`
        .animate-fade-in {
            animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
