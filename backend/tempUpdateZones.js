const db = require('./db');

try {
  // Borrar zonas existentes
  db.prepare('DELETE FROM delivery_zones').run();
  
  const zones = [
    { nombre: '🏫 Kinder de Rinconada', descripcion: 'Entrega en el Kinder de Rinconada', sort_order: 0 },
    { nombre: '🏪 Kiosco de Villa', descripcion: 'Entrega en el Kiosco de Villa', sort_order: 1 },
    { nombre: '🏪 Kiosco de Xona', descripcion: 'Entrega en el Kiosco de Xona', sort_order: 2 },
    { nombre: '📍 Zolotepec', descripcion: 'Entrega en Zolotepec', sort_order: 3 },
  ];

  const insertZone = db.prepare('INSERT INTO delivery_zones (nombre, descripcion, sort_order) VALUES (?, ?, ?)');
  for (const z of zones) {
    insertZone.run(z.nombre, z.descripcion, z.sort_order);
  }

  console.log('✅ Delivery zones successfully updated in the database!');
} catch (err) {
  console.error('❌ Error updating delivery zones:', err.message);
}
