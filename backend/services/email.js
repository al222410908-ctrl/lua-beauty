const nodemailer = require('nodemailer');

let transporter = null;

function initTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP no configurado. Los emails no funcionarán.');
    return;
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(port) || 587,
    secure: parseInt(port) === 465,
    auth: { user, pass },
  });

  transporter.verify().then(() => {
    console.log('✅ Transporte SMTP verificado');
  }).catch(err => {
    console.warn('⚠️ Error verificando SMTP:', err.message);
    transporter = null;
  });
}

async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.warn('⚠️ SMTP no disponible. Email no enviado a', to);
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@luabeauty.mx',
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Error enviando email:', err.message);
    return false;
  }
}

function orderConfirmationEmail(order, user) {
  const itemsHtml = order.items.map(item =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.nombre}${item.variantName ? ` (${item.variantName})` : ''}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${item.precio.toLocaleString('es-MX')}</td></tr>`
  ).join('');

  return {
    subject: `✅ Pedido Confirmado - ${order.id}`,
    html: `
      <div style="font-family:'Manrope',sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="text-align:center;padding:20px 0;border-bottom:2px solid #A6694B">
          <h1 style="font-family:'Fraunces',serif;color:#A6694B;margin:0">Lúa Beauty</h1>
          <p style="color:#666;margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px">Confirmación de pedido</p>
        </div>
        <div style="padding:20px 0">
          <p style="font-size:14px;color:#333">Hola <strong>${user.nombre || user.username || 'cliente'}</strong>,</p>
          <p style="font-size:14px;color:#333">Tu pedido ha sido registrado con éxito:</p>
          <div style="background:#f9f5f0;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0 0 8px;font-size:12px;color:#666">Pedido: <strong style="color:#A6694B">${order.id}</strong></p>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead><tr style="background:#eee"><th style="padding:8px;text-align:left">Producto</th><th style="padding:8px;text-align:center">Cant</th><th style="padding:8px;text-align:right">Precio</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div style="border-top:2px solid #A6694B;margin-top:12px;padding-top:12px;text-align:right;font-size:14px">
              ${order.discount > 0 ? `<p style="margin:2px 0;color:#999">Subtotal: $${order.subtotal.toLocaleString('es-MX')}</p><p style="margin:2px 0;color:#22c55e">Descuento: -$${order.discount.toLocaleString('es-MX')}</p>` : ''}
              <p style="margin:2px 0;font-weight:bold;font-size:16px">Total: $${order.total.toLocaleString('es-MX')}</p>
            </div>
          </div>
          <p style="font-size:13px;color:#666">Pronto recibirás notificaciones sobre el estado de tu pedido.</p>
          <p style="font-size:13px;color:#666">Si tienes dudas, responde a este correo o contáctanos por WhatsApp.</p>
          <p style="font-size:13px;color:#666;margin-top:20px">Con cariño,<br><strong style="color:#A6694B">Equipo Lúa Beauty</strong></p>
        </div>
      </div>
    `
  };
}

function passwordResetEmail(token, email) {
  const resetUrl = `${process.env.APP_URL || 'http://127.0.0.1:3000'}/reset-password?token=${token}`;
  return {
    subject: '🔑 Recupera tu contraseña - Lúa Beauty',
    html: `
      <div style="font-family:'Manrope',sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="text-align:center;padding:20px 0;border-bottom:2px solid #A6694B">
          <h1 style="font-family:'Fraunces',serif;color:#A6694B;margin:0">Lúa Beauty</h1>
          <p style="color:#666;margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px">Recuperación de contraseña</p>
        </div>
        <div style="padding:20px 0">
          <p style="font-size:14px;color:#333">Recibimos una solicitud para restablecer tu contraseña.</p>
          <p style="font-size:14px;color:#333">Haz clic en el botón para crear una nueva contraseña:</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#A6694B;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold">Restablecer contraseña</a>
          </div>
          <p style="font-size:12px;color:#999">Si no solicitaste esto, ignora este correo.</p>
          <p style="font-size:12px;color:#999">Este enlace expira en 1 hora.</p>
        </div>
      </div>
    `
  };
}

module.exports = { initTransporter, sendMail, orderConfirmationEmail, passwordResetEmail };
