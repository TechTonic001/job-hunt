import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Dispatches an email (optionally with a PDF attachment) using Gmail SMTP.
 * @param {string} toEmail - Recipient email address.
 * @param {string} subject - Email subject line.
 * @param {string} body - Plain‑text email body.
 * @param {Buffer|null} pdfBuffer - Optional PDF file buffer to attach.
 * @returns {Promise<boolean>} Resolves to true when the email is sent.
 */
export const dispatchEmail = async (toEmail, subject, body, pdfBuffer = null) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Gmail address
      pass: process.env.GMAIL_APP_PASSWORD // 16‑character App Password
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: toEmail,
    subject: subject,
    text: body
  };

  if (pdfBuffer) {
    mailOptions.attachments = [
      {
        filename: 'Resume.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ];
  }

  await transporter.sendMail(mailOptions);
  return true;
};

export default dispatchEmail;
