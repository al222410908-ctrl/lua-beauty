const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const bot = require('../bot');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, (req, res) => {
  let orders;
  if (req.user.role === 'admin') {
    orders = db.prepare(`
      SELECT o.*, u.nombre as user_nombre, u.telefono as user_telefono, u.direccion as user_direccion
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all();
  } else {
    orders = db.prepare(`
      SELECT o.*, u.nombre as user_nombre, u.telefono as user_telefono, u.direccion as user_direccion
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);
  }
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items), history: JSON.parse(o.history) })));
});

router.post('/', requireAuth, (req, res) => {
  const { items, subtotal, discount, total, coupon, payment_method, delivery_zone } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Se requiere al menos un producto' });
  }
  if (!delivery_zone) {
    return res.status(400).json({ error: 'Se requiere una zona de entrega' });
  }

  const id = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
  const history = [{ status: 'pendiente', date: new Date().toISOString() }];

  const createOrder = db.transaction(() => {
    const deductStock = db.prepare('UPDATE products SET stock = MAX(0, stock - ?), active = CASE WHEN stock - ? <= 0 THEN 0 ELSE active END WHERE id = ?');
    const deductVariantStock = db.prepare('UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE id = ?');
    for (const item of items) {
      if (item.variantId) {
        deductVariantStock.run(item.quantity, item.variantId);
      }
      deductStock.run(item.quantity, item.quantity, item.productId);
    }

    db.prepare(`
      INSERT INTO orders (id, user_id, items, subtotal, discount, total, coupon, status, history, payment_method, delivery_zone)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?)
    `).run(id, req.user.id, JSON.stringify(items), subtotal || 0, discount || 0, total || 0, coupon || null, JSON.stringify(history), payment_method || 'transferencia', delivery_zone);
  });

  createOrder();

  const order = db.prepare(`
    SELECT o.*, u.nombre as user_nombre, u.telefono as user_telefono, u.direccion as user_direccion
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(id);
  const broadcast = req.app.get('broadcast');
  if (broadcast) broadcast({ type: 'new_order', data: { ...order, items: JSON.parse(order.items), history: JSON.parse(order.history) } });

  // Send email confirmation
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (user?.email) {
      const emailService = require('../services/email');
      const { subject, html } = emailService.orderConfirmationEmail(order, user);
      emailService.sendMail({ to: user.email, subject, html });
    }
  } catch (_) {}

  res.status(201).json({ ...order, items: JSON.parse(order.items), history: JSON.parse(order.history) });
});

router.post('/chatbot', (req, res) => {
  // Validate API key for bot access
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.CHATBOT_API_KEY;
  if (expectedKey && apiKey !== expectedKey) {
    return res.status(401).json({ error: 'API key inválida' });
  }

  const { phone, items, subtotal, discount, total, coupon, payment_method, delivery_zone, skipDeduct } = req.body;
  if (!phone || !items || !items.length) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (phone, items)' });
  }
  const finalZone = delivery_zone || 'Centro';

  const cleanPhone = phone.replace(/\D/g, '');

  try {
    let user = db.prepare('SELECT id FROM users WHERE telefono = ?').get(cleanPhone);
    let userId;

    if (!user) {
      userId = uuidv4();
      const username = `wa_${cleanPhone}`;
      const placeholderHash = uuidv4();
      db.prepare(`
        INSERT INTO users (id, username, password_hash, role, nombre, telefono)
        VALUES (?, ?, ?, 'user', ?, ?)
      `).run(userId, username, placeholderHash, `Cliente WhatsApp (+${cleanPhone})`, cleanPhone);
    } else {
      userId = user.id;
    }

    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
    const history = [{ status: 'pendiente', date: new Date().toISOString() }];

    const createOrder = db.transaction(() => {
      if (!skipDeduct) {
        const deductStock = db.prepare('UPDATE products SET stock = MAX(0, stock - ?), active = CASE WHEN stock - ? <= 0 THEN 0 ELSE active END WHERE id = ?');
        const deductVariantStock = db.prepare('UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE id = ?');
        for (const item of items) {
          if (item.variantId) {
            deductVariantStock.run(item.quantity, item.variantId);
          }
          deductStock.run(item.quantity, item.quantity, item.productId);
        }
      }

      db.prepare(`
        INSERT INTO orders (id, user_id, items, subtotal, discount, total, coupon, status, history, payment_method, delivery_zone)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?)
      `).run(orderId, userId, JSON.stringify(items), subtotal || 0, discount || 0, total || 0, coupon || null, JSON.stringify(history), payment_method || 'transferencia', finalZone);
    });

    createOrder();

    const order = db.prepare(`
      SELECT o.*, u.nombre as user_nombre, u.telefono as user_telefono, u.direccion as user_direccion
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(orderId);
    
    const broadcast = req.app.get('broadcast');
    if (broadcast) {
      broadcast({
        type: 'new_order',
        data: { ...order, items: JSON.parse(order.items), history: JSON.parse(order.history) }
      });
    }

    res.status(201).json({ success: true, orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Estado inválido. Válidos: ${validStatuses.join(', ')}` });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  const history = JSON.parse(order.history);
  history.push({ status, date: new Date().toISOString() });

  db.prepare('UPDATE orders SET status = ?, history = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(status, JSON.stringify(history), req.params.id);

  const updated = db.prepare(`
    SELECT o.*, u.nombre as user_nombre, u.telefono as user_telefono, u.direccion as user_direccion
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(req.params.id);

  // Trigger automatic WhatsApp notification
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(updated.user_id);
    const phone = user?.telefono;
    if (phone) {
      let template = '';
      if (status === 'confirmado') {
        template = `✅ *¡Pedido Confirmado!* Hola, tu pedido *${updated.id}* en Lúa Beauty ha sido confirmado. Estamos preparando tus productos. ¡Muchas gracias! ❤️`;
      } else if (status === 'preparando') {
        template = `💄 *Preparando Pedido:* Hola, estamos alistando tus cosméticos de Lúa Beauty para el despacho del pedido *${updated.id}*. Te notificaremos cuando salga. 📦`;
      } else if (status === 'enviado') {
        template = `🚚 *¡Pedido Enviado!* Hola, tu pedido *${updated.id}* de Lúa Beauty va en camino a tu dirección. Esperamos que disfrutes tus productos. ¡Gracias por tu compra! 🥰`;
      } else if (status === 'entregado') {
        template = `🎉 *¡Pedido Entregado!* Tu pedido *${updated.id}* de Lúa Beauty fue entregado con éxito. ¡Nos encantaría saber tu opinión de los productos! ⭐`;
      } else if (status === 'cancelado') {
        template = `❌ *Pedido Cancelado:* Hola, te notificamos que tu pedido *${updated.id}* en Lúa Beauty ha sido cancelado. Si tienes dudas, contáctanos.`;
      } else {
        template = `📦 *Actualización de Pedido:* Hola, el estado de tu pedido *${updated.id}* en Lúa Beauty es: *${status.toUpperCase()}*.`;
      }

      await bot.sendManualMessage(phone, template);
    }
  } catch (err) {
    console.error(`Error al enviar notificación de WhatsApp automática para pedido ${updated.id}:`, err.message);
  }

  res.json({ ...updated, items: JSON.parse(updated.items), history: JSON.parse(updated.history) });
});

router.get('/stats', requireAuth, requireAdmin, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM orders').get().total;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = db.prepare("SELECT COALESCE(SUM(json_each.value->>'quantity'), 0) as total FROM orders, json_each(orders.items)").get().total;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pendiente','confirmado','preparando')").get().count;

  res.json({ totalOrders, totalRevenue, avgOrder, totalItemsSold, byStatus, pendingOrders });
});

router.post('/:id/notify', requireAuth, requireAdmin, async (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(order.user_id);
    const phone = user?.telefono;
    if (!phone) {
      return res.status(400).json({ error: 'El usuario no tiene un teléfono registrado para notificar.' });
    }

    // Formatear plantilla según estado
    let template = '';
    if (order.status === 'confirmado') {
      template = `✅ *¡Pedido Confirmado!* Hola, tu pedido *${order.id}* en Lúa Beauty ha sido confirmado. Estamos preparando tus productos. ¡Muchas gracias! ❤️`;
    } else if (order.status === 'preparando') {
      template = `💄 *Preparando Pedido:* Hola, estamos alistando tus cosméticos de Lúa Beauty para el despacho del pedido *${order.id}*. Te notificaremos cuando salga. 📦`;
    } else if (order.status === 'enviado') {
      template = `🚚 *¡Pedido Enviado!* Hola, tu pedido *${order.id}* de Lúa Beauty va en camino a tu dirección. Esperamos que disfrutes tus productos. ¡Gracias por tu compra! 🥰`;
    } else if (order.status === 'entregado') {
      template = `🎉 *¡Pedido Entregado!* Tu pedido *${order.id}* de Lúa Beauty fue entregado con éxito. ¡Nos encantaría saber tu opinión de los productos! ⭐`;
    } else if (order.status === 'cancelado') {
      template = `❌ *Pedido Cancelado:* Hola, te notificamos que tu pedido *${order.id}* en Lúa Beauty ha sido cancelado. Si tienes dudas, contáctanos.`;
    } else {
      template = `📦 *Actualización de Pedido:* Hola, el estado de tu pedido *${order.id}* en Lúa Beauty es: *${order.status.toUpperCase()}*.`;
    }

    // Enviar WhatsApp manual y pausar respuestas automáticas por 30m
    await bot.sendManualMessage(phone, template);
    res.json({ success: true, message: 'Notificación de WhatsApp enviada con éxito', text: template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: consultar pedidos por número de WhatsApp (sin cuenta, sin token)
router.get('/by-phone/:phone', (req, res) => {
  try {
    const cleanPhone = req.params.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      return res.status(400).json({ error: 'Número de teléfono inválido' });
    }

    // Buscar usuario por teléfono o por username automático del bot (wa_NUMERO)
    const user = db.prepare(
      "SELECT id FROM users WHERE telefono = ? OR username = ?"
    ).get(cleanPhone, `wa_${cleanPhone}`);

    if (!user) {
      return res.json([]); // Sin cuenta = sin pedidos, array vacío
    }

    const orders = db.prepare(`
      SELECT id, items, subtotal, discount, total, coupon, status, payment_method, delivery_zone, created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(user.id);

    res.json(orders.map(o => ({
      ...o,
      items: JSON.parse(o.items),
      history: [],
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
