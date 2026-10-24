# Architecture Decision Records (ADRs)
## AI Smart Study Planner

**Version:** 1.0.0

---

### ADR-001: Monorepo with npm Workspaces
- **Status:** Accepted
- **Context:** Web, mobile, and backend share data models, Zod validation schemas, color tokens, and scheduling algorithms.
- **Decision:** Use npm workspaces with `apps/*` and `packages/*`.
- **Consequences:** Single version of dependencies, instantaneous refactoring across shared packages, zero external package publication overhead.

---

### ADR-002: Node.js with Native ES Modules for Backend
- **Status:** Accepted
- **Context:** The specification explicitly mandates JavaScript/Node.js for backend services.
- **Decision:** Implement `apps/api` using Node.js ES Modules (`"type": "module"`) with Express.js.
- **Consequences:** Native `import`/`export` syntax, high compatibility with modern packages, clean code structure.

---

### ADR-003: Prisma ORM with Multi-Engine Support (SQLite & PostgreSQL)
- **Status:** Accepted
- **Context:** Developers and reviewers need zero-friction, instant startup without mandating a local Docker or PostgreSQL daemon, while production requires relational scale.
- **Decision:** Use Prisma ORM with SQLite default for development and test suites, configured to map seamlessly to PostgreSQL for production.
- **Consequences:** Immediate local onboarding with `prisma db push`; type-safe database queries.

---

### ADR-004: Server-Sent Events (SSE) for AI Streaming over WebSockets
- **Status:** Accepted
- **Context:** AI generation is unidirectional from server to client during query responses.
- **Decision:** Use HTTP Server-Sent Events (`text/event-stream`) for AI streaming and reserve WebSockets strictly if bidirectional low-latency collaboration is requested.
- **Consequences:** Standard HTTP semantics, easy proxying and caching, native reconnection support, significantly reduced connection overhead.

---

### ADR-005: Deterministic Constraint-Based Scheduling
- **Status:** Accepted
- **Context:** Students need reliable schedules that respect actual calendar hours and exam dates, rather than unpredictable neural completions.
- **Decision:** Build a pure algorithmic constraint solver in `@ai-study/domain` that enforces capacity limits, priority ordering, rest breaks, and pre-exam revision buffers.
- **Consequences:** 100% reproducible, verifiable, and testable schedules.

---

### ADR-006: Zero-Trust Reward Ledger with Unique Idempotency Keys
- **Status:** Accepted
- **Context:** Client-side XP counters and gamification without server validation lead to gameable exploits, spam, and unearned rewards.
- **Decision:** All XP, levels, and streaks are recorded in an append-only `RewardLedgerEntry` table with unique constraint `[userId, eventType, sourceEventId]`.
- **Consequences:** Replay attacks are discarded at the database level; total XP is mathematically provable from ledger transactions.
