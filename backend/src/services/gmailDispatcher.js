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

/**
 * Helper used by applicationController to send a job application email.
 * Extracts needed fields from the draft and forwards to dispatchEmail.
 * @param {object} user - The authenticated user object (currently not used but kept for future extensions).
 * @param {object} draft - JobApplication draft containing applyEmail, coverEmailSubject, coverEmailBody.
 * @param {Buffer|null} pdfBuffer - PDF buffer of the resume to attach.
 */
export const sendApplicationEmail = async (user, draft, pdfBuffer = null) => {
  const toEmail = draft.applyEmail;
  const subject = draft.coverEmailSubject;
  const body = draft.coverEmailBody;
  await dispatchEmail(toEmail, subject, body, pdfBuffer);
};

