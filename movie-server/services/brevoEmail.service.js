/**
 * Brevo transactional email helper (OTP codes).
 * Keep isolated — do not mix into catalog services.
 */
const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } = require('../config/env');

const sendOtpEmail = async ({ toEmail, toName, code, purpose }) => {
  if (!BREVO_API_KEY) {
    const err = new Error('BREVO_API_KEY is not configured');
    err.status = 500;
    throw err;
  }
  if (!BREVO_SENDER_EMAIL) {
    const err = new Error('BREVO_SENDER_EMAIL is not configured');
    err.status = 500;
    throw err;
  }

  const isLogin = purpose === 'login';
  const subject = isLogin
    ? `Violet — kirish kodi: ${code}`
    : `Violet — tasdiqlash kodi: ${code}`;

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f0f0f;color:#fff;border-radius:12px;">
      <h2 style="margin:0 0 12px;color:#e0aaff;">Violet</h2>
      <p style="margin:0 0 16px;color:#ccc;">
        ${isLogin ? 'Hisobga kirish uchun kod:' : "Ro'yxatdan o'tishni tasdiqlash kodi:"}
      </p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0 0 16px;color:#fff;">${code}</p>
      <p style="margin:0;color:#888;font-size:13px;">Kod 10 daqiqa amal qiladi. Agar bu siz bo'lmasangiz, xabarni e'tiborsiz qoldiring.</p>
    </div>
  `;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: BREVO_SENDER_NAME || 'Violet',
        email: BREVO_SENDER_EMAIL,
      },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    let details = null;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    const err = new Error('Failed to send verification email');
    err.status = 502;
    err.details = details;
    throw err;
  }

  return true;
};

module.exports = {
  sendOtpEmail,
};
