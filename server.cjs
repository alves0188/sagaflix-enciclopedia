const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');


const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://guecsoghyqvssdvednnv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';

function getSupabaseClient(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}


const app = express();
const PORT = process.env.PORT || 3001;
const dataFile = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase body size if needed

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Helper sendEmail with console log fallback
const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '"Sagaflix" <noreply@sagaflix.com>',
    to,
    subject,
    text,
    html
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n==================================================');
    console.log('[E-MAIL EMULADO (SMTP NÃO CONFIGURADO)]');
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Mensagem:\n${text}`);
    console.log('==================================================\n');
    return { success: true, logged: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`E-mail enviado com sucesso: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Get all data
app.get('/api/data', (req, res) => {
  try {
    const rawData = fs.readFileSync(dataFile);
    const data = JSON.parse(rawData);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// Update data
app.post('/api/data', (req, res) => {
  try {
    const newData = req.body;
    fs.writeFileSync(dataFile, JSON.stringify(newData, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write data' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Send verification email endpoint
app.post('/api/send-verification-email', async (req, res) => {
  const { email, token, name } = req.body;
  try {
    const origin = req.headers.origin || 'https://sagaflix-enciclopedia.vercel.app';
    const verificationLink = `${origin}/verificar-email?token=${token}`;
    
    const text = `Olá, ${name}.\n\nSeja bem-vindo ao Sagaflix!\n\nPor favor, confirme seu e-mail clicando no link abaixo (ou colando no seu navegador) para ativar sua conta:\n\n${verificationLink}\n\nSe você não se cadastrou na nossa plataforma, por favor ignore este e-mail.`;
    const html = `<p>Olá, <strong>${name}</strong>.</p>
                  <p>Seja bem-vindo ao <strong>Sagaflix</strong>!</p>
                  <p>Por favor, confirme seu e-mail clicando no link abaixo para ativar sua conta:</p>
                  <p><a href="${verificationLink}" style="background-color: #d4af37; color: black; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Confirmar E-mail</a></p>
                  <p>Ou copie e cole o link abaixo no seu navegador:</p>
                  <p>${verificationLink}</p>
                  <p>Se você não se cadastrou na nossa plataforma, por favor ignore este e-mail.</p>`;
    
    await sendEmail(email, 'Confirmação de E-mail - Sagaflix', text, html);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar e-mail de verificação' });
  }
});

// Verify email endpoint
app.post('/api/verify-email', (req, res) => {
  const { token } = req.body;
  try {
    const rawData = fs.readFileSync(dataFile);
    const data = JSON.parse(rawData);
    
    const userIndex = data.users.findIndex(u => u.verificationToken === token);
    if (userIndex === -1) {
      return res.status(400).json({ error: 'Token de confirmação inválido ou expirado.' });
    }
    
    const user = data.users[userIndex];
    
    // Se for leitor, já ativa e aprova. Se for autor, coloca como 'pending' (para curadoria aprovar)
    if (user.role === 'author') {
      user.status = 'pending';
    } else {
      user.status = 'approved';
    }
    
    delete user.verificationToken;
    
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    res.json({ success: true, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao verificar e-mail' });
  }
});

// Forgot password endpoint
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const rawData = fs.readFileSync(dataFile);
    const data = JSON.parse(rawData);
    
    const userIndex = data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) {
      return res.json({ success: true, message: 'Se o e-mail estiver cadastrado, enviamos o link de recuperação.' });
    }
    
    const user = data.users[userIndex];
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetExpires = Date.now() + 3600000; // 1 hora
    
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    
    const origin = req.headers.origin || 'https://sagaflix-enciclopedia.vercel.app';
    const resetLink = `${origin}/recuperar-senha?token=${token}`;
    
    const text = `Olá, ${user.name}.\n\nVocê solicitou a recuperação de senha para sua conta no Sagaflix.\n\nClique no link abaixo (ou cole no seu navegador) para redefinir sua senha:\n\n${resetLink}\n\nEste link expira em 1 hora.\n\nSe você não solicitou isso, por favor desconsidere este e-mail.`;
    const html = `<p>Olá, <strong>${user.name}</strong>.</p>
                  <p>Você solicitou a recuperação de senha para sua conta no <strong>Sagaflix</strong>.</p>
                  <p>Clique no link abaixo para redefinir sua senha:</p>
                  <p><a href="${resetLink}" style="background-color: #d4af37; color: black; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Redefinir Senha</a></p>
                  <p>Ou copie e cole o link abaixo no seu navegador:</p>
                  <p>${resetLink}</p>
                  <p>Este link expira em 1 hora.</p>
                  <p>Se você não solicitou isso, por favor desconsidere este e-mail.</p>`;
    
    await sendEmail(user.email, 'Recuperação de Senha - Sagaflix', text, html);
    
    res.json({ success: true, message: 'Se o e-mail estiver cadastrado, enviamos o link de recuperação.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar recuperação de senha' });
  }
});

// Reset password endpoint
app.post('/api/reset-password', (req, res) => {
  const { token, password } = req.body;
  try {
    const rawData = fs.readFileSync(dataFile);
    const data = JSON.parse(rawData);
    
    const userIndex = data.users.findIndex(u => u.resetToken === token && u.resetExpires > Date.now());
    if (userIndex === -1) {
      return res.status(400).json({ error: 'Token de recuperação inválido ou expirado.' });
    }
    
    const user = data.users[userIndex];
    user.password = password;
    delete user.resetToken;
    delete user.resetExpires;
    
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao redefinir a senha' });
  }
});

// 1. Get user tastes
app.get('/api/profile/tastes', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    const { data, error } = await supabaseClient
      .from('user_tastes')
      .select('genre')
      .eq('user_id', user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ tastes: data.map(t => t.genre) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Update user tastes
app.post('/api/profile/tastes', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  
  const { tastes } = req.body;
  if (!tastes || !Array.isArray(tastes)) {
    return res.status(400).json({ error: 'Tastes must be an array of genres' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    // Clear existing user tastes to avoid duplicates
    const { error: deleteError } = await supabaseClient
      .from('user_tastes')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    // Insert new tastes
    if (tastes.length > 0) {
      const payloads = tastes.map(genre => ({
        user_id: user.id,
        genre: genre
      }));

      const { error: insertError } = await supabaseClient
        .from('user_tastes')
        .insert(payloads);

      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }
    }

    res.json({ success: true, tastes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize admin client if service role is available
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

// 3. Get Wallet Balance (T011)
app.get('/api/wallet/balance', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    const { data, error } = await supabaseClient
      .from('wallets')
      .select('balance, subscription_status, subscription_expires_at')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Donate Credits (T012)
app.post('/api/wallet/donate', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database admin role not configured on server' });
  }

  const { author_id, amount, description } = req.body;
  if (!author_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid donation details' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    if (user.id === author_id) {
      return res.status(400).json({ error: 'Cannot donate to yourself' });
    }

    // Check sender balance
    const { data: wallet, error: wErr } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (wErr || !wallet) {
      return res.status(500).json({ error: 'Sender wallet not found' });
    }

    const senderBalance = parseFloat(wallet.balance);
    const donationAmount = parseFloat(amount);

    if (senderBalance < donationAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente para a doação' });
    }

    // Check recipient wallet
    const { data: recWallet, error: recErr } = await supabaseAdmin
      .from('wallets')
      .select('user_id')
      .eq('user_id', author_id)
      .single();

    if (recErr || !recWallet) {
      return res.status(404).json({ error: 'Author wallet not found' });
    }

    // Perform transaction transfers
    const newSenderBalance = senderBalance - donationAmount;
    const { error: updSenderErr } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newSenderBalance })
      .eq('user_id', user.id);

    if (updSenderErr) throw updSenderErr;

    const { error: updRecErr } = await supabaseAdmin
      .from('wallets')
      .update({ balance: supabaseAdmin.rpc('increment_balance', { x: donationAmount, row_id: author_id }) }) // fallback is direct add
      .eq('user_id', author_id);
    
    // Fallback: direct update if RPC is missing
    if (updRecErr) {
      const { data: recData } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', author_id).single();
      const currentRecBalance = parseFloat(recData.balance || 0);
      await supabaseAdmin.from('wallets').update({ balance: currentRecBalance + donationAmount }).eq('user_id', author_id);
    }

    // Log transactions
    await supabaseAdmin.from('transactions').insert([
      {
        user_id: user.id,
        type: 'donation_send',
        amount: donationAmount,
        description: description || 'Doação realizada',
        recipient_id: author_id,
        status: 'completed'
      },
      {
        user_id: author_id,
        type: 'donation_receive',
        amount: donationAmount,
        description: `Doação recebida de ${user.email}`,
        status: 'completed'
      }
    ]);

    res.json({ success: true, new_balance: newSenderBalance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

// 5. Payment Webhook (T010)
app.post('/api/wallet/webhook', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database admin role not configured on server' });
  }

  const { event, user_id, amount, gateway_ref, type } = req.body;
  if (event !== 'payment.succeeded' || !user_id || !amount) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  try {
    const depositAmount = parseFloat(amount);
    
    // Fetch user wallet
    const { data: wallet, error: wErr } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', user_id)
      .single();

    if (wErr || !wallet) {
      return res.status(404).json({ error: 'User wallet not found' });
    }

    const currentBalance = parseFloat(wallet.balance);

    if (type === 'subscription') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days subscription

      await supabaseAdmin
        .from('wallets')
        .update({ 
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('user_id', user_id);
    } else {
      await supabaseAdmin
        .from('wallets')
        .update({ balance: currentBalance + depositAmount })
        .eq('user_id', user_id);
    }

    // Log transaction
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id,
        type: 'deposit',
        amount: depositAmount,
        description: type === 'subscription' ? 'Assinatura Sagaflix R$ 14,90' : 'Depósito de créditos',
        gateway_ref: gateway_ref || `mock_${Date.now()}`,
        status: 'completed'
      });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// 6. Support Tickets (T013)
app.post('/api/support/ticket', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Missing ticket subject or message' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    const { data, error } = await supabaseClient
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        message,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/support/tickets', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    // Determine role (curator/admin bypass RLS or see all tickets)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabaseClient.from('support_tickets').select('*');
    
    // If not curator/admin, filter by user_id (though RLS already does it, we specify it clearly)
    if (profile?.role !== 'curator' && profile?.role !== 'admin') {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. Request Saque/Withdrawal (T016)
app.post('/api/wallet/withdraw', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database admin role not configured on server' });
  }

  const { amount, bank_token } = req.body;
  if (!amount || amount <= 0 || !bank_token) {
    return res.status(400).json({ error: 'Invalid withdrawal details' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    // Verify role is author
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (pErr || profile?.role !== 'author') {
      return res.status(403).json({ error: 'Only authors can request withdrawals' });
    }

    // Get author wallet balance
    const { data: wallet, error: wErr } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (wErr || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const currentBalance = parseFloat(wallet.balance);
    const withdrawAmount = parseFloat(amount);

    if (currentBalance < withdrawAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente para saque' });
    }

    // Create withdrawal request and deduct balance in transaction
    const { error: updErr } = await supabaseAdmin
      .from('wallets')
      .update({ balance: currentBalance - withdrawAmount })
      .eq('user_id', user.id);

    if (updErr) throw updErr;

    // Insert request
    const { data: wr, error: wrErr } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount: withdrawAmount,
        bank_token,
        status: 'pending'
      })
      .select()
      .single();

    if (wrErr) throw wrErr;

    // Log transaction
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: withdrawAmount,
        description: `Saque solicitado para conta/chave ${bank_token}`,
        gateway_ref: `wd_${wr.id}`,
        status: 'pending'
      });

    res.json({ success: true, new_balance: currentBalance - withdrawAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
});

// 8. Approve Withdrawal Request (T017)
app.post('/api/support/withdraw/approve', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database admin role not configured on server' });
  }

  const { request_id } = req.body;
  if (!request_id) {
    return res.status(400).json({ error: 'Missing request_id' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    // Verify moderator role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'curator' && profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized moderator action' });
    }

    // Fetch request
    const { data: wr, error: wrErr } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (wrErr || !wr || wr.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal request not found or not pending' });
    }

    // Update request status
    await supabaseAdmin
      .from('withdrawal_requests')
      .update({ status: 'approved' })
      .eq('id', request_id);

    // Update transaction log
    await supabaseAdmin
      .from('transactions')
      .update({ status: 'completed', description: `Saque aprovado e liquidado via ${wr.bank_token}` })
      .eq('gateway_ref', `wd_${request_id}`);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 9. Reject Withdrawal Request (T017)
app.post('/api/support/withdraw/reject', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database admin role not configured on server' });
  }

  const { request_id, reason } = req.body;
  if (!request_id) {
    return res.status(400).json({ error: 'Missing request_id' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    // Verify moderator role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'curator' && profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized moderator action' });
    }

    // Fetch request
    const { data: wr, error: wrErr } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (wrErr || !wr || wr.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal request not found or not pending' });
    }

    // Reject request status
    await supabaseAdmin
      .from('withdrawal_requests')
      .update({ status: 'rejected' })
      .eq('id', request_id);

    // Refund wallet balance
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', wr.user_id)
      .single();

    const currentBalance = parseFloat(wallet?.balance || 0);
    const refundAmount = parseFloat(wr.amount);

    await supabaseAdmin
      .from('wallets')
      .update({ balance: currentBalance + refundAmount })
      .eq('user_id', wr.user_id);

    // Update transaction log
    await supabaseAdmin
      .from('transactions')
      .update({ 
        status: 'failed', 
        description: `Saque rejeitado. Motivo: ${reason || 'Dados incorretos'}` 
      })
      .eq('gateway_ref', `wd_${request_id}`);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize Gemini Client
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// 10. Semantic & Contextual Search (T021)
app.post('/api/search/semantic', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // If Gemini is not set up, fall back to standard text matching
    if (!genAI) {
      console.warn('[Search] GEMINI_API_KEY não configurada. Usando busca por texto clássica.');
      const { data, error } = await getSupabaseClient(req)
        .from('books')
        .select('*')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,synopsis.ilike.%${query}%,premise.ilike.%${query}%`);
      
      if (error) throw error;
      return res.json({ books: data || [], method: 'text_fallback' });
    }

    // 1. Generate Query Vector Embedding
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(query);
    const queryEmbedding = result.embedding.values;

    // 2. Query cosine similarity in pgvector via RPC
    const { data: books, error: matchErr } = await getSupabaseClient(req)
      .rpc('match_books', {
        query_embedding: queryEmbedding,
        match_threshold: 0.2, // cosine similarity threshold
        match_count: 10
      });

    if (matchErr) {
      console.error('[Search] RPC error:', matchErr);
      // Fallback to text matching if RPC errors or fails
      const { data, error } = await getSupabaseClient(req)
        .from('books')
        .select('*')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,synopsis.ilike.%${query}%,premise.ilike.%${query}%`);
      
      if (error) throw error;
      return res.json({ books: data || [], method: 'text_fallback_after_rpc_err' });
    }

    res.json({ books: books || [], method: 'semantic' });
  } catch (err) {
    console.error('[Search] Error in semantic search endpoint:', err);
    res.status(500).json({ error: 'Failed to execute search' });
  }
});

// 11. Universe Connections API (T002)
app.get('/api/universe/connections/:bookId', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const { bookId } = req.params;

  try {
    const { data, error } = await supabaseClient
      .from('universe_connections')
      .select('*')
      .eq('book_id', bookId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/universe/connections', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const { book_id, source_id, source_type, target_id, target_type, relation_type, description } = req.body;

  if (!book_id || !source_id || !source_type || !target_id || !target_type || !relation_type) {
    return res.status(400).json({ error: 'Missing required connection fields' });
  }

  try {
    const { data, error } = await supabaseClient
      .from('universe_connections')
      .insert({
        book_id,
        source_id,
        source_type,
        target_id,
        target_type,
        relation_type,
        description
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/universe/connections/:id', async (req, res) => {
  const supabaseClient = getSupabaseClient(req);
  const { id } = req.params;

  try {
    const { error } = await supabaseClient
      .from('universe_connections')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {

  console.log(`CMS Server rodando na porta ${PORT}`);
  
  // Trigger background embeddings generation on startup (T023)
  if (process.env.GEMINI_API_KEY && process.env.SUPABASE_SERVICE_ROLE) {
    console.log('[Startup] Iniciando geração de embeddings em segundo plano...');
    try {
      const { fork } = require('child_process');
      const path = require('path');
      fork(path.join(__dirname, 'scripts', 'generate_book_embeddings.js'), [], {
        env: { ...process.env }
      });
    } catch (err) {
      console.error('[Startup] Falha ao iniciar geração de embeddings:', err);
    }
  } else {
    console.log('[Startup] Ignorando geração de embeddings (chaves ausentes).');
  }
});





