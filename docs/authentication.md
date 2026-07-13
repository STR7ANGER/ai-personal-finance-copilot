# Authentication, encrypted profiles, and audit design

## Acceptance criteria

- Registration normalizes email, enforces a 12-character password minimum, hashes passwords with scrypt and a unique salt, and never returns credential material.
- Login errors do not reveal whether an email exists. Successful login issues a random 256-bit token; only its SHA-256 digest is stored.
- Sessions are HTTP-only, SameSite=Lax, revocable, and expire after 30 days. Production cookies are Secure.
- Display names are encrypted with AES-256-GCM using a unique nonce and user ID as associated data. Keys are versioned for later rotation.
- Registration, successful/failed login, and logout create append-only audit events with request correlation IDs. Failed-login emails are hashed before logging.

## Trust boundaries and risks

The API is the only component that handles passwords, encryption keys, and session tokens. The web client receives a cookie and safe user projection. Database disclosure does not reveal plaintext passwords, tokens, or profile names. Remaining production work includes email verification, password reset, MFA, device history, CSRF review, managed-key integration, and rate limiting.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/v1/auth/register` | Create account and encrypted profile |
| POST | `/v1/auth/login` | Issue session cookie |
| GET | `/v1/auth/me` | Resolve current session |
| POST | `/v1/auth/logout` | Revoke current session |
