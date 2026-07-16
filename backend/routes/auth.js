const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = Router();

const BCRYPT_ROUNDS = 10;

function hashPassword(password) {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, nombre, email, telefono, direccion } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'El usuario ya existe' });
  }

  const existingEmail = email ? db.prepare('SELECT id FROM users WHERE email = ?').get(email) : null;
  if (existingEmail) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const id = uuidv4();
  const password_hash = hashPassword(password);

  db.prepare('INSERT INTO users (id, username, password_hash, role, nombre, email, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, username, password_hash, 'user', nombre || '', email || '', telefono || '', direccion || '');

  const user = { id, username, role: 'user', nombre: nombre || '', email: email || '', telefono: telefono || '', direccion: direccion || '' };
  const token = generateToken(user);
  res.status(201).json({ token, user });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, role, nombre, email, telefono, direccion, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

router.put('/me', requireAuth, (req, res) => {
  const { nombre, email, telefono, direccion } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (email && email !== user.email) {
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
    if (existingEmail) return res.status(409).json({ error: 'El email ya está en uso' });
  }

  db.prepare('UPDATE users SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?')
    .run(
      nombre ?? user.nombre,
      email ?? user.email,
      telefono ?? user.telefono,
      direccion ?? user.direccion,
      req.user.id
    );

  const updated = db.prepare('SELECT id, username, role, nombre, email, telefono, direccion, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(updated);
});

// Admin: listar todos los usuarios
router.get('/', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  const users = db.prepare('SELECT id, username, role, nombre, email, telefono, direccion, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// ─── Password Reset ───────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
  if (!user) return res.json({ success: true, message: 'Si el email existe, recibirás instrucciones' });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

  try {
    const emailService = require('../services/email');
    const { subject, html } = emailService.passwordResetEmail(token, email);
    await emailService.sendMail({ to: email, subject, html });
  } catch (err) {
    console.error('Error enviando email de reset:', err.message);
  }

  res.json({ success: true, message: 'Si el email existe, recibirás instrucciones' });
});

router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });

  const reset = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime(\'now\')').get(token);
  if (!reset) return res.status(400).json({ error: 'Token inválido o expirado' });

  const password_hash = hashPassword(password);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, reset.user_id);
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

  res.json({ success: true, message: 'Contraseña actualizada correctamente' });
});

// ─── Auto-migration ───────────────────────────────────────────────────
// Migración automática: si el hash actual empieza con $2b$ o $2a$, ya es bcrypt.
// Si no, re-hashea con bcrypt (soporta SHA-256 plano antiguo y HMAC-SHA256).
try {
  const users = db.prepare('SELECT * FROM users').all();
  for (const user of users) {
    if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) continue;
    const adminPass = user.role === 'admin' ? (process.env.ADMIN_PASSWORD || 'luaadmin') : null;
    if (adminPass) {
      // Try HMAC-SHA256 first, then plain SHA-256
      const hmacHash = crypto.createHmac('sha256', process.env.JWT_SECRET || 'luabeauty-secret-change-in-production').update(adminPass).digest('hex');
      const plainHash = crypto.createHash('sha256').update(adminPass).digest('hex');
      let newHash = null;
      if (user.password_hash === hmacHash) {
        newHash = hashPassword(adminPass);
      } else if (user.password_hash === plainHash) {
        newHash = hashPassword(adminPass);
      }
      if (newHash) {
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
        console.log(`🔐 Contraseña del usuario '${user.username}' migrada a bcrypt.`);
      }
    }
  }
} catch (migErr) {
  console.error('⚠️  Error en migración automática de contraseñas:', migErr.message);
}

module.exports = router;
