import fs from 'fs';

// 1. Refatorar Login.jsx
let loginCode = fs.readFileSync('src/components/Login.jsx', 'utf8');
const oldLoginSubmit = /const handleSubmit = async \(e\) => \{[\s\S]*?\} catch \(err\) \{/;
const newLoginSubmit = `const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email, password
      });
      if (authError) {
        setError('E-mail ou senha incorretos.');
        return;
      }
      // O onAuthStateChange no App.jsx vai assumir daqui!
    } catch (err) {`;
loginCode = loginCode.replace(oldLoginSubmit, newLoginSubmit);
fs.writeFileSync('src/components/Login.jsx', loginCode);

// 2. Refatorar Register.jsx
let registerCode = fs.readFileSync('src/components/Register.jsx', 'utf8');
const oldRegisterSubmit = /const handleSubmit = async \(e\) => \{[\s\S]*?\} catch \(err\) \{/;
const newRegisterSubmit = `const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });
      
      if (authError) {
        setError('Erro ao criar conta: ' + authError.message);
        setLoading(false);
        return;
      }

      // Cria o profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: formData.email,
        role: portalRole,
        name: formData.name,
        nickname: formData.pseudonym || formData.name,
        bio: formData.about || '',
        writing_style: formData.writingStyle || '',
        avatar_url: formData.avatar || ''
      });

      if (profileError) {
        setError('Conta criada, mas erro ao salvar perfil.');
        setLoading(false);
        return;
      }

      // O onAuthStateChange no App.jsx vai detectar e logar!
    } catch (err) {`;
registerCode = registerCode.replace(oldRegisterSubmit, newRegisterSubmit);
fs.writeFileSync('src/components/Register.jsx', registerCode);
console.log('✅ Login e Register atualizados.');
