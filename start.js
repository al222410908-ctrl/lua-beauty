const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Lúa Beauty...');

// 1. Liberar puerto 3000
console.log('🧹 Liberando puerto 3000...');
try {
  const output = execSync('netstat -ano | findstr LISTENING | findstr :3000', { encoding: 'utf8' });
  output.trim().split('\n').forEach(line => {
    const pid = line.trim().split(/\s+/).pop();
    if (pid && pid !== '0') {
      try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (_) {}
    }
  });
} catch (_) {}

// 2. Limpiar locks de Puppeteer
console.log('🧹 Limpiando archivos de bloqueo de WhatsApp...');
const authDir = path.join(__dirname, 'backend', '.wwebjs_auth');
(function clean(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) clean(fp);
    else if (['LOCK', 'SingletonLock', 'SingletonCookie', 'SingletonSocket'].includes(e.name) || e.name.endsWith('.lock')) {
      try { fs.unlinkSync(fp); } catch (_) {}
    }
  }
})(authDir);

// 3. Compilar frontends
console.log('📦 Compilando paneles...');
for (const [name, pkg] of Object.entries({
  'Admin': 'frontend/admin',
  'Catálogo': 'frontend/catalog-react',
})) {
  try {
    execSync(`npm --prefix ${pkg} run build`, { stdio: 'inherit' });
    console.log(`✅ ${name} compilado.`);
  } catch (_) {
    console.log(`⚠️ Error compilando ${name}, usando build anterior.`);
  }
}

// 4. Iniciar servidor
console.log('\n🎯 Servidor en http://127.0.0.1:3000  |  Admin en /admin\n');
const cmd = spawn('node', ['server.js'], { cwd: path.join(__dirname, 'backend'), stdio: 'inherit', shell: true });
cmd.on('close', (code) => { process.exit(code); });
