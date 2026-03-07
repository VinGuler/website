Generate a cryptographically secure secret key. Supports HMAC_KEY, JWT_SECRET, and EMAIL_ENCRYPTION_KEY.

Based on $ARGUMENTS (e.g. "hmac", "jwt", "encryption", "email encryption"), determine which key to generate:

- **HMAC_KEY** (keywords: "hmac", "hmac key"): Run `openssl rand -base64 32`. Remind user to set as HMAC_KEY.
- **JWT_SECRET** (keywords: "jwt", "jwt secret"): Run `openssl rand -hex 32`. Remind user to set as JWT_SECRET.
- **EMAIL_ENCRYPTION_KEY** (keywords: "encryption", "email encryption"): Run `openssl rand -hex 32`. Remind user to set as EMAIL_ENCRYPTION_KEY.

Steps:

1. Run the appropriate command based on the keyword
2. Display the generated key
3. Copy it to the clipboard by piping it to `clip.exe` (WSL)
4. Tell the user the key has been copied and which .env variable to set
