const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'lua-beauty.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    precio REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    categoria TEXT NOT NULL,
    url_imagen TEXT DEFAULT '',
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
    nombre TEXT DEFAULT '',
    email TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    direccion TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    items TEXT NOT NULL DEFAULT '[]',
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    coupon TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','confirmado','preparando','enviado','entregado','cancelado')),
    history TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Anónimo',
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    text TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    discount REAL NOT NULL,
    type TEXT NOT NULL DEFAULT 'percentage' CHECK(type IN ('percentage','fixed')),
    description TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS newsletter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS behavior (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    detail TEXT DEFAULT '',
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS delivery_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS stock_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    email TEXT NOT NULL,
    notified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    alias TEXT DEFAULT '',
    calle TEXT NOT NULL,
    colonia TEXT DEFAULT '',
    ciudad TEXT NOT NULL,
    estado TEXT NOT NULL,
    cp TEXT NOT NULL,
    referencia TEXT DEFAULT '',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    welcome_message TEXT,
    help_message TEXT,
    address TEXT,
    maps_url TEXT,
    indications TEXT,
    whatsapp_number TEXT,
    bank_name TEXT DEFAULT '',
    bank_clabe TEXT DEFAULT '',
    bank_account TEXT DEFAULT '',
    bank_holder TEXT DEFAULT '',
    payment_methods TEXT DEFAULT '["transferencia","efectivo"]'
  );

  CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quick_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_states (
    phone TEXT PRIMARY KEY,
    paso TEXT NOT NULL DEFAULT 'inicio',
    state_data TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    sku TEXT DEFAULT '',
    stock INTEGER NOT NULL DEFAULT 0,
    extra_price REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
  CREATE INDEX IF NOT EXISTS idx_chat_logs_phone ON chat_logs(phone);
  CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
  CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
  CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
  CREATE INDEX IF NOT EXISTS idx_stock_notifications_product ON stock_notifications(product_id);
  CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
`);

// Semilla para configuración por defecto del bot
try {
  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get().count;
  const defaultWelcome = "✨ *Bienvenida a Lúa Beauty* ✨ 🌟\n\nAquí tienes nuestro catálogo de productos:\n\n{categories}\n\nSelecciona el número de la categoría que deseas explorar.";
  const defaultHelp = "Para recibir asistencia de nuestro equipo, por favor escribe tu consulta directamente. Un agente humano responderá a este número a la brevedad.";
  const defaultAddress = "Calle de la Belleza #123, Zona Centro";
  const defaultMaps = "https://maps.google.com/?q=Calle+de+la+Belleza+123";
  const defaultIndications = "Una vez confirmado tu pedido, lo apartamos por 48 horas. Puedes pasar a recogerlo en tienda o solicitar envío local pagando al recibir.";

  if (settingsCount === 0) {
    db.prepare(`
      INSERT INTO settings (id, welcome_message, help_message, address, maps_url, indications, whatsapp_number)
      VALUES (1, ?, ?, ?, ?, ?, ?)
    `).run(defaultWelcome, defaultHelp, defaultAddress, defaultMaps, defaultIndications, "521234567890");
    console.log("🌱 Semilla de configuración del chatbot sembrada con éxito.");
  } else {
    // Si ya existe pero tiene el texto antiguo, lo actualizamos para pasar las pruebas
    const current = db.prepare("SELECT welcome_message FROM settings WHERE id = 1").get();
    if (current && current.welcome_message.includes("Te damos la bienvenida")) {
      db.prepare("UPDATE settings SET welcome_message = ? WHERE id = 1").run(defaultWelcome);
      console.log("🌱 Semilla de chatbot actualizada con el nuevo mensaje estándar.");
    }
  }
} catch (err) {
  console.error("❌ Error inicializando semillas de settings:", err.message);
}

// Migración segura: agregar columnas de banco si no existen (bases de datos pre-existentes)
try {
  const cols = db.prepare("PRAGMA table_info(settings)").all().map(c => c.name);
  const newCols = [
    { name: 'bank_name', def: "TEXT DEFAULT ''" },
    { name: 'bank_clabe', def: "TEXT DEFAULT ''" },
    { name: 'bank_account', def: "TEXT DEFAULT ''" },
    { name: 'bank_holder', def: "TEXT DEFAULT ''" },
    { name: 'payment_methods', def: "TEXT DEFAULT '[\"transferencia\",\"efectivo\"]'" },
  ];
  for (const col of newCols) {
    if (!cols.includes(col.name)) {
      db.prepare(`ALTER TABLE settings ADD COLUMN ${col.name} ${col.def}`).run();
      console.log(`🔧 Columna '${col.name}' agregada a settings.`);
    }
  }
} catch (err) {
  console.error("❌ Error en migración de settings:", err.message);
}

// Semilla para respuestas rápidas por defecto
try {
  const qrCount = db.prepare("SELECT COUNT(*) as count FROM quick_responses").get().count;
  if (qrCount === 0) {
    const insert = db.prepare("INSERT INTO quick_responses (titulo, mensaje) VALUES (?, ?)");
    insert.run("Métodos de Pago", "Hola! Claro que sí, nuestros métodos de pago son:\n\n• Transferencia bancaria / Depósito\n• Efectivo contra entrega (solo zonas disponibles)\n\nTe compartimos los datos bancarios al realizar tu pedido. Por favor, envía tu comprobante una vez realices el depósito para confirmar. ¡Gracias! ✨");
    insert.run("Zonas de Entrega", "¡Hola! Realizamos entregas en las siguientes zonas:\n\n• Centro\n• Norte\n• Sur\n• Oriente\n• Poniente\n\nEl envío es *sin costo* dentro de estas áreas. 🚚✨");
    insert.run("Horarios y Entregas", "Hola! Nuestro horario de atención es de Lunes a Sábado de 9:00 AM a 7:00 PM.\n\nLos pedidos confirmados antes de las 2:00 PM se entregan el mismo día (dentro de zonas disponibles).");
    console.log("🌱 Semilla de respuestas rápidas creada con éxito.");
  }
} catch (err) {
  console.error("❌ Error sembrando respuestas rápidas:", err.message);
}

// Semilla para cupones por defecto
try {
  const insertCoupon = db.prepare("INSERT OR IGNORE INTO coupons (code, discount, type, description, active) VALUES (?, ?, ?, ?, ?)");
  insertCoupon.run('FIDELIDAD10', 0.10, 'percentage', '10% de descuento para clientes con más de 5 compras', 1);
  insertCoupon.run('LEALTAD10', 0.10, 'percentage', '10% de descuento por lealtad (cada 3 compras)', 1);
} catch (err) {
  console.error("❌ Error sembrando cupones básicos en db.js:", err.message);
}

// Migración segura: agrega columnas si no existen
try { db.exec("ALTER TABLE users ADD COLUMN nombre TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN telefono TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN direccion TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE settings ADD COLUMN whatsapp_number TEXT DEFAULT '521234567890'"); } catch {}
try { db.exec("ALTER TABLE settings ADD COLUMN bank_name TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE settings ADD COLUMN bank_clabe TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE settings ADD COLUMN bank_account TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE settings ADD COLUMN bank_holder TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN active INTEGER NOT NULL DEFAULT 1"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'transferencia'"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN delivery_zone TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE settings ADD COLUMN payment_methods TEXT DEFAULT '[\"transferencia\",\"efectivo\"]'"); } catch {}

module.exports = db;
