/**
 * Woobi - Backend Module
 * AuthContract.js - Authentication Contracts, Tokens & Password Policy
 */

export const AUTH_CONFIG = {
  TOKEN_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
  DEFAULT_SIGNING_SECRET: 'woobi-dev-signing-key-32bytes-min-len!!',
  SALT_BYTE_LENGTH: 16,
  KEY_BYTE_LENGTH: 64,

  PASSWORD_POLICY: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false
  }
};

export const AUTH_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const AUTH_EVENTS = {
  REGISTERED: 'auth:registered',
  LOGGED_IN: 'auth:logged_in',
  LOGGED_OUT: 'auth:logged_out',
  FAILED_ATTEMPT: 'auth:failed_attempt',
  TOKEN_REVOKED: 'auth:token_revoked'
};

export const AuthContract = {
  config: AUTH_CONFIG,
  roles: AUTH_ROLES,
  events: AUTH_EVENTS
};

export default AuthContract;
