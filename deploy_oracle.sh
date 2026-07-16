#!/bin/bash

# ==============================================================================
# Script de Despliegue Automático para Lúa Beauty en Oracle Cloud (Ubuntu VPS)
# ==============================================================================

# Detener ejecución si ocurre algún error
set -e

echo "🚀 Iniciando preparación del servidor en Oracle Cloud..."

# 1. Actualizar el sistema
echo "📦 Actualizando paquetes del sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependencias básicas del sistema
echo "🛠️ Instalar dependencias de red, compresión y curl..."
sudo apt install -y curl git wget build-essential libssl-dev

# 3. Instalar Node.js LTS (Versión 20)
echo "🟢 Instalando Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Instalar PM2 para mantener los procesos corriendo en segundo plano
echo "🔄 Instalando PM2..."
sudo npm install -g pm2

# 5. Instalar dependencias necesarias para que corra Puppeteer (Chromium / WhatsApp)
echo "🌐 Instalando librerías de Chromium para el bot de WhatsApp..."
sudo apt install -y \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  libgbm-dev

# 6. Abrir puertos en el Firewall de Ubuntu (iptables)
# Oracle Cloud usa iptables por defecto y bloquea las conexiones entrantes en Ubuntu.
echo "🔥 Configurando Firewall de Ubuntu (Puerto 3000 para el catálogo y admin)..."
sudo iptables -I INPUT 6 -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4

echo "----------------------------------------------------------------------"
echo "✅ Servidor preparado con éxito en Oracle Cloud."
echo "----------------------------------------------------------------------"
echo "Próximos pasos:"
echo "1. Sube tu código al servidor (usando Git o SFTP)."
echo "2. Entra a la carpeta del proyecto y ejecuta: npm install"
echo "3. Ejecuta la instalación en backend: npm --prefix backend install"
echo "4. Ejecuta la instalación en frontend/admin: npm --prefix frontend/admin install"
echo "5. Ejecuta la instalación en frontend/catalog-react: npm --prefix frontend/catalog-react install"
echo "6. Crea y edita tu archivo '.env' en la raíz del proyecto y en 'backend/'."
echo "7. Compila los frontends: npm run admin:build && npm run catalog:build"
echo "8. Enciende la app usando PM2: pm2 start backend/server.js --name lua-backend"
echo "9. IMPORTANTE: En el Panel de Oracle Cloud, recuerda agregar una 'Ingress Rule' (Regla de entrada) en la lista de seguridad de tu subred para permitir el puerto 3000."
echo "----------------------------------------------------------------------"
