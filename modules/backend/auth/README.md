# Backend Authentication Submodule (`modules/backend/auth`)

## Responsibility
Manages identity verification, password hashing, stateless session tokens, and request authorization:
- **Password Hashing**: Implements modern scrypt key derivation (`crypto.scryptSync`) with 16-byte random salts.
- **Timing-Safe Verification**: Employs `crypto.timingSafeEqual` to eliminate timing attacks during password validation and token signature verification.
- **Stateless Session Tokens**: Generates signed HMAC-SHA256 tokens (`Bearer <token>`) with automatic expiration checks.
- **Token Blacklisting**: Supports server-side revocation on logout (`revokeToken()`).
- **Authorization Middleware**: Verifies client authentication and scopes all incoming requests to the verified `userId`.

## Key APIs
- `hashPassword(password)`: Hashes plaintext with a unique salt.
- `verifyPassword(password, storedHash)`: Constant-time comparison.
- `generateToken(payload)`: Signs and issues a Bearer JWT.
- `verifyToken(token)`: Validates signature and expiry.
- `authenticateRequest(req)`: Extracts and verifies Authorization headers.
- `register(email, password, displayName)`: Validates and creates new user.
- `login(email, password)`: Validates credentials and returns session token.
- `revokeToken(token)`: Blacklists token on user logout.
