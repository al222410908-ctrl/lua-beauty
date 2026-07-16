/**
 * Test de integración: ejercita el flujo completo de conversación
 * usando la API real del Módulo 1 (no mocks), para confirmar que
 * conversationHandler.js + api.js funcionan juntos de extremo a extremo.
 *
 * Requiere que el backend de FastAPI esté corriendo en API_BASE_URL
 * (por defecto http://127.0.0.1:8000) y con el seed de productos cargado.
 */

require('dotenv').config();
const assert = require("assert");
const { handleMessage } = require("./conversationHandler");
const api = require("./api");

async function run() {
  let estado = { paso: "inicio" };

  // 1. Saludo -> menú de bienvenida
  let r = await handleMessage("menu", estado, api);
  assert.ok(r.respuesta.includes("Bienvenida a Lúa Beauty"), "Debe mostrar bienvenida");
  assert.strictEqual(r.nuevoEstado.paso, "menu");
  estado = r.nuevoEstado;
  console.log("✅ Saludo -> menú de bienvenida");

  // 2. Elegir categoría (las categorías se cargan en orden alfabético desde la DB)
  //    Buscar qué número corresponde a "rimels" dinámicamente
  const { cargarCategorias } = require("./conversationHandler");
  const categorias = cargarCategorias();
  const catRimels = Object.entries(categorias).find(([k, v]) => v.slug === "rimels");
  const rimelsIndex = catRimels ? catRimels[0] : "1";

  r = await handleMessage(rimelsIndex, estado, api);
  assert.strictEqual(r.nuevoEstado.paso, "eligiendo_producto");
  assert.ok(r.nuevoEstado.productos.length > 0, "Debe haber productos de rimels en stock");
  assert.ok(r.respuesta.includes("Rimels") || r.respuesta.includes("Rímels"), "Debe mostrar el nombre de la categoría");
  estado = r.nuevoEstado;
  console.log(`✅ Categoría rimels (índice ${rimelsIndex}) -> ${estado.productos.length} producto(s) reales desde la API`);

  const productoElegido = estado.productos[0];
  const stockAntes = productoElegido.stock;

  // 3. Elegir el producto número 1 -> debe pedir la cantidad
  r = await handleMessage("1", estado, api);
  assert.strictEqual(r.nuevoEstado.paso, "eligiendo_cantidad");
  assert.ok(r.respuesta.includes("deseas apartar"));
  estado = r.nuevoEstado;
  console.log(`✅ Producto seleccionado -> Pide cantidad`);

  // 3b. Enviar cantidad "1" -> debe pedir confirmación de pedido
  r = await handleMessage("1", estado, api);
  assert.strictEqual(r.nuevoEstado.paso, "confirmando_pedido");
  assert.ok(r.respuesta.includes("Resumen del Pedido"));
  estado = r.nuevoEstado;
  console.log(`✅ Cantidad ingresada -> Pide confirmación`);

  // 3c. Enviar "si" -> debe confirmar el pedido y preguntar método de pago
  r = await handleMessage("si", estado, api, "573001234567");
  assert.strictEqual(r.nuevoEstado.paso, "eligiendo_pago", "Tras confirmar debe pedir método de pago");
  assert.ok(r.respuesta.includes("Efectivo") || r.respuesta.includes("Transferencia"), "Debe preguntar por el método de pago");
  estado = r.nuevoEstado;
  console.log(`✅ Pedido confirmado: "${productoElegido.nombre}" -> Pide método de pago`);

  // 3d. Elegir transferencia ("2") -> debe mostrar datos bancarios y pedir zona de entrega
  r = await handleMessage("2", estado, api, "573001234567");
  assert.strictEqual(r.nuevoEstado.paso, "eligiendo_zona", "Tras elegir pago debe pedir zona de entrega");
  assert.ok(r.respuesta.includes("Dónde") || r.respuesta.includes("zona") || r.respuesta.includes("entrega"), "Debe preguntar por la zona");
  estado = r.nuevoEstado;
  console.log(`✅ Método de pago elegido (transferencia) -> Pide zona de entrega`);

  // 3e. Elegir zona "1" -> debe cerrar el pedido con mensaje de confirmación final
  r = await handleMessage("1", estado, api, "573001234567");
  assert.strictEqual(r.nuevoEstado.paso, "menu", "Tras elegir zona debe volver al menú");
  assert.ok(r.respuesta.includes("Todo listo") || r.respuesta.includes("confirmado"), "Debe enviar mensaje de cierre");
  estado = r.nuevoEstado;
  console.log(`✅ Zona de entrega elegida -> Pedido completado con mensaje final`);

  // 4. Verificar en la API real que el stock efectivamente bajó en 1
  const productosDespues = await api.getProductosPorCategoria("rimels");
  const actualizado = productosDespues.find((p) => p.id === productoElegido.id);
  const stockDespues = actualizado ? actualizado.stock : 0;
  assert.strictEqual(stockDespues, stockAntes - 1, "El stock debe haber bajado exactamente en 1");
  console.log(`✅ Stock verificado en la API real: ${stockAntes} -> ${stockDespues}`);



  // 5. Opción inválida en el menú
  estado = { paso: "menu" };
  r = await handleMessage("9", estado, api);
  assert.ok(r.respuesta.includes("No reconocí"));
  console.log("✅ Opción de menú inválida manejada correctamente");

  // 6. "menu" resetea la conversación desde cualquier estado
  estado = { paso: "eligiendo_producto", categoria: "rimels", productos: [] };
  r = await handleMessage("menu", estado, api);
  assert.strictEqual(r.nuevoEstado.paso, "menu");
  console.log("✅ Comando 'menu' resetea la conversación");

  // 7. Mensaje de checkout multi-producto desde la web
  const productosSkincare = await api.getProductosPorCategoria("skincare");
  if (productosSkincare && productosSkincare.length > 0) {
    const prod = productosSkincare[0];
    const stockAntesProd = prod.stock;

    const checkoutMsg = `🛒 *Nuevo Pedido - Lúa Beauty*\n\n` +
      `*Productos:*\n` +
      `• ${prod.nombre} x1 (ID: ${prod.id}) - $${prod.precio}\n\n` +
      `*Subtotal:* $${prod.precio}\n` +
      `*Total:* $${prod.precio}\n\n` +
      `¡Espero confirmación del pedido!`;

    r = await handleMessage(checkoutMsg, { paso: "inicio" }, api, "573001234567");
    console.log("CHECKOUT RESPONSE:", r.respuesta);
    assert.ok(r.respuesta.includes("Pedido Recibido"), "Debe confirmar el pedido");
    assert.ok(r.respuesta.includes(prod.nombre), "Debe incluir el nombre del producto");
    assert.strictEqual(r.nuevoEstado.paso, "eligiendo_pago", "Checkout web debe pasar a eligiendo_pago");
    estado = r.nuevoEstado;

    // Elegir efectivo en el checkout web
    r = await handleMessage("1", estado, api, "573001234567");
    assert.strictEqual(r.nuevoEstado.paso, "eligiendo_zona", "Tras elegir pago en checkout web debe pedir zona");
    estado = r.nuevoEstado;

    // Elegir zona 1
    r = await handleMessage("1", estado, api, "573001234567");
    assert.strictEqual(r.nuevoEstado.paso, "menu", "Tras elegir zona checkout web debe volver al menú");

    // Verificar que el stock bajó en 1
    const finalSkincare = await api.getProductosPorCategoria("skincare");
    console.log("FINAL SKINCARE PRODUCTS:", finalSkincare);
    const prodActualizado = finalSkincare.find(p => p.id === prod.id);
    console.log("PROD:", prod, "PROD ACTUALIZADO:", prodActualizado);
    assert.strictEqual(prodActualizado.stock, stockAntesProd - 1, "El stock de skincare debe haber bajado en 1");
    console.log(`✅ Flujo de checkout web procesado y stock decrementado: ${stockAntesProd} -> ${prodActualizado.stock}`);

  } else {
    console.log("⚠️ No se encontraron productos de skincare para probar el flujo de checkout web");
  }

  // 8. Verificar que las órdenes se crearon en la base de datos
  const db = require("./db");
  const testUser = db.prepare("SELECT * FROM users WHERE telefono = '573001234567'").get();
  assert.ok(testUser, "El usuario de WhatsApp debe haber sido creado en la base de datos");
  
  const testOrders = db.prepare("SELECT * FROM orders WHERE user_id = ?").all(testUser.id);
  assert.strictEqual(testOrders.length, 2, "Deben haberse registrado exactamente 2 órdenes para el usuario");
  console.log(`✅ Registro de base de datos verificado: Usuario ${testUser.username} creado con ${testOrders.length} órdenes.`);

  console.log("\n🎉 Todos los tests de integración pasaron.");
}

run().catch((err) => {
  console.error("❌ Test falló:", err);
  process.exit(1);
});
