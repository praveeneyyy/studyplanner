# Security & Privacy Specification
## AI Smart Study Planner

**Version:** 1.0.0  
**Standard:** OWASP Top 10 Compliance / Zero-Trust Tenant Isolation / GDPR Privacy

---

## 1. Authentication, Sessions & Token Security

1. **Password Hashing:** Passwords are encrypted using `bcrypt` with a work factor of 12 (or `argon2id` where native bindings exist). Plaintext passwords are never logged or stored.
2. **Web Session Management:** 
   - JWT tokens are issued with a 7-day lifespan and transmitted in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
   - Prevents XSS-based credential theft via `document.cookie`.
3. **Mobile Credential Storage:** 
   - Tokens on React Native / Expo are stored exclusively via `expo-secure-store` (backed by iOS Keychain and Android Keystore).
   - Never stored in unencrypted `AsyncStorage`.

---

## 2. Authorization & Tenant Boundary Enforcement

1. **Strict Ownership Filtering:** Every API endpoint validates that the target entity matches `req.user.id`:
   ```javascript
   const subject = await prisma.subject.findFirst({
     where: { id: req.params.id, userId: req.user.id }
   });
   if (!subject) {
     return res.status(404).json({ success: false, error: { message: "Subject not found." } });
   }
   ```
2. **Zero Insecure Direct Object References (IDOR):** An attacker mutating IDs in requests receives `404 Not Found` rather than leaking resource existence or metadata.

---

## 3. Input Validation & Content Sanitization

1. **Zod Schema Gatekeepers:** All incoming POST, PUT, and query strings pass through strict Zod validators before entering service logic. Unknown fields are stripped (`.strict()`).
2. **Safe Markdown Rendering:** AI responses and user notes are sanitized using `DOMPurify` before rendering in the browser DOM. No raw `dangerouslySetInnerHTML` is used without sanitization.
3. **No Execution of Untrusted Code:** The AI tutor outputs code for reading and learning; the platform never automatically executes model-generated scripts, shell commands, or database queries.

---

## 4. Privacy, Account Deletion & Data Portability

1. **GDPR Account Deletion:** A single call to `DELETE /api/v1/auth/profile` triggers a transactional cascading delete wiping all user records, study plans, conversations, notes, and quiz histories.
2. **JSON Data Export:** `GET /api/v1/auth/export` returns a complete, portable JSON archive of the student's curriculum, notes, and study history.
3. **Zero Secret Leakage:** Provider API keys (`WATSONX_APIKEY`, `GEMINI_API_KEY`, `DATABASE_URL`, `JWT_SECRET`) reside solely in `.env` on the server and are excluded from all git repositories.
