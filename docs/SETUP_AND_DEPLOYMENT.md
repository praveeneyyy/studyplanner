# Setup, Configuration & Deployment Guide
## AI Smart Study Planner

**Version:** 1.0.0  
**Monorepo Tooling:** npm workspaces (Node.js v20+ / v22+)

---

## 1. Prerequisites

- **Node.js:** v20.10.0 or higher (v24.x tested).
- **npm:** v10.0.0 or higher.
- **Git:** Standard git installation.
- **Database:** SQLite (default for instant zero-dependency local dev) or PostgreSQL 14+.

---

## 2. Environment Variables Configuration

Copy the sample environment file:
```bash
cp .env.example .env
```

### Environment Reference (`.env.example`):
```ini
# Server Configuration
PORT=4000
NODE_ENV=development
API_BASE_URL=http://localhost:4000/api/v1
CLIENT_ORIGIN=http://localhost:5173

# Database (SQLite for immediate local dev; PostgreSQL for production)
DATABASE_URL="file:./dev.db"
# DATABASE_URL="postgresql://user:password@localhost:5432/aistudyplanner?schema=public"

# Authentication Security
JWT_SECRET=super_secret_study_jwt_key_minimum_32_characters_long_2026

# AI Providers (Optional - Leave blank for verified local academic tutor engine)
WATSONX_APIKEY=
WATSONX_PROJECT_ID=
WATSONX_URL=https://us-south.ml.cloud.ibm.com
GEMINI_API_KEY=
```

---

## 3. Installation & Database Setup

1. **Install Monorepo Dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma Client & Run Migrations:**
   ```bash
   npm run db:generate --workspace=apps/api
   npm run db:push --workspace=apps/api
   ```

3. **Seed Database with Realistic Demo Data:**
   ```bash
   npm run db:seed --workspace=apps/api
   ```
   *Seeds user `alex@university.edu` / `Password123!` with 3 realistic engineering subjects (Operating Systems, Calculus, Data Structures), units, topics, upcoming exam dates, planned sessions, notes, and quiz records.*

---

## 4. Development Startup Commands

Run all services concurrently:
```bash
npm run dev
```

Or run individual apps:
- **Backend API:** `npm run dev --workspace=apps/api` (runs on `http://localhost:4000`)
- **Web Client:** `npm run dev --workspace=apps/web` (runs on `http://localhost:5173`)
- **Mobile Client (Expo):** `npm run start --workspace=apps/mobile`

---

## 5. Automated Tests & Production Build

1. **Execute Test Suites:**
   ```bash
   npm test
   ```

2. **Compile Production Builds:**
   ```bash
   npm run build
   ```
   *Builds `@ai-study/shared-schemas`, `@ai-study/design-tokens`, `@ai-study/domain`, `@ai-study/api-client`, and the optimized production bundle for `apps/web`.*
