const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/:productId', (req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY date DESC').all(req.params.productId);
  res.json(reviews);
});

router.post('/', (req, res) => {
  const { product_id, author, rating, text } = req.body;
  if (!product_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'product_id y rating (1-5) son requeridos' });
  }

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  const result = db.prepare('INSERT INTO reviews (product_id, author, rating, text) VALUES (?, ?, ?, ?)')
    .run(product_id, author || 'Anónimo', rating, text || '');

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(review);
});

router.get('/rating/:productId', (req, res) => {
  const stats = db.prepare('SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as avg FROM reviews WHERE product_id = ?')
    .get(req.params.productId);
  res.json({ count: stats.count, avg: Math.round(stats.avg * 10) / 10 });
});

module.exports = router;
