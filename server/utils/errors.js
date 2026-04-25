// ─────────────────────────────────────────────────────────────────
// AlignCV — Custom Error Classes
// All extend AppError with status + code for consistent API errors.
// ─────────────────────────────────────────────────────────────────

class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class AuthError extends AppError {
  constructor(msg = 'Unauthorized') {
    super(msg, 401, 'UNAUTHORIZED');
  }
}

class ValidationError extends AppError {
  constructor(msg = 'Validation failed') {
    super(msg, 400, 'VALIDATION_ERROR');
  }
}

class NIMError extends AppError {
  constructor(msg = 'AI service error') {
    super(msg, 502, 'AI_SERVICE_ERROR');
  }
}

module.exports = { AppError, NotFoundError, AuthError, ValidationError, NIMError };
