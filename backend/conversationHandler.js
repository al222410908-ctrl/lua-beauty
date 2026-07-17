/**
 * Máquina de estados de la conversación.
 *
 * Se mantiene completamente separada de whatsapp-web.js a propósito:
 * `handleMessage` es una función pura (recibe texto + estado + api,
 * devuelve respuesta + nuevo estado) para poder probarla sin necesidad
 * de tener WhatsApp conectado. `index.js` es la única pieza que conoce
 * whatsapp-web.js.
 */

const db = require('./db');
const axios = require('axios');

async function preguntarGemini(textoUsuario) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    // 1. Obtener productos activos de la DB
    const productos = db.prepare('SELECT nombre, descripcion, precio, stock, categoria FROM products WHERE active = 1').all();
    const listadoProductos = productos.map(p => 
      `- ${p.nombre} (${p.categoria}): $${p.precio} MXN. Stock: ${p.stock}. Descripción: ${p.descripcion || 'Sin descripción'}`
    ).join('\n');

    // 2. Zonas de entrega
    const zonas = db.prepare('SELECT nombre FROM delivery_zones WHERE active = 1').all();
    const listadoZonas = zonas.map(z => z.nombre).join(', ');

    // 3. Settings bancarios y generales
    const settings = db.prepare('SELECT bank_name, bank_clabe, bank_account, bank_holder, welcome_message, address FROM settings LIMIT 1').get() || {};

    const systemInstruction = 
      `Eres la asistente de chat inteligente de la tienda "Lúa Beauty" (Maquillaje Orgánico & Cuidado de Piel).\n` +
      `Responde a las clientas con amabilidad, emojis hermosos (✨, 💖, 🌸, 💄, 🌿), y con respuestas breves y directas (ideales para WhatsApp).\n\n` +
      `INFORMACIÓN EN TIEMPO REAL DE NUESTRA TIENDA:\n` +
      `- Inventario de Productos en Stock:\n${listadoProductos}\n\n` +
      `- Zonas de entrega gratuita (sin costo de envío): ${listadoZonas || '🏫 Kinder de Rinconada, 🏪 Kiosco de Villa, 🏪 Kiosco de Xona, 📍 Zolotepec'}.\n` +
      `- Métodos de pago aceptados: Pago en efectivo al recibir tu pedido, o Transferencia Bancaria.\n` +
      `- Información para Transferencias Bancarias:\n` +
      `  Banco: ${settings.bank_name || 'N/A'}\n` +
      `  CLABE: ${settings.bank_clabe || 'N/A'}\n` +
      `  Cuenta: ${settings.bank_account || 'N/A'}\n` +
      `  Titular: ${settings.bank_holder || 'N/A'}\n` +
      `- WhatsApp de Contacto Humano (Rocío): +52 5620788791\n` +
      `- Dirección de tienda física (si aplica): ${settings.address || 'N/A'}.\n\n` +
      `REGLAS DEL CHATBOT:\n` +
      `1. Mantén tus respuestas en un tono muy cercano, profesional y conciso (máximo 2 párrafos cortos).\n` +
      `2. Responde las preguntas de stock y precios basándote estrictamente en el Inventario provisto arriba. Si no encuentras un producto o su stock es 0, di amablemente que no está disponible por el momento.\n` +
      `3. Si te preguntan cómo comprar, explica que pueden visitar nuestro Catálogo Virtual en https://luabeauty.duckdns.org/ y hacer su pedido desde el carrito, o bien escribir la palabra *menu* aquí mismo en el chat para usar nuestro sistema automatizado de compras por WhatsApp.\n` +
      `4. Si te preguntan por cupones de descuento, indícales que pueden escribir la palabra *cupon* seguido del código (ej. "cupon BIENVENIDA") para activarlo en su chat.\n` +
      `5. NO inventes productos ni precios que no estén en la lista.\n`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nPregunta de la clienta: "${textoUsuario}"\n\nRespuesta corta de Lúa Beauty:` }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 300
      }
    };

    const res = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply ? reply.trim() : null;
  } catch (err) {
    console.error("⚠️ Error llamando a la API de Gemini:", err.response?.data || err.message);
    return null;
  }
}

/**
 * Carga las categorías dinámicamente desde la base de datos.
 * Devuelve un objeto indexado: { "1": { slug, nombre }, "2": ... }
 * Así, agregar una nueva categoría al inventario la hace disponible
 * automáticamente en el bot sin requerir cambios de código.
 */
function cargarCategorias() {
  try {
    const rows = db.prepare(
      "SELECT DISTINCT categoria FROM products WHERE active = 1 AND stock > 0 ORDER BY categoria"
    ).all();
    const categorias = {};
    rows.forEach((row, idx) => {
      const slug = row.categoria;
      // Capitalizar primer letra para mostrar al usuario
      const nombre = slug.charAt(0).toUpperCase() + slug.slice(1);
      categorias[String(idx + 1)] = { slug, nombre };
    });
    return categorias;
  } catch (err) {
    console.error('⚠️ Error cargando categorías desde DB:', err.message);
    // Fallback: categorías base por si la DB no responde
    return {
      "1": { slug: "rimels", nombre: "Rímels" },
      "2": { slug: "bases", nombre: "Bases" },
      "3": { slug: "skincare", nombre: "Skincare" },
    };
  }
}

function getFullImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const baseUrl = process.env.API_URL || 'http://127.0.0.1:3000';
  return `${baseUrl}/${cleanUrl}`;
}

const TRIGGERS_INICIO = ["menu", "menú", "catalogo", "catálogo"];

function esSaludo(texto) {
  const limpio = normalizar(texto);
  return TRIGGERS_INICIO.some((t) => limpio === t);
}

function esPedidoCheckout(texto) {
  return texto && (texto.includes("🛒 *Nuevo Pedido - Lúa Beauty*") || texto.includes("Nuevo Pedido - Lúa Beauty"));
}

/**
 * Determina si un mensaje es relevante para el bot según el estado actual.
 * Si no lo es, el bot lo ignora completamente (no interfiere en chats personales).
 */
function esMensajeRelevante(texto, estado) {
  if (!texto || !texto.trim()) return false;
  const limpio = normalizar(texto);
  const paso = estado?.paso || 'inicio';

  // — Triggers globales: siempre responden —
  if (esSaludo(texto)) return true;
  if (esPedidoCheckout(texto)) return true;
  if (limpio === 'menu' || limpio === 'menú') return true;
  if (limpio.startsWith('cupon') || limpio.startsWith('coupon')) return true;

  // — Triggers según el paso actual de la conversación —
  if (paso === 'menu') {
    // Número de categoría o palabra "ayuda"
    return /^\d+$/.test(limpio) || limpio === 'ayuda' || limpio === 'help' || limpio === 'soporte';
  }

  if (paso === 'eligiendo_producto') {
    // Número de producto
    return /^\d+$/.test(limpio);
  }

  if (paso === 'eligiendo_cantidad') {
    // Cantidad numérica o "cancelar"
    return /^\d+$/.test(limpio) || limpio === 'cancelar';
  }

  if (paso === 'confirmando_pedido') {
    // Confirmación o cancelación
    return ['si', 'sí', 's', 'no', 'n', 'confirmar', 'cancelar'].includes(limpio);
  }

  if (paso === 'eligiendo_pago') {
    const l = normalizar(texto);
    return ['1', '2', 'efectivo', 'transferencia'].includes(l);
  }

  if (paso === 'eligiendo_zona') {
    return /^\d+$/.test(normalizar(texto)) || normalizar(texto) === 'cancelar';
  }

  return false;
}

function normalizar(texto) {
  return (texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos para comparar mejor
}

function mensajeBienvenida(settings, categorias) {
  const emojisNumerales = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  const categoriesList = Object.entries(categorias)
    .map(([num, cat]) => `${emojisNumerales[parseInt(num) - 1] || num + '.'} ${cat.nombre}`)
    .join('\n');

  const defaultWelcome =
    "✨ *Bienvenida a Lúa Beauty* ✨\n\n" +
    "Elige una categoría escribiendo el número:\n\n" +
    categoriesList +
    "\n\nEscribe *menu* en cualquier momento para volver aquí.";

  if (!settings || !settings.welcome_message) {
    return defaultWelcome;
  }
  return settings.welcome_message.replace("{categories}", categoriesList);
}

function formatearListaProductos(productos, nombreCategoria) {
  if (productos.length === 0) {
    return (
      `Por ahora no tenemos *${nombreCategoria}* en stock 💔\n` +
      "Escribe *menu* para ver otras categorías."
    );
  }
  const lineas = productos.map(
    (p, i) => `${i + 1}️⃣ ${p.nombre} — $${p.precio.toLocaleString("es-MX")} (${p.stock} disp.)`
  );
  return (
    `Esto tenemos en *${nombreCategoria}*:\n\n` +
    lineas.join("\n") +
    "\n\nResponde con el *número* del producto que quieres apartar, o escribe *menu* para volver."
  );
}

/**
 * Procesa un mensaje entrante dado el estado actual de la conversación.
 *
 * @param {string} texto - mensaje crudo del usuario
 * @param {object} estado - { paso: 'menu'|'eligiendo_producto', categoria?, productos? }
 * @param {object} api - { getProductosPorCategoria, restarStock, getSettings } (ver api.js)
 * @returns {Promise<{ respuesta: string, nuevoEstado: object }>}
 */
async function handleMessage(texto, estado, api, phone = null) {
  const estadoActual = estado || { paso: "inicio" };

  // ─── Filtro de relevancia ──────────────────────────────────────────────
  // Si el mensaje no coincide con ningún patrón esperado, el bot lo ignora
  // por completo para no intervenir en conversaciones personales.
  if (!esMensajeRelevante(texto, estadoActual)) {
    if ((estadoActual.paso === 'inicio' || estadoActual.paso === 'menu') && process.env.GEMINI_API_KEY) {
      try {
        const respuestaGemini = await preguntarGemini(texto);
        if (respuestaGemini) {
          return { respuesta: respuestaGemini, nuevoEstado: { paso: 'menu' } };
        }
      } catch (errGemini) {
        console.error("⚠️ Falló la llamada a Gemini:", errGemini.message);
      }
    }
    return { ignorado: true, respuesta: '', nuevoEstado: estadoActual };
  }
  // ────────────────────────────────────────────────────────────────────────

  // Cargar categorías dinámicamente en cada mensaje para reflejar cambios del inventario
  const CATEGORIAS = cargarCategorias();

  let settings = null;
  try {
    settings = await api.getSettings();
  } catch (err) {
    console.error("⚠️ Error consultando settings en chatbot:", err.message);
  }

  // Lógica de cupones vía chat
  const normalizado = normalizar(texto);
  const couponMatch = normalizado.match(/^(?:cupon|coupon)\s+(\w+)/);
  if (couponMatch) {
    const couponCode = couponMatch[1].toUpperCase();
    try {
      const coupon = await api.getCoupon(couponCode, phone);
      if (coupon && coupon.active) {
        const desc = coupon.type === 'percentage' 
          ? `${coupon.discount * 100}% de descuento`
          : `$${coupon.discount.toLocaleString("es-MX")} de descuento`;
        
        return {
          respuesta: `✅ *¡Cupón ${couponCode} aplicado con éxito!* (${desc}).\n\nEl descuento se aplicará al total de tu próximo pedido. Escribe *menu* para ver el catálogo.`,
          nuevoEstado: { ...estadoActual, coupon }
        };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || `El cupón *${couponCode}* no existe o está inactivo.`;
      return {
        respuesta: `❌ *Error al aplicar cupón:* ${errorMsg}`,
        nuevoEstado: estadoActual
      };
    }
  }

  if (esPedidoCheckout(texto)) {
    const regex = /•\s+(.+?)\s+x(\d+)\s+\(ID:\s*([^)]+)\)/g;
    const matches = [...texto.matchAll(regex)];

    if (matches.length === 0) {
      return {
        respuesta: "Recibí un intento de pedido pero no pude leer los productos 🙈 Escribe *menu* para ir al catálogo.",
        nuevoEstado: { paso: "menu" }
      };
    }

    const confirmados = [];
    const fallidos = [];
    const items = [];
    const imagenesToSend = [];
    let subtotal = 0;

    for (const match of matches) {
      const [_, name, quantityStr, id] = match;
      const cantidad = parseInt(quantityStr, 10);
      try {
        const prod = await api.restarStock(id, cantidad);
        confirmados.push({ name, cantidad });
        items.push({
          productId: id,
          nombre: prod.nombre,
          precio: prod.precio,
          quantity: cantidad
        });
        subtotal += prod.precio * cantidad;
        if (prod.url_imagen) {
          imagenesToSend.push({
            url: getFullImageUrl(prod.url_imagen),
            name: prod.nombre
          });
        }
      } catch (err) {
        console.error(`Error restando stock para ${name} (${id}):`, err?.message);
        fallidos.push({ name, cantidad });
      }
    }

    if (items.length > 0 && phone) {
      try {
        let discount = 0;
        const discountMatch = texto.match(/\*Descuento:\*\s*-?\$?([\d.,]+)/i);
        if (discountMatch) {
          discount = parseFloat(discountMatch[1].replace(/[^\d]/g, '')) || 0;
        }
        const total = Math.max(0, subtotal - discount);

        await api.crearPedidoChatbot({
          phone,
          items,
          subtotal,
          discount,
          total,
          coupon: null,
          skipDeduct: true
        });
      } catch (errOrder) {
        console.error("Error al registrar orden de chatbot desde web checkout:", errOrder.message);
      }
    }

    let respuesta = "🛍️ *¡Pedido Recibido!* 🛍️\n\nHemos registrado tu orden desde la web:\n\n";
    if (confirmados.length > 0) {
      respuesta += "*Productos apartados:*\n";
      confirmados.forEach(c => {
        respuesta += `✅ ${c.name} x${c.cantidad}\n`;
      });
    }
    if (fallidos.length > 0) {
      respuesta += "\n*No pudimos apartar (sin stock o no disponible):*\n";
      fallidos.forEach(f => {
        respuesta += `❌ ${f.name} x${f.cantidad}\n`;
      });
    }

    respuesta += `\n¿Cómo prefieres pagar?\n\n1️⃣ *Efectivo*\n2️⃣ *Transferencia bancaria*\n\nResponde *1* o *2*.`;

    return {
      respuesta,
      nuevoEstado: {
        paso: 'eligiendo_pago',
        pedidoPendiente: { items, subtotal, discount: 0, fromWeb: true }
      },
      imagenesToSend
    };
  }

  // "menu" siempre resetea la conversación, sin importar en qué paso esté.
  if (esSaludo(texto) || estadoActual.paso === "inicio") {
    return { respuesta: mensajeBienvenida(settings, CATEGORIAS), nuevoEstado: { paso: "menu" } };
  }

  if (estadoActual.paso === "menu") {
    const categoria = CATEGORIAS[texto.trim()];
    if (!categoria) {
      const limpio = normalizar(texto);
      if (limpio === "ayuda" || limpio === "help" || limpio === "soporte") {
        const ayudaText = settings?.help_message || "Para recibir asistencia escribe tu consulta directamente. Un agente humano te responderá.";
        return {
          respuesta: ayudaText + "\n\nEscribe *menu* para volver.",
          nuevoEstado: estadoActual
        };
      }
      return {
        respuesta: "No reconocí esa opción 🙈 Responde con *1*, *2* o *3*, o escribe *ayuda* para recibir soporte.",
        nuevoEstado: estadoActual,
      };
    }

    let productos;
    try {
      productos = await api.getProductosPorCategoria(categoria.slug);
    } catch (err) {
      return {
        respuesta: "Tuvimos un problema consultando el catálogo. Intenta de nuevo en un momento 🙏",
        nuevoEstado: { paso: "menu" },
      };
    }

    return {
      respuesta: formatearListaProductos(productos, categoria.nombre),
      nuevoEstado: { paso: "eligiendo_producto", categoria: categoria.slug, productos },
    };
  }

  if (estadoActual.paso === "eligiendo_producto") {
    const indice = parseInt(texto.trim(), 10) - 1;
    const productos = estadoActual.productos || [];
    const elegido = productos[indice];

    if (!elegido) {
      return {
        respuesta:
          "No identifiqué ese producto 🙈 Responde con el número de la lista o escribe *menu* para volver.",
        nuevoEstado: estadoActual,
      };
    }

    const imagenesToSend = [];
    if (elegido.url_imagen) {
      imagenesToSend.push({
        url: getFullImageUrl(elegido.url_imagen),
        name: elegido.nombre
      });
    }

    return {
      respuesta:
        `¿Cuántas unidades de *${elegido.nombre}* deseas apartar?\n\n` +
        `Escribe el número de unidades (ej. 2) o escribe *cancelar* para volver al menú.`,
      nuevoEstado: {
        paso: "eligiendo_cantidad",
        productoElegido: elegido,
        categoria: estadoActual.categoria,
        productos: estadoActual.productos
      },
      imagenesToSend
    };
  }

  if (estadoActual.paso === "eligiendo_cantidad") {
    const limpio = normalizar(texto);
    const elegido = estadoActual.productoElegido;

    if (limpio === "cancelar") {
      return {
        respuesta: "Pedido cancelado. Escribe *menu* para ver el catálogo.",
        nuevoEstado: { paso: "menu" }
      };
    }

    const cantidad = parseInt(texto.trim(), 10);
    if (isNaN(cantidad) || cantidad < 1) {
      return {
        respuesta: "Escribe una cantidad válida (número entero de 1 o más) o escribe *cancelar*.",
        nuevoEstado: estadoActual
      };
    }

    if (elegido.stock < cantidad) {
      return {
        respuesta:
          `Lo sentimos, solo tenemos *${elegido.stock}* unidades disponibles de *${elegido.nombre}* en stock.\n\n` +
          `Por favor responde con una cantidad menor o escribe *cancelar* para volver.`,
        nuevoEstado: estadoActual
      };
    }

    const total = elegido.precio * cantidad;
    return {
      respuesta:
        `🛍️ *Resumen del Pedido* 🛍️\n\n` +
        `• Producto: *${elegido.nombre}*\n` +
        `• Cantidad: *${cantidad}*\n` +
        `• Total: *$${total.toLocaleString("es-MX")}*\n\n` +
        `¿Confirmas el apartado de este pedido? Responde *SI* para confirmar o *NO* para cancelar.`,
      nuevoEstado: {
        paso: "confirmando_pedido",
        productoElegido: elegido,
        cantidad,
        categoria: estadoActual.categoria
      }
    };
  }

  if (estadoActual.paso === "confirmando_pedido") {
    const limpio = normalizar(texto);
    const elegido = estadoActual.productoElegido;
    const cantidad = estadoActual.cantidad;

    if (limpio === "si" || limpio === "sí" || limpio === "confirmar" || limpio === "s") {
      try {
        const resultado = await api.restarStock(elegido.id, cantidad);
        
        if (phone) {
          try {
            const subtotal = elegido.precio * cantidad;
            let discount = 0;
            let couponCode = null;
            if (estadoActual.coupon) {
              couponCode = estadoActual.coupon.code;
              if (estadoActual.coupon.type === 'percentage') {
                discount = subtotal * estadoActual.coupon.discount;
              } else {
                discount = estadoActual.coupon.discount;
              }
            }
            const total = Math.max(0, subtotal - discount);

            const items = [{
              productId: elegido.id,
              nombre: elegido.nombre,
              precio: elegido.precio,
              quantity: cantidad
            }];

            await api.crearPedidoChatbot({
              phone,
              items,
              subtotal,
              discount,
              total,
              coupon: couponCode,
              skipDeduct: true
            });
          } catch (errOrder) {
            console.error("Error al crear registro de orden en chat checkout:", errOrder.message);
          }
        }

        const indicaciones = settings?.indications || "Pronto te contactamos para confirmar el pago y el envío.";
        const imagenesToSend = [];
        if (resultado.url_imagen) {
          imagenesToSend.push({
            url: getFullImageUrl(resultado.url_imagen),
            name: resultado.nombre
          });
        }
        return {
          respuesta:
            `✅ *¡Pedido apartado!* \n\n` +
            `• Producto: *${resultado.nombre}* x${cantidad}\n\n` +
            `¿Cómo prefieres pagar?\n\n` +
            `1️⃣ *Efectivo*\n` +
            `2️⃣ *Transferencia bancaria*\n\n` +
            `Responde *1* o *2*.`,
          nuevoEstado: {
            paso: 'eligiendo_pago',
            pedidoPendiente: {
              items: [{ productId: elegido.id, nombre: elegido.nombre, precio: elegido.precio, quantity: cantidad }],
              subtotal: elegido.precio * cantidad,
              discount: estadoActual.coupon ? (estadoActual.coupon.type === 'percentage' ? (elegido.precio * cantidad * estadoActual.coupon.discount) : estadoActual.coupon.discount) : 0,
              fromWeb: false
            },
            coupon: estadoActual.coupon
          },
          imagenesToSend
        };
      } catch (err) {
        const detalle = err?.response?.data?.detail;
        if (err?.response?.status === 400) {
          return {
            respuesta: `Justo se nos agotó ese producto 😢 ${detalle || ""}\nEscribe *menu* para ver otras opciones.`,
            nuevoEstado: { paso: "menu" },
          };
        }
        return {
          respuesta: "No pudimos confirmar tu pedido por un error técnico. Intenta de nuevo en un momento 🙏",
          nuevoEstado: { paso: "menu" },
        };
      }
    } else if (limpio === "no" || limpio === "n" || limpio === "cancelar") {
      return {
        respuesta: "Pedido cancelado ❌ Escribe *menu* si quieres ver de nuevo el catálogo.",
        nuevoEstado: { paso: "menu" }
      };
    } else {
      return {
        respuesta: "No comprendí tu respuesta 🙈 Responde *SI* para confirmar tu pedido o *NO* para cancelar.",
        nuevoEstado: estadoActual
      };
    }
  }

  // ─── Paso: Elección de método de pago ───────────────────────────────────
  if (estadoActual.paso === 'eligiendo_pago') {
    const limpio = normalizar(texto);
    const esEfectivo = limpio === '1' || limpio === 'efectivo';
    const esTransferencia = limpio === '2' || limpio === 'transferencia';

    if (!esEfectivo && !esTransferencia) {
      return {
        respuesta: 'No reconocí tu elección 🙈 Responde *1* para Efectivo o *2* para Transferencia.',
        nuevoEstado: estadoActual
      };
    }

    // Cargar zonas de entrega activas
    let zonas = [];
    try {
      const db = require('./db');
      zonas = db.prepare("SELECT id, nombre FROM delivery_zones WHERE active = 1 ORDER BY sort_order, id").all();
    } catch (err) {
      console.error('Error cargando zonas de entrega:', err.message);
    }

    const zonasList = zonas.length > 0
      ? zonas.map((z, i) => `${i + 1}️⃣ *${z.nombre}*`).join('\n')
      : '1️⃣ *Recoger en tienda*';

    let mensajePago = '';
    if (esEfectivo) {
      mensajePago = `✅ *¡Perfecto! Pagarás en efectivo.*\n\nTu pedido está apartado. Te contactaremos para coordinar la entrega.\n\n`;
    } else {
      // Leer datos bancarios de la base de datos
      let bankInfo = '';
      try {
        const db = require('./db');
        const s = db.prepare("SELECT bank_name, bank_clabe, bank_account, bank_holder FROM settings WHERE id = 1").get();
        if (s && (s.bank_name || s.bank_clabe || s.bank_account)) {
          bankInfo +=
            `🏦 *Datos para transferencia:*\n` +
            (s.bank_holder ? `👤 Titular: *${s.bank_holder}*\n` : '') +
            (s.bank_name ? `🏛️ Banco: *${s.bank_name}*\n` : '') +
            (s.bank_clabe ? `🔢 CLABE: *${s.bank_clabe}*\n` : '') +
            (s.bank_account ? `💳 Cuenta: *${s.bank_account}*\n` : '');
        } else {
          bankInfo = `🏦 *Datos bancarios:* Serán proporcionados por nuestro equipo.\n`;
        }
      } catch (err) {
        bankInfo = `🏦 *Datos bancarios:* Serán proporcionados por nuestro equipo.\n`;
      }
      mensajePago =
        `✅ *¡Excelente! Pagarás por transferencia.*\n\n` +
        bankInfo +
        `\nUna vez que recibamos tu comprobante de pago, procederemos con la entrega. Por favor envíanos la captura de tu transferencia.\n\n`;
    }

    return {
      respuesta:
        mensajePago +
        `¿Dónde prefieres recibir tu pedido?\n\n` +
        zonasList +
        `\n\nResponde con el *número* de tu zona.`,
      nuevoEstado: {
        paso: 'eligiendo_zona',
        metodoPago: esEfectivo ? 'efectivo' : 'transferencia',
        pedidoPendiente: estadoActual.pedidoPendiente,
        coupon: estadoActual.coupon,
        zonas
      }
    };
  }
  // ────────────────────────────────────────────────────────────────────────

  // ─── Paso: Elección de zona de entrega ──────────────────────────────────
  if (estadoActual.paso === 'eligiendo_zona') {
    const limpio = normalizar(texto);
    if (limpio === 'cancelar') {
      return {
        respuesta: 'Pedido cancelado ❌ Escribe *menu* para ver el catálogo.',
        nuevoEstado: { paso: 'menu' }
      };
    }

    const zonas = estadoActual.zonas || [];
    const indiceZona = parseInt(texto.trim(), 10) - 1;
    const zonaElegida = zonas[indiceZona];

    if (!zonaElegida && zonas.length > 0) {
      const zonasList = zonas.map((z, i) => `${i + 1}️⃣ *${z.nombre}*`).join('\n');
      return {
        respuesta: `No reconocí esa opción 🙈 Elige un número de la lista:\n\n${zonasList}`,
        nuevoEstado: estadoActual
      };
    }

    const zonaNombre = zonaElegida?.nombre || 'En tienda';
    const metodoPago = estadoActual.metodoPago || 'efectivo';
    const indicaciones = settings?.indications || 'Nos pondremos en contacto contigo para coordinar la entrega.';

    const mensajeFinal =
      `🎉 *¡Todo listo, tu pedido está confirmado!*\n\n` +
      `📦 Zona de entrega: *${zonaNombre}*\n` +
      `💳 Método de pago: *${metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia bancaria'}*\n\n` +
      `${indicaciones}\n\n` +
      `¡Muchas gracias por elegirnos! ❤️ Escribe *menu* si deseas ver algo más.`;

    return {
      respuesta: mensajeFinal,
      nuevoEstado: { paso: 'menu' }
    };
  }
  // ────────────────────────────────────────────────────────────────────────

  // Estado desconocido: reiniciar de forma segura.
  return { respuesta: mensajeBienvenida(settings, CATEGORIAS), nuevoEstado: { paso: "menu" } };
}

module.exports = { handleMessage, cargarCategorias, mensajeBienvenida, formatearListaProductos, esPedidoCheckout };
