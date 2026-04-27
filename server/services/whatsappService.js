const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const db = require('../db/knex');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

let client;

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

  client.on('message', async (message) => {
    const text = message.body.trim();
    const textLower = text.toLowerCase();
    const phone = message.from; // e.g. "919876543210@c.us"

    try {
      // 1. Check if user is linked
      const user = await db('users').where({ whatsapp_phone: phone }).first();

      // 2. If not linked, look for auth code
      if (!user) {
        if (text.startsWith('ALIGNCV-')) {
          const authUser = await db('users').where({ whatsapp_code: text }).first();
          if (authUser) {
            await db('users').where({ id: authUser.id }).update({ whatsapp_phone: phone });
            await message.reply(`✅ Account linked! Welcome to AlignCV WhatsApp Bot.\n\nType *resume* at any time to view your tailored resumes.`);
          } else {
            await message.reply(`❌ Invalid code. Please check your dashboard and try again.`);
          }
        }
        return;
      }

      // 3. User is linked. Handle Commands:
      if (textLower === 'resume' || textLower === 'resumes') {
        const resumes = await db('resumes')
          .select('id', 'title', 'created_at')
          .where({ user_id: user.id })
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
        return;
      }

      // Check if they replied with a number
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
          .where({ 'resumes.user_id': user.id })
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

          const safeName = user.name.replace(/[^a-zA-Z0-9]/g, '');
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
