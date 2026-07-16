/**
 * Cliente delgado sobre la API del servidor Express.
 * Centraliza todas las llamadas HTTP para que el resto del bot
 * no sepa nada de URLs ni de axios.
 */

const axios = require("axios");

const RAW_URL = (process.env.API_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const API_BASE_URL = RAW_URL.startsWith("http://") || RAW_URL.startsWith("https://")
  ? RAW_URL
  : `https://${RAW_URL}`;

if (API_BASE_URL.startsWith("http://") && !API_BASE_URL.includes("127.0.0.1") && !API_BASE_URL.includes("localhost")) {
  console.warn("⚠️  API_BASE_URL usa HTTP en una dirección que no es localhost. Considera usar HTTPS.");
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: process.env.CHATBOT_API_KEY
    ? { 'X-API-Key': process.env.CHATBOT_API_KEY }
    : {},
});

/**
 * Trae los productos disponibles (stock > 0) de una categoría.
 * @param {string} categoria
 * @returns {Promise<Array>}
 */
async function getProductosPorCategoria(categoria) {
  const { data } = await client.get(`/api/products/categoria/${encodeURIComponent(categoria)}`);
  return data;
}

/**
 * Descuenta stock de un producto. Lanza un error con .response.data.detail
 * si el backend rechaza la operación (producto inexistente o sin stock suficiente).
 * @param {string} productoId
 * @param {number} cantidad
 */
async function restarStock(productoId, cantidad) {
  const { data } = await client.post("/api/products/restar-stock", {
    producto_id: productoId,
    cantidad,
  });
  return data;
}

/**
 * Trae la configuración del chatbot del servidor.
 * @returns {Promise<Object>}
 */
async function getSettings() {
  const { data } = await client.get("/api/settings");
  return data;
}

/**
 * Crea un pedido de chatbot en el servidor.
 * @param {Object} pedidoData
 * @returns {Promise<Object>}
 */
async function crearPedidoChatbot(pedidoData) {
  const { data } = await client.post("/api/orders/chatbot", pedidoData);
  return data;
}

/**
 * Valida un cupón de descuento en el servidor.
 * @param {string} code
 * @returns {Promise<Object>}
 */
async function getCoupon(code, phone = null) {
  const { data } = await client.post("/api/coupons/validate", { code, phone });
  return data;
}

module.exports = { getProductosPorCategoria, restarStock, getSettings, crearPedidoChatbot, getCoupon };

