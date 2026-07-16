/**
 * Bot de WhatsApp — Lúa Beauty
 *
 * Conecta el WhatsApp del negocio usando whatsapp-web.js, mantiene
 * un estado de conversación persistente en disco por chat,
 * y delega toda la lógica de "qué responder" a conversationHandler.js.
 *
 * Primer uso:
 *   npm install
 *   npm start
 *   (escanea el QR que aparece en la terminal con WhatsApp > Dispositivos vinculados)
 */

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

const api = require("./api");
const { handleMessage } = require("./conversationHandler");

const STATE_FILE = path.join(__dirname, ".bot-state.json");

// Estado de conversación por chat, persistido en disco.
// Para alta concurrencia (>1000 chats activos), migrar a Redis.
let estados = new Map();

function cargarEstado() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf-8");
      const obj = JSON.parse(raw);
      estados = new Map(Object.entries(obj));
      console.log(`📦 Estado restaurado: ${estados.size} conversaci${estados.size === 1 ? 'ón' : 'ones'}`);
    }
  } catch (err) {
    console.warn("⚠️  No se pudo cargar el estado persistido, empezando fresco:", err.message);
    estados = new Map();
  }
}

function guardarEstado() {
  try {
    const obj = Object.fromEntries(estados);
    fs.writeFileSync(STATE_FILE, JSON.stringify(obj), "utf-8");
  } catch (err) {
    console.error("❌ Error guardando estado:", err.message);
  }
}

function guardarEstadoDebounced() {
  clearTimeout(guardarEstado._timer);
  guardarEstado._timer = setTimeout(guardarEstado, 2000);
}

cargarEstado();

// Guardado periódico cada 30s por si el proceso crashea
setInterval(guardarEstado, 30000);

// Cola de mensajes: evita saturar la conexión de WhatsApp cuando llegan
// muchos mensajes simultáneos. Procesa 1 mensaje a la vez globalmente.
const messageQueue = [];
let processing = false;

function enqueueMessage(msg) {
  messageQueue.push(msg);
  processQueue();
}

async function processQueue() {
  if (processing || messageQueue.length === 0) return;
  processing = true;

  const msg = messageQueue.shift();
  try {
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const chatId = msg.from;
    const cleanPhone = chatId.split('@')[0];
    const estadoActual = estados.get(chatId) || { paso: "inicio" };

    const { respuesta, nuevoEstado, imagenesToSend } = await handleMessage(msg.body, estadoActual, api, cleanPhone);
    estados.set(chatId, nuevoEstado);
    guardarEstadoDebounced();
    await msg.reply(respuesta);

    if (imagenesToSend && imagenesToSend.length > 0) {
      for (const img of imagenesToSend) {
        if (img.url) {
          try {
            console.log(`Enviando imagen para producto "${img.name}" de la URL: ${img.url}`);
            const media = await MessageMedia.fromUrl(img.url);
            await client.sendMessage(chatId, media, { caption: `Imagen de: *${img.name}*` });
          } catch (errImg) {
            console.error(`Error al enviar imagen para ${img.name}:`, errImg.message);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error procesando mensaje de ${msg.from}:`, err);
    try {
      await msg.reply("Tuvimos un problema inesperado. Intenta de nuevo en un momento 🙏");
    } catch (_) {}
  } finally {
    processing = false;
    processQueue();
  }
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("Escanea este código QR con WhatsApp (Dispositivos vinculados):\n");
  qrcode.generate(qr, { small: true });
  // Guardar QR para que el panel admin lo muestre
  try {
    const QR_FILE = path.join(__dirname, ".bot-qr.json");
    fs.writeFileSync(QR_FILE, JSON.stringify({ qr, timestamp: new Date().toISOString() }), "utf-8");
  } catch (err) {
    console.error("No se pudo guardar el QR:", err.message);
  }
});

client.on("ready", () => {
  console.log("✅ Bot de WhatsApp conectado y listo.");
  try {
    const QR_FILE = path.join(__dirname, ".bot-qr.json");
    fs.writeFileSync(QR_FILE, JSON.stringify({ qr: null, connected: true, timestamp: new Date().toISOString() }), "utf-8");
  } catch (_) {}
});

client.on("disconnected", () => {
  try {
    const QR_FILE = path.join(__dirname, ".bot-qr.json");
    const data = JSON.parse(fs.readFileSync(QR_FILE, "utf-8"));
    fs.writeFileSync(QR_FILE, JSON.stringify({ ...data, connected: false, timestamp: new Date().toISOString() }), "utf-8");
  } catch (_) {}
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falló la autenticación de WhatsApp:", msg);
});

client.on("message", (msg) => {
  enqueueMessage(msg);
});

// Guardar estado al salir
process.on("SIGINT", () => {
  console.log("\n🛑 Apagando bot, guardando estado...");
  guardarEstado();
  process.exit(0);
});

process.on("SIGTERM", () => {
  guardarEstado();
  process.exit(0);
});

client.initialize();
