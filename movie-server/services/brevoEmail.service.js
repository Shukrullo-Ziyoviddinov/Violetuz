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
    ? 'VioletPlay — kirish kodi'
    : "VioletPlay — ro'yxatdan o'tish kodi";

  const actionText = isLogin
    ? "Assalomu alaykum! VioletPlay platformasida kirish uchun tasdiqlash kodingiz:"
    : "Assalomu alaykum! VioletPlay platformasida ro'yxatdan o'tish uchun tasdiqlash kodingiz:";

  const textContent = [
    'VioletPlay',
    '',
    actionText,
    '',
    String(code),
    '',
    '⏱ Bu kod faqat 2 daqiqa davomida amal qiladi.',
    "Agar siz bu amalni bajarmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.",
    '',
    'Hurmat bilan,',
    'VioletPlay jamoasi',
  ].join('\n');

  const htmlContent = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f0f0f;color:#fff;border-radius:12px;">
      <h2 style="margin:0 0 16px;color:#e0aaff;">VioletPlay</h2>
      <p style="margin:0 0 16px;color:#ccc;line-height:1.5;">${actionText}</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0 0 20px;color:#fff;">${code}</p>
      <p style="margin:0 0 8px;color:#bbb;font-size:14px;line-height:1.5;">
        ⏱ Bu kod faqat <strong>2 daqiqa</strong> davomida amal qiladi.
      </p>
      <p style="margin:0 0 20px;color:#888;font-size:13px;line-height:1.5;">
        Agar siz bu amalni bajarmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
      </p>
      <p style="margin:0;color:#9a9a9a;font-size:13px;line-height:1.5;">
        Hurmat bilan,<br/>
        <span style="color:#e0aaff;">VioletPlay jamoasi</span>
      </p>
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
        name: BREVO_SENDER_NAME || 'VioletPlay',
        email: BREVO_SENDER_EMAIL,
      },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject,
      textContent,
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
    const brevoMsg =
      (details && (details.message || details.error || details.code)) ||
      `Brevo HTTP ${response.status}`;
    const err = new Error(`Failed to send verification email: ${brevoMsg}`);
    err.status = 502;
    err.details = details;
    throw err;
  }

  return true;
};

const getBrevoConfigStatus = () => ({
  hasApiKey: Boolean(BREVO_API_KEY),
  hasSenderEmail: Boolean(BREVO_SENDER_EMAIL),
  senderEmailHint: BREVO_SENDER_EMAIL
    ? `${BREVO_SENDER_EMAIL.slice(0, 2)}***@${BREVO_SENDER_EMAIL.split('@')[1] || '?'}`
    : null,
  senderName: BREVO_SENDER_NAME || 'VioletPlay',
});

module.exports = {
  sendOtpEmail,
  getBrevoConfigStatus,
};
