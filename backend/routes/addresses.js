const { Router } = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user.id);
  res.json(addresses);
});

router.post('/', requireAuth, (req, res) => {
  const { alias, calle, colonia, ciudad, estado, cp, referencia, is_default } = req.body;
  if (!calle || !ciudad || !estado || !cp) {
    return res.status(400).json({ error: 'calle, ciudad, estado y cp son requeridos' });
  }
  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }
  const result = db.prepare(`
    INSERT INTO addresses (user_id, alias, calle, colonia, ciudad, estado, cp, referencia, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, alias || '', calle, colonia || '', ciudad, estado, cp, referencia || '', is_default ? 1 : 0);
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(addr);
});

router.put('/:id', requireAuth, (req, res) => {
  const { alias, calle, colonia, ciudad, estado, cp, referencia, is_default } = req.body;
  const existing = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Dirección no encontrada' });
  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }
  db.prepare(`
    UPDATE addresses SET alias=?, calle=?, colonia=?, ciudad=?, estado=?, cp=?, referencia=?, is_default=?
    WHERE id=?
  `).run(
    alias ?? existing.alias, calle ?? existing.calle, colonia ?? existing.colonia,
    ciudad ?? existing.ciudad, estado ?? existing.estado, cp ?? existing.cp,
    referencia ?? existing.referencia, is_default !== undefined ? (is_default ? 1 : 0) : existing.is_default,
    req.params.id
  );
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id);
  res.json(addr);
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Dirección no encontrada' });
  res.json({ success: true });
});

module.exports = router;
