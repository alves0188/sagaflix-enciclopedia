const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

app.listen(PORT, () => {
  console.log(`CMS Server rodando na porta ${PORT}`);
});
