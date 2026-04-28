const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const db = require('../db/knex');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

let client;


// In-memory session store: maps phone -> { userId, timestamp }
const activeSessions = new Map();
const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

async function sendResumeList(userId, message) {
  const resumes = await db('resumes')
    .select('id', 'title', 'created_at')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(10);

  if (resumes.length === 0) {
    await message.reply(`You don't have any resumes generated yet. Go to AlignCV web to create one!`);
    return;
  }

  let replyText = `📄 *Your AlignCV Resumes*\n\n`;
  resumes.forEach((r, i) => {
    replyText += `*${i + 1}*. ${r.title || 'Untitled Resume'} (${new Date(r.created_at).toLocaleDateString()})\n`;
  });
  replyText += `\nReply with the *number* to instantly download the PDF.`;
  
  await message.reply(replyText);
}

function initializeWhatsAppBot() {
  logger.info('[WhatsApp] Initializing WhatsApp-Web Client...');

  // Use LocalAuth to save the session so you don't have to scan QR every time
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    logger.info('[WhatsApp] 📱 Please scan the QR code below using your WhatsApp app (Linked Devices):');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    logger.info('[WhatsApp] ✅ Bot is READY and connected!');
  });

  client.on('authenticated', () => {
    logger.info('[WhatsApp] Authenticated successfully.');
  });

  client.on('auth_failure', msg => {
    logger.error('[WhatsApp] Authentication failed:', msg);
  });

  client.on('message_create', async (message) => {
    // If the message was sent by the bot/owner's phone to someone else, ignore it.
    // Allow if it was sent to themselves (for testing).
    if (message.fromMe && message.from !== message.to) {
      return;
    }

    const text = message.body.trim();
    const textLower = text.toLowerCase();
    const phone = message.from; // e.g. "919876543210@c.us"

    // Ignore bot's own automated replies to prevent infinite loops when testing in "Message Yourself"
    const botSignatures = ['👋', '✅', '❌', '📄', 'Fetching PDF', 'Sorry, the PDF', "You don't have", 'Hi there!'];
    if (message.fromMe) {
       for (const sig of botSignatures) {
           if (text.startsWith(sig)) return;
       }
    }

    try {
      // 1. Check if user has an active session
      let session = activeSessions.get(phone);
      
      // Clean up expired session
      if (session && (Date.now() - session.timestamp > SESSION_TIMEOUT_MS)) {
        activeSessions.delete(phone);
        session = null;
      }

      // 2. If no session, they MUST provide a code
      if (!session) {
        if (text.startsWith('ALIGNCV-')) {
          const authUser = await db('users').where({ whatsapp_code: text }).first();
          if (authUser) {
            // Create a temporary session
            activeSessions.set(phone, { userId: authUser.id, timestamp: Date.now() });
            await message.reply(`✅ Account verified! Your session is active for 2 minutes.`);
            await sendResumeList(authUser.id, message);
          } else {
            await message.reply(`❌ Invalid code. Please check your dashboard and try again.`);
          }
        } else {
          await message.reply(`👋 Welcome to AlignCV!\nPlease reply with your unique WhatsApp Bot Code (e.g. ALIGNCV-123456) to view your resumes.`);
        }
        return;
      }

      // Refresh session timestamp on activity
      session.timestamp = Date.now();
      const userId = session.userId;

      // 3. User is verified in session. Handle Commands:
      const selection = parseInt(text, 10);
      if (!isNaN(selection) && selection > 0 && selection <= 10) {
        const resumes = await db('resumes')
          .select(
             'resumes.id', 
             'resumes.title', 
             'resumes.pdf_path',
             'tracker_applications.company_name',
             'tracker_applications.job_id'
          )
          .leftJoin('tracker_applications', 'resumes.id', 'tracker_applications.resume_id')
          .where({ 'resumes.user_id': userId })
          .orderBy('resumes.created_at', 'desc')
          .limit(10);
        
        if (selection <= resumes.length) {
          const selectedResume = resumes[selection - 1];
          if (!selectedResume.pdf_path) {
            await message.reply(`This resume hasn't been fully generated yet.`);
            return;
          }

          await message.reply(`Fetching PDF for *${selectedResume.title || 'Untitled'}*... ⏳`);

          const filename = path.basename(selectedResume.pdf_path);
          const absolutePath = path.join(config.EXPORT.OUTPUT_DIR, filename);

          if (!fs.existsSync(absolutePath)) {
            await message.reply(`Sorry, the PDF file could not be found on the server.`);
            return;
          }

          // Generate file name: hisname_company_jobid.pdf
          let company = selectedResume.company_name;
          let jobid = selectedResume.job_id;

          if (!company) {
             const parts = (selectedResume.title || '').split('@');
             company = parts.length > 1 ? parts[1].trim() : 'Company';
          }
          if (!jobid) {
             jobid = 'Role';
          }

          // We need the user's name for the filename
          const user = await db('users').select('name').where({ id: userId }).first();
          const userName = user ? user.name : 'AlignCV';

          const safeName = userName.replace(/[^a-zA-Z0-9]/g, '');
          const safeCompany = company.replace(/[^a-zA-Z0-9]/g, '');
          const safeJobId = jobid.replace(/[^a-zA-Z0-9]/g, '');
          const finalFilename = `${safeName}_${safeCompany}_${safeJobId}.pdf`;

          // Send the PDF via WhatsApp Media
          try {
            const media = MessageMedia.fromFilePath(absolutePath);
            media.filename = finalFilename; // Overrides the internal file name sent to WhatsApp
            await client.sendMessage(phone, media, { caption: finalFilename });
          } catch (err) {
            logger.error(`[WhatsApp] Failed to send media: ${err.message}`);
            await message.reply(`Error sending document.`);
          }
          return;
        }
      } else {
        // Any other message from a verified user directly shows the resume list
        await sendResumeList(userId, message);
      }

    } catch (err) {
      logger.error(`[WhatsApp] Message error: ${err.message}`);
    }
  });

  client.initialize();
}

module.exports = {
  initializeWhatsAppBot
};
