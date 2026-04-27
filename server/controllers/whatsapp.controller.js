const db = require('../db/knex');

// Generates an access code for the currently logged in user
exports.generateAccessCode = async (req, res) => {
  try {
    const code = 'ALIGNCV-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    await db('users').where({ id: req.user.id }).update({ whatsapp_code: code });
    res.json({ success: true, data: { whatsapp_code: code } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
