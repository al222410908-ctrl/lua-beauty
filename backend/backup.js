const fs = require('fs');
const path = require('path');

// Configuración de rutas
const dbPath = path.join(__dirname, 'lua-beauty.db');
const backupsDir = path.join(__dirname, 'backups');

console.log(`[RESPALDO] Iniciando copia de seguridad...`);

// Crear carpeta de respaldos si no existe
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Formatear fecha para el archivo
const now = new Date();
const dateStr = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0]; // YYYY-MM-DD_HH-MM-SS
const backupFilename = `lua-beauty_${dateStr}.db`;
const backupPath = path.join(backupsDir, backupFilename);

try {
  if (!fs.existsSync(dbPath)) {
    console.error(`[RESPALDO] [ERROR] No se encontró el archivo de base de datos en: ${dbPath}`);
    process.exit(1);
  }

  // Copiar base de datos
  fs.copyFileSync(dbPath, backupPath);
  console.log(`[RESPALDO] [ÉXITO] Base de datos respaldada correctamente en: ${backupPath}`);

  // Limpieza preventiva: borrar respaldos con más de 7 días de antigüedad
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
  const files = fs.readdirSync(backupsDir);

  files.forEach(file => {
    const filePath = path.join(backupsDir, file);
    try {
      const stats = fs.statSync(filePath);
      const ageMs = now.getTime() - stats.mtime.getTime();

      if (ageMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`[RESPALDO] [LIMPIEZA] Eliminado respaldo obsoleto: ${file}`);
      }
    } catch (e) {
      console.error(`[RESPALDO] [ALERTA] Error al procesar limpieza de ${file}:`, e.message);
    }
  });

  console.log(`[RESPALDO] Proceso de respaldo completado.`);
} catch (err) {
  console.error(`[RESPALDO] [ERROR] Ocurrió un error al copiar el archivo:`, err.message);
  process.exit(1);
}
