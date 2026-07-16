const { Router } = require('express');
const db = require('../db');

const router = Router();

router.post('/', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
    db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email);
    res.status(201).json({ success: true, message: 'Suscripción exitosa' });
  } catch {
    res.status(409).json({ error: 'El email ya está registrado' });
  }
});

router.get('/', (req, res) => {
  const subs = db.prepare('SELECT * FROM newsletter ORDER BY created_at DESC').all();
  res.json(subs);
});

module.exports = router;
