const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', (req, res) => {
  const { categoria, incluir_inactivos } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];
  const conditions = [];

  if (!incluir_inactivos) {
    conditions.push('active = 1');
  }

  if (categoria) {
    conditions.push('categoria = ?');
    params.push(categoria);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY nombre';
  const products = db.prepare(query).all(...params);
  res.json(products);
});

router.get('/categoria/:categoria', (req, res) => {
  const { categoria } = req.params;
  const products = db.prepare('SELECT * FROM products WHERE categoria = ? AND active = 1 AND stock > 0 ORDER BY nombre').all(categoria);
  res.json(products);
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, nombre').all(req.params.id);
  product.variants = variants;
  res.json(product);
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { nombre, descripcion, precio, stock, categoria, url_imagen } = req.body;
  if (!nombre || precio == null || stock == null || !categoria) {
    return res.status(400).json({ error: 'nombre, precio, stock y categoria son requeridos' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO products (id, nombre, descripcion, precio, stock, categoria, url_imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, nombre, descripcion || '', precio, stock, categoria, url_imagen || '');

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json(product);
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { nombre, descripcion, precio, stock, categoria, url_imagen, active } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  db.prepare(`
    UPDATE products SET nombre=?, descripcion=?, precio=?, stock=?, categoria=?, url_imagen=?, active=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    nombre ?? existing.nombre,
    descripcion ?? existing.descripcion,
    precio ?? existing.precio,
    stock ?? existing.stock,
    categoria ?? existing.categoria,
    url_imagen ?? existing.url_imagen,
    active !== undefined ? (active ? 1 : 0) : existing.active,
    req.params.id
  );

  // Si el admin actualiza stock > 0 y active = 0, reactivar automáticamente
  if (stock !== undefined && stock > 0 && existing.active === 0 && active === undefined) {
    db.prepare('UPDATE products SET active = 1, updated_at = datetime(\'now\') WHERE id = ?')
      .run(req.params.id);
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(product);
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json({ success: true });
});

router.post('/restar-stock', requireAuth, (req, res) => {
  const { producto_id, cantidad } = req.body;
  if (!producto_id || !cantidad || cantidad < 1) {
    return res.status(400).json({ error: 'producto_id y cantidad (>=1) son requeridos' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(producto_id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  if (product.stock < cantidad) {
    return res.status(400).json({ error: `Stock insuficiente: disponible ${product.stock}, solicitado ${cantidad}` });
  }

  // Descontar stock
  db.prepare('UPDATE products SET stock = stock - ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(cantidad, producto_id);

  // Si el stock llegó a 0, desactivar el producto automáticamente
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(producto_id);
  if (updated.stock <= 0) {
    db.prepare('UPDATE products SET active = 0, updated_at = datetime(\'now\') WHERE id = ?')
      .run(producto_id);
    updated.active = 0;
  }

  res.json(updated);
});

// ─── Variant CRUD ─────────────────────────────────────────────────────
router.get('/:id/variants', (req, res) => {
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, nombre').all(req.params.id);
  res.json(variants);
});

router.post('/:id/variants', requireAuth, requireAdmin, (req, res) => {
  const { nombre, sku, stock, extra_price, sort_order } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO product_variants (id, product_id, nombre, sku, stock, extra_price, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, nombre, sku || '', stock ?? 0, extra_price ?? 0, sort_order ?? 0);

  const variant = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(id);
  res.status(201).json(variant);
});

router.put('/:id/variants/:variantId', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ?').get(req.params.variantId, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Variante no encontrada' });

  const { nombre, sku, stock, extra_price, sort_order } = req.body;
  db.prepare(`
    UPDATE product_variants SET nombre=?, sku=?, stock=?, extra_price=?, sort_order=?
    WHERE id=?
  `).run(
    nombre ?? existing.nombre,
    sku ?? existing.sku,
    stock ?? existing.stock,
    extra_price ?? existing.extra_price,
    sort_order ?? existing.sort_order,
    req.params.variantId
  );

  const variant = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(req.params.variantId);
  res.json(variant);
});

router.delete('/:id/variants/:variantId', requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM product_variants WHERE id = ? AND product_id = ?').run(req.params.variantId, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Variante no encontrada' });
  res.json({ success: true });
});

router.post('/restar-stock-variant', requireAuth, (req, res) => {
  const { variant_id, cantidad } = req.body;
  if (!variant_id || !cantidad || cantidad < 1) {
    return res.status(400).json({ error: 'variant_id y cantidad (>=1) son requeridos' });
  }

  const variant = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variant_id);
  if (!variant) return res.status(404).json({ error: 'Variante no encontrada' });
  if (variant.stock < cantidad) {
    return res.status(400).json({ error: `Stock insuficiente en variante: disponible ${variant.stock}, solicitado ${cantidad}` });
  }

  db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ?').run(cantidad, variant_id);
  const updated = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variant_id);
  res.json(updated);
});

router.post('/:id/views', (req, res) => {
  db.prepare('UPDATE products SET views = views + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Product Images Gallery ──────────────────────────────────────────
router.get('/:id/images', (req, res) => {
  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id').all(req.params.id);
  res.json(images);
});

router.post('/:id/images', requireAuth, requireAdmin, (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url requerida' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM product_images WHERE product_id = ?').get(req.params.id);
  const result = db.prepare('INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)').run(req.params.id, url, maxOrder.m + 1);
  const image = db.prepare('SELECT * FROM product_images WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(image);
});

router.delete('/:id/images/:imageId', requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM product_images WHERE id = ? AND product_id = ?').run(req.params.imageId, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Imagen no encontrada' });
  res.json({ success: true });
});

// ─── Stock Notifications ────────────────────────────────────────────
router.post('/:id/notify-stock', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  try {
    db.prepare('INSERT INTO stock_notifications (product_id, email) VALUES (?, ?)').run(req.params.id, email);
    res.json({ success: true, message: 'Te notificaremos cuando esté disponible' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.json({ success: true, message: 'Ya estás registrado para recibir notificaciones' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
