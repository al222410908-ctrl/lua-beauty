require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Capturar errores no controlados para evitar que caídas de WhatsApp Web tiren el servidor completo
process.on('uncaughtException', (err) => {
  console.error('⚠️ [EXCEPCIÓN NO CONTROLADA] Ocurrió un error en el proceso:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [RECHAZO DE PROMENSA NO CONTROLADA] Promesa no manejada:', reason);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { WebSocketServer } = require('ws');
const multer = require('multer');
const db = require('./db');
const bot = require('./bot');
const emailService = require('./services/email');

// ─── Configuración de Multer para subida de imágenes ───────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `prod-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) return cb(null, true);
  cb(new Error(`Formato no permitido: ${ext}. Usa: ${allowed.join(', ')}`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
}

// Make broadcast available to routes
app.set('broadcast', broadcast);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:3000']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos subidos (imágenes de productos)
app.use('/uploads', express.static(UPLOADS_DIR));

// Archivos Estáticos del Panel Admin (/admin)
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin/dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Archivos Estáticos del Catálogo React (Raíz)
app.use(express.static(path.join(__dirname, '../frontend/catalog-react/dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

const { requireAuth, requireAdmin } = require('./middleware/auth');

// ─── Endpoint de subida de imágenes ────────────────────────────────────
app.post('/api/upload', requireAuth, requireAdmin, (req, res) => {
  upload.single('imagen')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Error de subida: ${err.message}` });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo' });

    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, url, filename: req.file.filename });
  });
});
// ────────────────────────────────────────────────────────────────────────

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/auth')); // Alias para el listado administrativo y perfil
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/newsletter', require('./routes/newsletter'));

// Delivery zones
app.use('/api/delivery-zones', require('./routes/deliveryZones'));

// Wishlists & Addresses
app.use('/api/wishlists', require('./routes/wishlists'));
app.use('/api/addresses', require('./routes/addresses'));

// Export orders CSV
app.get('/api/orders/export', requireAuth, requireAdmin, (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.user_id, u.nombre as cliente, u.telefono, u.email, o.items, o.subtotal, o.discount, o.total, o.coupon, o.status, o.payment_method, o.delivery_zone, o.created_at
    FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC
  `).all();
  const headers = 'ID,Cliente,Teléfono,Email,Productos,Subtotal,Descuento,Total,Cupón,Pago,Zona,Estado,Fecha\n';
  const rows = orders.map(o => {
    const items = JSON.parse(o.items).map(i => `${i.nombre}${i.variantName ? ` (${i.variantName})` : ''} x${i.quantity}`).join('; ');
    return `"${o.id}","${o.cliente || ''}","${o.telefono || ''}","${o.email || ''}","${items}",${o.subtotal},${o.discount},${o.total},"${o.coupon || ''}","${o.payment_method || 'transferencia'}","${o.delivery_zone || ''}","${o.status}","${o.created_at}"`;
  }).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=pedidos_${Date.now()}.csv`);
  res.send('\uFEFF' + headers + rows);
});

// Coupons (admin only, coupons should be validated server-side via POST /api/coupons/validate)
app.get('/api/coupons', requireAuth, requireAdmin, (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons WHERE active = 1').all();
  res.json(coupons);
});

app.post('/api/coupons', requireAuth, requireAdmin, (req, res) => {
  const { code, discount, type, description } = req.body;
  if (!code || discount === undefined) return res.status(400).json({ error: 'Código y descuento son requeridos' });
  const cleanCode = code.toUpperCase().trim();
  try {
    db.prepare('INSERT OR REPLACE INTO coupons (code, discount, type, description, active) VALUES (?, ?, ?, ?, 1)')
      .run(cleanCode, parseFloat(discount), type || 'percentage', description || '');
    res.status(201).json({ success: true, code: cleanCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/coupons/:code', requireAuth, requireAdmin, (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    db.prepare('UPDATE coupons SET active = 0 WHERE code = ?').run(code);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coupons/validate', (req, res) => {
  const { code, phone } = req.body;
  if (!code) return res.status(400).json({ error: 'Código requerido' });
  const couponCode = code.toUpperCase();
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(couponCode);
  if (!coupon) return res.status(404).json({ error: 'Cupón no válido' });

  if (couponCode === 'FIDELIDAD10') {
    let userId = null;
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'luabeauty-secret-change-in-production';
        const userPayload = jwt.verify(header.slice(7), JWT_SECRET);
        userId = userPayload.id;
      } catch (_) {}
    }

    let user = null;
    if (userId) {
      user = db.prepare('SELECT id, telefono FROM users WHERE id = ?').get(userId);
    } else if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      user = db.prepare('SELECT id, telefono FROM users WHERE telefono = ? OR username = ?').get(cleanPhone, `wa_${cleanPhone}`);
    }

    if (!user) {
      return res.status(400).json({ error: 'Este cupón de lealtad requiere iniciar sesión o ingresar tu número de WhatsApp para validar tus compras anteriores.' });
    }

    // Contar compras exitosas/no canceladas
    const orderCount = db.prepare("SELECT COUNT(*) as c FROM orders WHERE user_id = ? AND status != 'cancelado'").get(user.id).c;
    if (orderCount < 5) {
      return res.status(400).json({ error: `¡Casi lo logras! El cupón FIDELIDAD10 requiere al menos 5 compras previas. Actualmente tienes ${orderCount} compra(s).` });
    }
  }

  res.json(coupon);
});

// Behavior tracking
app.post('/api/behavior', (req, res) => {
  const { action, detail } = req.body;
  if (!action) return res.status(400).json({ error: 'action requerido' });
  db.prepare('INSERT INTO behavior (action, detail) VALUES (?, ?)').run(action, detail || '');
  res.status(201).json({ success: true });
});

app.get('/api/behavior', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM behavior ORDER BY timestamp DESC LIMIT 100').all();
  res.json(rows);
});

// User loyalty status (authenticated users)
app.get('/api/users/loyalty', requireAuth, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders WHERE user_id = ?').get(req.user.id).c;
  const usedRewards = db.prepare("SELECT COUNT(*) as c FROM orders WHERE user_id = ? AND coupon = 'LEALTAD10'").get(req.user.id).c;
  const earnedRewards = Math.floor(totalOrders / 3);
  const remainingRewards = Math.max(0, earnedRewards - usedRewards);
  const currentCyclePurchases = totalOrders % 3;
  res.json({ totalOrders, earnedRewards, usedRewards, remainingRewards, currentCyclePurchases });
});

// Dashboard stats (admin only)
app.get('/api/dashboard', requireAuth, requireAdmin, (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const lowStock = db.prepare('SELECT COUNT(*) as c FROM products WHERE stock < 5').get().c;
  const totalValue = db.prepare('SELECT COALESCE(SUM(precio * stock), 0) as t FROM products').get().t;
  const totalViews = db.prepare('SELECT COALESCE(SUM(views), 0) as t FROM products').get().t;
  const popular = db.prepare('SELECT id, nombre, views FROM products ORDER BY views DESC LIMIT 5').all();
  const lowStockProducts = db.prepare('SELECT id, nombre, stock FROM products WHERE stock < 5 ORDER BY stock').all();
  res.json({ totalProducts, lowStock, totalValue, totalViews, popular, lowStockProducts });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Bot status (QR, connected, active state, logs) — requires admin
app.get('/api/bot/status', requireAuth, requireAdmin, (req, res) => {
  res.json(bot.getBotStatus());
});

// Admin: Start Bot
app.post('/api/bot/start', requireAuth, requireAdmin, (req, res) => {
  bot.startBot();
  res.json({ success: true, message: 'Iniciando bot...' });
});

// Admin: Stop Bot
app.post('/api/bot/stop', requireAuth, requireAdmin, (req, res) => {
  bot.stopBot();
  res.json({ success: true, message: 'Deteniendo bot...' });
});

// Admin: Desvincular / Logout Bot
app.post('/api/bot/logout', requireAuth, requireAdmin, (req, res) => {
  bot.logoutBot();
  res.json({ success: true, message: 'Desvinculando bot...' });
});

// Admin: Force-stop — mata el proceso Chrome aunque esté en estado roto
app.post('/api/bot/force-stop', requireAuth, requireAdmin, async (req, res) => {
  try {
    await bot.forceStop();
    res.json({ success: true, message: 'Bot detenido forzosamente. Puedes reiniciarlo.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bot Settings (public GET, admin PUT)
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
    if (settings?.payment_methods && typeof settings.payment_methods === 'string') {
      try { settings.payment_methods = JSON.parse(settings.payment_methods); } catch { settings.payment_methods = ['transferencia', 'efectivo']; }
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', requireAuth, requireAdmin, (req, res) => {
  const { welcome_message, help_message, address, maps_url, indications, whatsapp_number, bank_name, bank_clabe, bank_account, bank_holder, payment_methods } = req.body;
  try {
    db.prepare(`
      UPDATE settings
      SET welcome_message = ?, help_message = ?, address = ?, maps_url = ?, indications = ?, whatsapp_number = ?,
          bank_name = ?, bank_clabe = ?, bank_account = ?, bank_holder = ?, payment_methods = ?
      WHERE id = 1
    `).run(welcome_message, help_message, address, maps_url, indications, whatsapp_number, bank_name, bank_clabe, bank_account, bank_holder, payment_methods ? JSON.stringify(payment_methods) : '["transferencia","efectivo"]');
    res.json({ success: true, message: 'Configuración actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Chat List (last message for each phone)
app.get('/api/chat/list', requireAuth, requireAdmin, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c1.phone, c1.sender, c1.message, c1.timestamp
      FROM chat_logs c1
      INNER JOIN (
        SELECT phone, MAX(id) as max_id
        FROM chat_logs
        GROUP BY phone
      ) c2 ON c1.id = c2.max_id
      ORDER BY c1.id DESC
    `).all();

    const list = rows.map(r => ({
      ...r,
      paused: bot.isChatPaused(r.phone)
    }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Chat history for a specific phone number
app.get('/api/chat/history/:phone', requireAuth, requireAdmin, (req, res) => {
  const { phone } = req.params;
  const formattedPhone = phone.includes("@") ? phone : `${phone}@c.us`;
  try {
    const history = db.prepare(`
      SELECT sender, message, timestamp
      FROM chat_logs
      WHERE phone = ? OR phone = ?
      ORDER BY id ASC
    `).all(phone, formattedPhone);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Send manual WhatsApp message
app.post('/api/chat/send', requireAuth, requireAdmin, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (phone, message)' });
  }
  try {
    await bot.sendManualMessage(phone, message);
    res.json({ success: true, message: 'Mensaje enviado e intervención manual activada.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get WhatsApp groups list
app.get('/api/groups', requireAuth, requireAdmin, async (req, res) => {
  try {
    const groups = await bot.getGroups();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Send message to one or multiple WhatsApp groups
app.post('/api/groups/send', requireAuth, requireAdmin, async (req, res) => {
  const { groupIds, message } = req.body;
  if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0 || !message) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (groupIds [array], message)' });
  }
  try {
    for (const id of groupIds) {
      await bot.sendGroupMessage(id, message);
    }
    res.json({ success: true, message: `Mensaje enviado a ${groupIds.length} grupo(s) con éxito.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Toggle chatbot auto-responses pause/resume
app.post('/api/chat/pause', requireAuth, requireAdmin, (req, res) => {
  const { phone, pause, minutes } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Falta campo phone' });
  }
  try {
    if (pause) {
      bot.pauseBot(phone, minutes || 30);
    } else {
      bot.pauseBot(phone, 0);
    }
    res.json({ success: true, paused: bot.isChatPaused(phone) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Quick Responses list
app.get('/api/quick-responses', requireAuth, requireAdmin, (req, res) => {
  try {
    const list = db.prepare("SELECT * FROM quick_responses ORDER BY id ASC").all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add a new quick response
app.post('/api/quick-responses', requireAuth, requireAdmin, (req, res) => {
  const { titulo, mensaje } = req.body;
  if (!titulo || !mensaje) {
    return res.status(400).json({ error: "Faltan campos obligatorios (titulo, mensaje)" });
  }
  try {
    db.prepare("INSERT INTO quick_responses (titulo, mensaje) VALUES (?, ?)").run(titulo, mensaje);
    res.json({ success: true, message: "Respuesta rápida creada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Conversion analytics
app.get('/api/behavior/conversion', requireAuth, requireAdmin, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        SUM(CASE WHEN action = 'ViewProduct' THEN 1 ELSE 0 END) as views,
        SUM(CASE WHEN action = 'Consulta_Producto' THEN 1 ELSE 0 END) as questions,
        SUM(CASE WHEN action = 'Checkout' THEN 1 ELSE 0 END) as checkouts
      FROM behavior
    `).get();

    const views = stats.views || 0;
    const questions = stats.questions || 0;
    const checkouts = stats.checkouts || 0;

    const conversionToQuestions = views > 0 ? ((questions / views) * 100).toFixed(1) : 0;
    const conversionToCheckouts = views > 0 ? ((checkouts / views) * 100).toFixed(1) : 0;

    res.json({
      views,
      questions,
      checkouts,
      rates: {
        toQuestions: parseFloat(conversionToQuestions),
        toCheckouts: parseFloat(conversionToCheckouts)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// SPA fallback para el Panel Admin (cualquier ruta que comience con /admin)
app.use('/admin', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(__dirname, '../frontend/admin/dist', 'index.html'));
});

// SPA fallback para el catálogo React (cualquier otra ruta no capturada por la API)
app.use((req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(__dirname, '../frontend/catalog-react/dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor Lúa Beauty corriendo en:`);
  console.log(`   API:      http://127.0.0.1:${PORT}/api`);
  console.log(`   Frontend: http://127.0.0.1:${PORT}`);
  console.log(`   WebSocket: ws://127.0.0.1:${PORT}`);

  // Arrancar el chatbot unificado
  bot.initBot(broadcast);

  // Inicializar transporte de email
  emailService.initTransporter();
});
