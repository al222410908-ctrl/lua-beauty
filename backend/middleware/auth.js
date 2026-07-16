const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'luabeauty-secret-change-in-production';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      nombre: user.nombre || '',
      email: user.email || ''
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function requireAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.CHATBOT_API_KEY;
  if (expectedKey && apiKey === expectedKey) {
    req.user = { id: 'chatbot', username: 'chatbot', role: 'admin' };
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Se requiere autenticación' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador' });
  }
  next();
}

module.exports = { generateToken, requireAuth, requireAdmin };
