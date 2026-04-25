// ─────────────────────────────────────────────────────────────────
// AlignCV — Export Service (Puppeteer Headless PDF)
// ─────────────────────────────────────────────────────────────────

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * htmlToPDF: Launches a headless Chrome instance to snapshot the HTML exactly as provided.
 */
async function htmlToPDF(htmlContent, outputFilename) {
  // Ensure outputs folder exists
  if (!fs.existsSync(config.EXPORT.OUTPUT_DIR)) {
    fs.mkdirSync(config.EXPORT.OUTPUT_DIR, { recursive: true });
  }

  const outPath = path.join(config.EXPORT.OUTPUT_DIR, outputFilename);
  logger.info(`[Export] Starting Puppeteer PDF generation: ${outputFilename}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Use latest true instead of outdated 'new'
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Set content and wait until all network connections are finished (mainly to load the font.css)
    await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: config.EXPORT.PUPPETEER_TIMEOUT_MS });

    await page.pdf({
      path: outPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });

    logger.info(`[Export] Puppeteer PDF saved: ${outPath}`);
    // return just the filename so it can be stored as `/outputs/filename.pdf`
    return `/outputs/${outputFilename}`;

  } catch (err) {
    logger.error(`[Export] Puppeteer failed: ${err.message}`);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { htmlToPDF };
