# Bot de WhatsApp — Lúa Beauty (Módulo 3)

Bot construido con `whatsapp-web.js`, conectado a la API de FastAPI del Módulo 1.

## Estructura
- `index.js` — conecta WhatsApp (QR, eventos), mantiene el estado de cada chat en memoria
- `conversationHandler.js` — toda la lógica de la conversación, **separada de WhatsApp** a propósito para poder probarla sola
- `api.js` — cliente HTTP hacia tu backend de FastAPI
- `test/conversationHandler.test.js` — test de integración contra la API real

## Cómo correrlo

```bash
npm install
npm start
```

Va a aparecer un código QR en la terminal. Escanéalo desde WhatsApp en tu celular:
**Ajustes → Dispositivos vinculados → Vincular un dispositivo**.

Por defecto el bot busca la API en `http://127.0.0.1:8000`. Si tu backend corre en
otra URL, exporta la variable de entorno antes de iniciar:

```bash
API_BASE_URL=https://tu-api-en-produccion.com npm start
```

## Flujo de conversación

```
Usuario: hola
Bot:     [menú de bienvenida con 3 categorías]

Usuario: 1
Bot:     [lista productos en stock de "rimels", con precio y stock]

Usuario: 1
Bot:     "¡Listo! Apartamos <producto> para ti 🛍️"
         (en este punto el bot ya llamó a POST /productos/restar-stock)
```

En cualquier momento, escribir `menu` reinicia la conversación al punto de partida.

## Por qué la lógica está separada de whatsapp-web.js

`conversationHandler.js` exporta una función pura `handleMessage(texto, estado, api)`
que no sabe nada de WhatsApp. Esto permite:
1. Probar todo el flujo de conversación con Node puro, sin necesitar un WhatsApp
   conectado ni un navegador headless.
2. Si en el futuro cambias de librería (por ejemplo a Baileys), solo reescribes
   `index.js` — la lógica de negocio no se toca.

## Test de integración (ya ejecutado y verificado)

Con el backend del Módulo 1 corriendo localmente:

```bash
npm run test:conversacion
```

Este test no usa mocks: habla con tu API real y confirma que:
- el saludo dispara el menú de bienvenida,
- elegir una categoría trae productos reales desde `GET /productos/categoria/{categoria}`,
- elegir un producto llama de verdad a `POST /productos/restar-stock`,
- el stock efectivamente baja en la base de datos (se vuelve a consultar la API para confirmarlo),
- las opciones inválidas y el comando `menu` se manejan sin romper el flujo.

Ya lo corrí contra el backend del Módulo 1 y los 6 pasos pasaron correctamente,
incluyendo la verificación de que el stock bajó exactamente en 1 unidad tras
confirmar un pedido.

## Limitaciones a tener en cuenta
- El estado de conversación vive en memoria (`Map`). Si reinicias el proceso del
  bot, todos los usuarios "vuelven al menú" en su próximo mensaje — no se pierde
  nada crítico, pero si esperas mucho tráfico concurrente, vale la pena migrar
  ese `Map` a Redis (la firma de `conversationHandler.js` no cambia).
- El bot solo descuenta 1 unidad por pedido confirmado. Si quieres permitir
  cantidades, es un cambio pequeño en `conversationHandler.js` (pedir la
  cantidad antes de llamar a `restarStock`).
- `whatsapp-web.js` usa un navegador Chromium headless por debajo (vía
  Puppeteer), así que la primera instalación (`npm install`) descarga Chromium
  y puede tardar unos minutos.
