import nodemailer from 'nodemailer';

/**
 * Dispatch an email via Gmail.
 * @param {string} toEmail - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} body - Email body (HTML or plain text).
 * @param {Buffer|null} pdfBuffer - Optional PDF attachment as Buffer.
 */
export const dispatchEmail = async (toEmail, subject, body, pdfBuffer = null) => {
  // Create a Nodemailer transporter using Gmail service.
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Gmail address
      pass: process.env.GMAIL_APP_PASSWORD, // 16‑character app password
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: toEmail,
    subject,
    // Prefer HTML if provided, else plain text.
    html: body,
    ...(pdfBuffer && {
      attachments: [{
        filename: 'resume.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    }),
  };

  // Send the email.
  await transporter.sendMail(mailOptions);
};
