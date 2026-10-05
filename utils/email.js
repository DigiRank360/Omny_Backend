import nodemailer from 'nodemailer';

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@omnyxglobal.in';
export const SALES_EMAIL = process.env.SALES_EMAIL || 'sales@omnyxglobal.in';

export function logEmailFailure(context, error) {
  const message = String(error?.message || 'Unknown email error')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/[\r\n]+/g, ' ');
  console.error(`${context} email failed`, {
    code: error?.code,
    responseCode: error?.responseCode,
    command: error?.command,
    message,
  });
}

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
    dnsTimeout: 5000,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  return transporter.sendMail({ from, to, replyTo, subject, text });
}