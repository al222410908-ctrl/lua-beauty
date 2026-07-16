const { Router } = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', (req, res) => {
  try {
    const zones = db.prepare('SELECT * FROM delivery_zones WHERE active = 1 ORDER BY sort_order ASC, nombre ASC').all();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', requireAuth, requireAdmin, (req, res) => {
  try {
    const zones = db.prepare('SELECT * FROM delivery_zones ORDER BY sort_order ASC, nombre ASC').all();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { nombre, descripcion, active, sort_order } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const stmt = db.prepare('INSERT INTO delivery_zones (nombre, descripcion, active, sort_order) VALUES (?, ?, ?, ?)');
    const result = stmt.run(nombre, descripcion || '', active !== undefined ? (active ? 1 : 0) : 1, sort_order || 0);
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { nombre, descripcion, active, sort_order } = req.body;
  try {
    db.prepare('UPDATE delivery_zones SET nombre = ?, descripcion = ?, active = ?, sort_order = ? WHERE id = ?')
      .run(nombre, descripcion || '', active !== undefined ? (active ? 1 : 0) : 1, sort_order || 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM delivery_zones WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
