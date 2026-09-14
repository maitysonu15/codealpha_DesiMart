import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let transporter;
let isRealEmailConfigured = false;

// Initialize Nodemailer Transport with .env settings
async function initMailTransporter() {
  const { EMAIL_USER, EMAIL_PASS, SMTP_HOST, SMTP_PORT, SMTP_SECURE } = process.env;

  if (EMAIL_USER && EMAIL_PASS) {
    try {
      if (SMTP_HOST && SMTP_HOST !== 'smtp.gmail.com') {
        transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT) || 587,
          secure: SMTP_SECURE === 'true',
          auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });
      } else {
        // Gmail Transporter
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });
      }
      isRealEmailConfigured = true;
      console.log(`\n======================================================`);
      console.log(`✅ REAL EMAIL SERVER CONFIGURED!`);
      console.log(`📧 Sending real OTP emails via: ${EMAIL_USER}`);
      console.log(`======================================================\n`);
    } catch (err) {
      console.error('❌ Failed to connect with provided EMAIL_USER/EMAIL_PASS', err);
    }
  } else {
    // Ethereal Test Account Fallback
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      console.log(`\n======================================================`);
      console.log(`⚠️ NO EMAIL AUTHENTICATION CREDENTIALS SET IN .env`);
      console.log(`To configure email authentication:`);
      console.log(`1. Open file: backend/.env`);
      console.log(`2. Provide EMAIL_USER and EMAIL_PASS (or custom SMTP credentials)`);
      console.log(`======================================================\n`);
    } catch (err) {
      console.error('Failed to create test transport', err);
    }
  }
}

initMailTransporter();

// Dispatch Real SMS via Fast2SMS if API key present
async function sendRealSmsFast2SMS(mobile, otpCode) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return false;

  try {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=otp&variables_values=${encodeURIComponent(otpCode)}&numbers=${encodeURIComponent(cleanMobile)}`;

    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();
    if (data && data.return) {
      console.log(`📱 REAL SMS DISPATCHED to mobile ${cleanMobile} via Fast2SMS`);
      return true;
    }
  } catch (err) {
    console.error('❌ Failed to dispatch SMS via Fast2SMS', err);
  }
  return false;
}

// Endpoint: POST /api/send-otp
app.post('/api/send-otp', async (req, res) => {
  const { email, otpCode, name = 'Shopper', mobile = '' } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
  }

  try {
    if (!transporter) {
      await initMailTransporter();
    }

    // Try SMS dispatch if mobile provided and Fast2SMS configured
    if (mobile) {
      await sendRealSmsFast2SMS(mobile, otpCode);
    }

    const fromAddress = process.env.EMAIL_USER
      ? `"DesiMart Fresh Grocery" <${process.env.EMAIL_USER}>`
      : '"DesiMart Fresh Grocery" <security@desimart.com>';

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: `${otpCode} is your DesiMart Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 14px; background-color: #FFFFFF;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #15803D; margin: 0; font-size: 24px;">🛒 DesiMart Grocery</h2>
            <p style="color: #64748B; font-size: 13px; margin-top: 4px; font-weight: bold;">FRESH &amp; FAST GROCERY DELIVERY</p>
          </div>
          
          <div style="background-color: #F0FDF4; border: 2px solid #86EFAC; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #166534; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your Real Verification OTP</p>
            <h1 style="margin: 12px 0; font-size: 40px; color: #15803D; letter-spacing: 8px; font-family: monospace;">${otpCode}</h1>
            <p style="margin: 0; font-size: 12px; color: #15803D; font-weight: bold;">Valid for 10 minutes. Do not share this code.</p>
          </div>

          <p style="font-size: 14px; color: #334155;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Your verification OTP code for <strong>${email}</strong> is <strong>${otpCode}</strong>.
          </p>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94A3B8; text-align: center;">
            This email was sent automatically by DesiMart Security.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = !isRealEmailConfigured ? nodemailer.getTestMessageUrl(info) : null;

    console.log(`\n📨 REAL EMAIL DISPATCHED to: ${email}`);
    console.log(`🔑 OTP Code: ${otpCode}`);
    if (previewUrl) {
      console.log(`🔗 Test Message Preview URL: ${previewUrl}`);
    }

    return res.json({
      success: true,
      message: isRealEmailConfigured
        ? `Real OTP sent directly to ${email}!`
        : `OTP email dispatched to ${email}.`,
      isRealConfigured: isRealEmailConfigured,
      previewUrl: previewUrl
    });
  } catch (error) {
    console.error('❌ Error dispatching mail:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to send email. Check credentials in .env file.`
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 DesiMart OTP Server listening on port ${PORT}`);
});
