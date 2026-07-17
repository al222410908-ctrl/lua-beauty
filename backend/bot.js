const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

const api = require("./api");
const db = require("./db");
const { handleMessage, esPedidoCheckout } = require("./conversationHandler");

let client = null;
let isBotRunning = false;
let botConnected = false;
let lastQr = null;
let logBuffer = [];
let broadcast = null;

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCIA DE ESTADOS EN SQLite (reemplaza .bot-state.json)
// Ventajas: sin riesgo de EBUSY, sin pérdida de datos en crash, sin bloqueo del
// event-loop (mejor-sqlite3 es síncrono pero muy rápido en writes locales).
// ─────────────────────────────────────────────────────────────────────────────

function cargarEstadoDesdeDB(phone) {
  try {
    const row = db.prepare('SELECT paso, state_data FROM chat_states WHERE phone = ?').get(phone);
    if (!row) return { paso: 'inicio' };
    return { paso: row.paso, ...JSON.parse(row.state_data || '{}') };
  } catch (err) {
    console.error(`❌ Error cargando estado de ${phone}:`, err.message);
    return { paso: 'inicio' };
  }
}

function guardarEstadoEnDB(phone, estado) {
  try {
    const { paso, ...rest } = estado;
    const stateData = JSON.stringify(rest);
    db.prepare(`
      INSERT INTO chat_states (phone, paso, state_data, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(phone) DO UPDATE SET
        paso = excluded.paso,
        state_data = excluded.state_data,
        updated_at = excluded.updated_at
    `).run(phone, paso || 'inicio', stateData);
  } catch (err) {
    console.error(`❌ Error guardando estado de ${phone}:`, err.message);
  }
}

function pauseBot(phone, minutes = 30) {
  const formattedPhone = phone.includes("@") ? phone : `${phone}@c.us`;
  const estado = cargarEstadoDesdeDB(formattedPhone);
  if (minutes > 0) {
    estado.pausedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  } else {
    delete estado.pausedUntil;
  }
  guardarEstadoEnDB(formattedPhone, estado);
  if (broadcast) {
    broadcast({ type: 'bot_status', data: getBotStatus() });
  }
  addLog(`Bot ${minutes > 0 ? `pausado para ${formattedPhone} por ${minutes} min` : `reactivado para ${formattedPhone}`}.`);
}

function isChatPaused(phone) {
  const formattedPhone = phone.includes("@") ? phone : `${phone}@c.us`;
  const estado = cargarEstadoDesdeDB(formattedPhone);
  return !!(estado && estado.pausedUntil && new Date(estado.pausedUntil) > new Date());
}

async function sendManualMessage(phone, text) {
  const formattedPhone = phone.includes("@") ? phone : `${phone}@c.us`;
  if (!client || !botConnected) {
    throw new Error("El bot de WhatsApp no está conectado");
  }
  await client.sendMessage(formattedPhone, text);
  logChatMessage(formattedPhone, 'admin', text);
  pauseBot(formattedPhone, 30);
  addLog(`Mensaje manual enviado a ${formattedPhone}: "${text.substring(0, 30)}..."`);
}

function addLog(text, level = 'info') {
  const timestamp = new Date().toLocaleTimeString('es-CO');
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${text}`;
  logBuffer.push(logEntry);
  if (logBuffer.length > 100) logBuffer.shift();
  console.log(logEntry);
  if (broadcast) {
    broadcast({ type: 'bot_log', data: logEntry });
  }
}

function logChatMessage(phone, sender, message) {
  try {
    db.prepare(`
      INSERT INTO chat_logs (phone, sender, message)
      VALUES (?, ?, ?)
    `).run(phone, sender, message);

    if (broadcast) {
      broadcast({
        type: 'new_chat_message',
        data: { phone, sender, message, timestamp: new Date().toISOString() }
      });
    }
  } catch (err) {
    console.error("❌ Error guardando log de chat:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LIMPIEZA PREVENTIVA DE ARCHIVOS LOCK DE PUPPETEER
// Evita el error EBUSY al reiniciar el proceso si el anterior terminó abruptamente.
// ─────────────────────────────────────────────────────────────────────────────

function limpiarArchivosLock() {
  const authDir = path.join(__dirname, '.wwebjs_auth');
  const lockPatterns = ['LOCK', 'SingletonLock', 'SingletonCookie', 'SingletonSocket'];

  function buscarYEliminar(dir) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          buscarYEliminar(fullPath);
        } else if (lockPatterns.some(pattern => entry.name === pattern || entry.name.endsWith('.lock'))) {
          try {
            fs.unlinkSync(fullPath);
            addLog(`🧹 Archivo de bloqueo eliminado: ${entry.name}`, 'info');
          } catch (e) {
            // Ignorar si no se puede eliminar (otro proceso puede tenerlo)
          }
        }
      }
    } catch (e) {
      // Ignorar errores de lectura de directorio
    }
  }

  buscarYEliminar(authDir);
}

// ─────────────────────────────────────────────────────────────────────────────
// COLA DE MENSAJES
// ─────────────────────────────────────────────────────────────────────────────

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
    logChatMessage(chatId, 'cliente', msg.body);

    const estadoActual = cargarEstadoDesdeDB(chatId);

    // Verificar si el bot está en pausa para esta conversación
    if (estadoActual.pausedUntil && new Date(estadoActual.pausedUntil) > new Date()) {
      addLog(`Mensaje de @${chatId.split('@')[0]} ignorado (bot en pausa hasta ${new Date(estadoActual.pausedUntil).toLocaleTimeString()}).`);
      return;
    }



    addLog(`Procesando mensaje de @${msg.from.split('@')[0]}: "${msg.body}"`);

    const cleanPhone = chatId.split('@')[0];
    const resultado = await handleMessage(msg.body, estadoActual, api, cleanPhone);
    const { respuesta, nuevoEstado, imagenesToSend, ignorado } = resultado;
    
    // Si el mensaje no es relevante para el bot, lo ignoramos silenciosamente
    if (ignorado) {
      addLog(`Mensaje de @${msg.from.split('@')[0]} ignorado (no relevante para el bot).`);
      return;
    }
    
    // Conservar pausedUntil al actualizar estado
    const estadoAGuardar = { ...nuevoEstado, pausedUntil: estadoActual.pausedUntil };
    guardarEstadoEnDB(chatId, estadoAGuardar);

    await msg.reply(respuesta);
    logChatMessage(chatId, 'bot', respuesta);
    addLog(`Respuesta enviada a @${msg.from.split('@')[0]}: "${respuesta.split('\n')[0]}..."`);

    if (imagenesToSend && imagenesToSend.length > 0) {
      for (const img of imagenesToSend) {
        if (img.url) {
          try {
            addLog(`Enviando imagen para producto "${img.name}" desde: ${img.url}`);
            const media = await MessageMedia.fromUrl(img.url);
            await client.sendMessage(chatId, media, { caption: `Imagen de: *${img.name}*` });
          } catch (errImg) {
            addLog(`Error al enviar imagen para ${img.name}: ${errImg.message}`, 'error');
          }
        }
      }
    }
  } catch (err) {
    addLog(`Error procesando mensaje de @${msg.from.split('@')[0]}: ${err.stack || err.message || err}`, 'error');
    try {
      await msg.reply("Tuvimos un problema inesperado. Intenta de nuevo en un momento 🙏");
    } catch (_) {}
  } finally {
    processing = false;
    processQueue();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROL DEL BOT
// ─────────────────────────────────────────────────────────────────────────────

function startBot() {
  if (isBotRunning) {
    addLog("El bot ya se encuentra en ejecución.");
    return;
  }

  isBotRunning = true;
  botConnected = false;
  lastQr = null;

  addLog("Iniciando bot de WhatsApp (Puppeteer)...");

  // Limpiar archivos LOCK antes de iniciar para evitar EBUSY
  limpiarArchivosLock();

  const writeLegacyQRFile = (qr, connected) => {
    try {
      const QR_FILE = path.join(__dirname, ".bot-qr.json");
      fs.writeFileSync(QR_FILE, JSON.stringify({ qr, connected, timestamp: new Date().toISOString() }), "utf-8");
    } catch (_) {}
  };

  writeLegacyQRFile(null, false);

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, ".wwebjs_auth")
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    },
  });

  client.on("qr", (qr) => {
    lastQr = qr;
    addLog("Código QR recibido. Escanea con WhatsApp desde tu móvil.", "info");
    writeLegacyQRFile(qr, false);
    if (broadcast) broadcast({ type: 'bot_status', data: getBotStatus() });
  });

  client.on("ready", () => {
    botConnected = true;
    lastQr = null;
    addLog("✅ Bot de WhatsApp conectado y listo.", "success");

    try {
      const myNumber = client.info?.wid?.user || client.info?.me?.user;
      if (myNumber) {
        addLog(`[AUTO-DETECCIÓN] Teléfono vinculado: +${myNumber}`, 'success');
        db.prepare("UPDATE settings SET whatsapp_number = ? WHERE id = 1").run(myNumber);
      }
    } catch (err) {
      addLog(`No se pudo guardar número telefónico: ${err.message}`, 'warning');
    }

    writeLegacyQRFile(null, true);
    if (broadcast) broadcast({ type: 'bot_status', data: getBotStatus() });
  });

  client.on("disconnected", async (reason) => {
    botConnected = false;
    lastQr = null;
    addLog(`❌ Bot de WhatsApp desconectado (${reason || 'unknown reason'}).`, "warning");
    writeLegacyQRFile(null, false);
    if (broadcast) broadcast({ type: 'bot_status', data: getBotStatus() });

    // Destruir el browser antes de que el retry intente crear uno nuevo
    // (evita "browser is already running for userDataDir" error)
    const oldClient = client;
    client = null;
    isBotRunning = false;
    try {
      if (oldClient) await oldClient.destroy();
    } catch (_) {}

    limpiarArchivosLock();

    // Auto-reconectar tras 5 segundos si la desconexion no fue voluntaria
    if (reason !== 'LOGOUT') {
      addLog('🔄 Reconectando bot en 5 segundos...', 'info');
      setTimeout(() => {
        if (!isBotRunning && !botConnected) startBot();
      }, 5000);
    }
  });

  client.on("auth_failure", async (msg) => {
    addLog(`❌ Falló la autenticación de WhatsApp: ${msg}`, "error");
    const oldClient = client;
    client = null;
    isBotRunning = false;
    botConnected = false;
    try {
      if (oldClient) await oldClient.destroy();
    } catch (_) {}
    limpiarArchivosLock();
    if (broadcast) broadcast({ type: 'bot_status', data: getBotStatus() });
  });


  client.on("message", (msg) => {
    enqueueMessage(msg);
  });

  client.initialize().catch(async (err) => {
    addLog(`❌ Error al inicializar cliente: ${err.message}. Reintentando en 10 segundos...`, 'error');
    const oldClient = client;
    client = null;
    isBotRunning = false;
    botConnected = false;
    lastQr = null;

    try {
      if (oldClient) await oldClient.destroy();
    } catch (_) {}

    limpiarArchivosLock();
    if (broadcast) broadcast({ type: 'bot_status', data: getBotStatus() });
    
    // Auto-reintento de inicialización
    setTimeout(() => {
      if (!isBotRunning && !botConnected) {
        addLog("🔄 Reintentando inicializar bot de WhatsApp...");
        startBot();
      }
    }, 10000);
  });
}

function stopBot() {
  addLog("Deteniendo bot de WhatsApp...");
  isBotRunning = false;
  botConnected = false;
  lastQr = null;

  const oldClient = client;
  client = null;
  if (broadcast) broadcast({ type: 'bot_status', data: getBotStatus() });

  if (oldClient) {
    oldClient.destroy().then(() => {
      addLog("Bot de WhatsApp apagado correctamente.");
      limpiarArchivosLock();
    }).catch(err => {
      addLog(`Error deteniendo el cliente: ${err.message}`, 'error');
      limpiarArchivosLock();
    });
  }
}

async function forceStop() {
  addLog("🚨 Forzando cierre del bot y limpieza de sesión...", 'warning');
  isBotRunning = false;
  botConnected = false;
  lastQr = null;

  const oldClient = client;
  client = null;

  try {
    if (oldClient) await oldClient.destroy();
  } catch (_) {}

  limpiarArchivosLock();
  if (broadcast) broadcast({ type: 'bot_status', data: getBotStatus() });
  addLog("✅ Bot limpiado. Puedes reiniciarlo manualmente.", 'success');
}

function logoutBot() {
  if (!client) {
    addLog("No hay una sesión activa para desvincular.", 'warning');
    // Intentar limpiar de todas formas
    forceStop();
    return;
  }
  addLog("Cerrando sesión y desvinculando dispositivo de WhatsApp...");
  client.logout().then(() => {
    addLog("Sesión desvinculada con éxito. Deteniendo bot...");
    stopBot();
  }).catch(err => {
    addLog(`Error al cerrar sesión: ${err.message}. Forzando apagado...`, 'warning');
    forceStop();
  });
}

function getBotStatus() {
  return {
    connected: botConnected,
    qr: lastQr,
    active: isBotRunning,
    logs: logBuffer
  };
}

function initBot(broadcastFn) {
  broadcast = broadcastFn;

  // Reportar cuántos estados de chat hay en DB al arrancar
  try {
    const count = db.prepare('SELECT COUNT(*) as c FROM chat_states').get().c;
    addLog(`Estado de chatbot cargado desde DB: ${count} chat(s) registrado(s).`);
  } catch (_) {}

  startBot();
}

async function getGroups() {
  if (!client || !botConnected) {
    throw new Error("El bot de WhatsApp no está conectado");
  }
  const chats = await client.getChats();
  const groups = chats.filter(chat => chat.isGroup);
  return groups.map(g => ({
    id: g.id._serialized,
    name: g.name || g.id.user,
    participantsCount: g.participants ? g.participants.length : 0
  }));
}

async function sendGroupMessage(groupId, text) {
  if (!client || !botConnected) {
    throw new Error("El bot de WhatsApp no está conectado");
  }
  await client.sendMessage(groupId, text);
  addLog(`Mensaje grupal enviado a ${groupId}: "${text.substring(0, 30)}..."`);
}

module.exports = {
  initBot,
  startBot,
  stopBot,
  forceStop,
  logoutBot,
  getBotStatus,
  pauseBot,
  isChatPaused,
  sendManualMessage,
  getGroups,
  sendGroupMessage
};


