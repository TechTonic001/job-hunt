import { google } from 'googleapis';
import { decryptToken } from '../utils/crypto.js';
import MailComposer from 'nodemailer/lib/mail-composer.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Dispatches an application email with PDF attachment via user's authorized Gmail account
 * @param {Object} user - User document containing name and encryptedRefreshToken
 * @param {Object} draft - JobApplication draft containing applyEmail, coverEmailSubject, coverEmailBody
 * @param {Buffer} pdfBuffer - Compiled resume PDF buffer
 * @returns {Promise<boolean>} - Returns true upon successful dispatch
 */
export const sendApplicationEmail = async (user, draft, pdfBuffer) => {
  if (!user || !user.encryptedRefreshToken) {
    throw new Error('User has not linked their Gmail account (missing encrypted refresh token)');
  }

  // 1. Decrypt OAuth refresh token
  const decryptedToken = decryptToken(user.encryptedRefreshToken);
  if (!decryptedToken) {
    throw new Error('Failed to decrypt Gmail OAuth refresh token');
  }

  // 2. Initialize Google OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ refresh_token: decryptedToken });

  // 3. Initialize Gmail client
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // 4. Build MIME email with attachment
  const candidateName = (user.name || 'Candidate').replace(/\s+/g, '_');
  const mail = new MailComposer({
    to: draft.applyEmail,
    subject: draft.coverEmailSubject,
    text: draft.coverEmailBody,
    attachments: [
      {
        filename: `${candidateName}_Resume.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });

  const messageBuffer = await mail.compile().build();
  const rawMessage = messageBuffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 5. Send via Gmail API
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: rawMessage }
  });

  return true;
};

export default sendApplicationEmail;
