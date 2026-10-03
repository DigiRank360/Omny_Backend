import nodemailer from 'nodemailer';

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@omnyxglobal.in';
export const SALES_EMAIL = process.env.SALES_EMAIL || 'sales@omnyxglobal.in';

export async function sendEmail({ to, replyTo, subject, text }) {
  const {
    SMTP_HOST,
    SMTP_PORT = '465',
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    SMTP_SALES_USER,
    SMTP_SALES_PASS,
    SMTP_SALES_FROM,
  } = process.env;
  const isSalesMail = to?.toLowerCase() === SALES_EMAIL.toLowerCase();
  const user = isSalesMail ? SMTP_SALES_USER || SMTP_USER : SMTP_USER;
  const pass = isSalesMail ? SMTP_SALES_PASS || SMTP_PASS : SMTP_PASS;
  const from = isSalesMail ? SMTP_SALES_FROM || SMTP_FROM || user : SMTP_FROM || user;

  if (!SMTP_HOST || !SMTP_PORT || !user || !pass || !to) {
    const error = new Error('Email is not configured. Set the Hostinger SMTP host, port, mailbox username and mailbox password in the backend environment.');
    error.status = 503;
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE ? SMTP_SECURE === 'true' : Number(SMTP_PORT) === 465,
    auth: { user, pass },
  });

  return transporter.sendMail({ from, to, replyTo, subject, text });
}