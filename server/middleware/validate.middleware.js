// ─────────────────────────────────────────────────────────────────
// AlignCV — Zod Validation Middleware
// Factory function: pass a Zod schema, get middleware that validates
// req.body before the controller runs.
// ─────────────────────────────────────────────────────────────────

const { ValidationError } = require('../utils/errors');

/**
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new ValidationError(messages.join('; '));
  }

  req.body = result.data; // Use parsed/cleaned data
  next();
};

module.exports = validate;
