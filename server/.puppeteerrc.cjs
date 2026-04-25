const { join } = require('path');

/**
 * Puppeteer configuration for Render deployment.
 * Forces the cache into the project directory so it persists between build and runtime.
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
