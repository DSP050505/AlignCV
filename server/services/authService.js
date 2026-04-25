// ─────────────────────────────────────────────────────────────────
// AlignCV — Auth Service
// Business logic for signup, login, and JWT generation.
// ─────────────────────────────────────────────────────────────────

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const { AuthError, ValidationError } = require('../utils/errors');
const userQueries = require('../db/queries/users.queries');
const profileQueries = require('../db/queries/profile.queries');

// ── Generate JWT ─────────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

// ── Sign Up ──────────────────────────────────────────────────────
async function signup(name, passcode) {
  logger.info(`[Auth] Signup attempt: ${name}`);

  // Check if someone already stole this exact password for this name
  const existingUsers = await userQueries.findManyByName(name);
  for (const u of existingUsers) {
    if (await bcrypt.compare(passcode, u.passcode_hash)) {
      logger.warn(`[Auth] Signup failed — exact combination already exists.`);
      throw new ValidationError('A user with this exact name and passcode already exists. Please log in or choose a different passcode.');
    }
  }

  // Hash passcode
  const passcode_hash = await bcrypt.hash(passcode, config.BCRYPT_ROUNDS);

  // Create user
  const user = await userQueries.create({ name, passcode_hash });

  // Create blank profile for the user
  await profileQueries.create(user.id);

  // Generate token
  const token = generateToken(user);

  logger.info(`[Auth] Signup successful: ${user.id}`);
  return { user: { id: user.id, name: user.name }, token };
}

// ── Login ────────────────────────────────────────────────────────
async function login(name, passcode) {
  logger.info(`[Auth] Login attempt: ${name}`);

  const users = await userQueries.findManyByName(name);
  if (!users || users.length === 0) {
    logger.warn(`[Auth] Login failed — no users found for name: ${name}`);
    throw new AuthError('Invalid name or passcode');
  }

  let matchedUser = null;
  for (const u of users) {
    const isMatch = await bcrypt.compare(passcode, u.passcode_hash);
    if (isMatch) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    logger.warn(`[Auth] Login failed — wrong passcode for name: ${name}`);
    throw new AuthError('Invalid name or passcode');
  }

  const user = matchedUser;

  const token = generateToken(user);

  logger.info(`[Auth] Login successful: ${user.id}`);
  return { user: { id: user.id, name: user.name }, token };
}

// ── Get Current User ─────────────────────────────────────────────
async function getMe(userId) {
  const user = await userQueries.findById(userId);
  if (!user) throw new AuthError('User not found');
  return { id: user.id, name: user.name, created_at: user.created_at };
}

module.exports = { signup, login, getMe };
