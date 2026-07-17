const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

console.log('🌱 Sembrando base de datos...');

// Limpiar tablas para garantizar un seed determinista
db.prepare('DELETE FROM orders').run();
db.prepare('DELETE FROM chat_logs').run();
db.prepare('DELETE FROM users WHERE role = \'user\'').run();
db.prepare('DELETE FROM products').run();
db.prepare('DELETE FROM coupons').run();

// Admin user (password: luaadmin)
const adminId = uuidv4();
const hash = bcrypt.hashSync('luaadmin', 10);

db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)')
  .run(adminId, 'admin', hash, 'admin');

// Demo user (password: demo123)
const demoId = uuidv4();
const demoHash = bcrypt.hashSync('demo123', 10);

db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)')
  .run(demoId, 'demo', demoHash, 'user');

// Products
const products = [
  { nombre: 'Rímel Volumen Extremo', descripcion: 'Máscara de larga duración, efecto volumen.', precio: 249, stock: 12, categoria: 'rimels', url_imagen: 'https://picsum.photos/seed/rimel1/600/750' },
  { nombre: 'Rímel Waterproof', descripcion: 'Resistente al agua, uso diario.', precio: 269, stock: 6, categoria: 'rimels', url_imagen: 'https://picsum.photos/seed/rimel2/600/750' },
  { nombre: 'Base Líquida Mate', descripcion: 'Cobertura media-alta, acabado mate, 12h.', precio: 449, stock: 8, categoria: 'bases', url_imagen: 'https://picsum.photos/seed/base1/600/750' },
  { nombre: 'Sérum Ácido Hialurónico', descripcion: 'Hidratación profunda para todo tipo de piel.', precio: 379, stock: 15, categoria: 'skincare', url_imagen: 'https://picsum.photos/seed/serum1/600/750' },
  { nombre: 'Labial Mate Terracota', descripcion: 'Color intenso, fórmula no reseca.', precio: 219, stock: 10, categoria: 'labiales', url_imagen: 'https://picsum.photos/seed/labial1/600/750' },
  { nombre: 'Crema Hidratante Día', descripcion: 'Textura ligera, FPS 15.', precio: 389, stock: 9, categoria: 'skincare', url_imagen: 'https://picsum.photos/seed/crema1/600/750' },
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (id, nombre, descripcion, precio, stock, categoria, url_imagen)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const p of products) {
  insertProduct.run(uuidv4(), p.nombre, p.descripcion, p.precio, p.stock, p.categoria, p.url_imagen);
}

// Coupons
const coupons = [
  { code: 'LUA10', discount: 0.10, type: 'percentage', description: '10% de descuento' },
  { code: 'LUA20', discount: 0.20, type: 'percentage', description: '20% de descuento' },
  { code: 'ENVIOGRATIS', discount: 5000, type: 'fixed', description: '$5,000 de descuento' },
  { code: 'LEALTAD10', discount: 0.10, type: 'percentage', description: '10% Desc. Lealtad' },
  { code: 'FIDELIDAD10', discount: 0.10, type: 'percentage', description: '10% de descuento por 5+ compras' },
];

const insertCoupon = db.prepare('INSERT OR IGNORE INTO coupons (code, discount, type, description) VALUES (?, ?, ?, ?)');
for (const c of coupons) {
  insertCoupon.run(c.code, c.discount, c.type, c.description);
}

// Variants for products
const allProducts = db.prepare('SELECT id, nombre, categoria FROM products').all();
const variantsData = {};

for (const p of allProducts) {
  switch (p.categoria) {
    case 'rimels':
      variantsData[p.id] = [
        { nombre: 'Black Intenso', stock: 8, sort_order: 0 },
        { nombre: 'Brown Suave', stock: 5, sort_order: 1 },
      ];
      break;
    case 'bases':
      variantsData[p.id] = [
        { nombre: 'Fair Ivory', stock: 4, sort_order: 0 },
        { nombre: 'Warm Beige', stock: 6, sort_order: 1 },
        { nombre: 'Medium Tan', stock: 3, sort_order: 2 },
        { nombre: 'Deep Bronze', stock: 2, sort_order: 3 },
      ];
      break;
    case 'labiales':
      variantsData[p.id] = [
        { nombre: 'Terracota', stock: 6, sort_order: 0 },
        { nombre: 'Rosewood', stock: 4, sort_order: 1 },
        { nombre: 'Burgundy', stock: 3, sort_order: 2 },
      ];
      break;
    case 'skincare':
      variantsData[p.id] = [
        { nombre: '30ml', stock: 10, sort_order: 0 },
        { nombre: '50ml', stock: 5, sort_order: 1 },
      ];
      break;
    default:
      variantsData[p.id] = [];
  }
}

const insertVariant = db.prepare(`
  INSERT OR IGNORE INTO product_variants (id, product_id, nombre, sku, stock, extra_price, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const [productId, variants] of Object.entries(variantsData)) {
  for (const v of variants) {
    const vid = uuidv4();
    insertVariant.run(vid, productId, v.nombre, `${productId.slice(0, 8)}-${v.nombre.slice(0, 4).toUpperCase()}`, v.stock, 0, v.sort_order);
  }
}

// Delivery zones
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

// Bank info seed in settings
try {
  const s = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (s && !s.bank_name) {
    db.prepare(`
      UPDATE settings SET bank_name = ?, bank_clabe = ?, bank_account = ?, bank_holder = ? WHERE id = 1
    `).run('BBVA', '012180015738654321', '1573865432', 'Lúa Beauty México');
    console.log('🌱 Datos bancarios sembrados en settings.');
  }
} catch (_) {}

console.log(`✅ Productos: ${db.prepare('SELECT COUNT(*) as c FROM products').get().c}`);
console.log(`✅ Variantes: ${db.prepare('SELECT COUNT(*) as c FROM product_variants').get().c}`);
console.log(`✅ Usuarios: ${db.prepare('SELECT COUNT(*) as c FROM users').get().c}`);
console.log(`✅ Cupones:  ${db.prepare('SELECT COUNT(*) as c FROM coupons').get().c}`);
console.log(`✅ Zonas:    ${db.prepare('SELECT COUNT(*) as c FROM delivery_zones').get().c}`);
console.log('🌱 Seed completado.');
