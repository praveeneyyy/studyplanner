# AI Smart Study Planner & Student IDE
> **A minimal-first, progressive productivity workspace uniting deterministic academic scheduling, multi-language student IDE execution, SuperMemo SM-2 spaced repetition, and context-aware AI learning assistance.**

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Architecture & Monorepo Structure](#2-architecture--monorepo-structure)
3. [Key Features](#3-key-features)
   - [3.1 Minimal Homepage & Progressive Disclosure](#31-minimal-homepage--progressive-disclosure)
   - [3.2 Deterministic Study Planner](#32-deterministic-study-planner)
   - [3.3 Student Multi-Language IDE & Execution Engine](#33-student-multi-language-ide--execution-engine)
   - [3.4 AI Learning Assistant (Curriculum & Code Tutor)](#34-ai-learning-assistant-curriculum--code-tutor)
   - [3.5 SuperMemo SM-2 Spaced Repetition (SRS)](#35-supermemo-sm-2-spaced-repetition-srs)
   - [3.6 Verified Productivity Reward Ledger](#36-verified-productivity-reward-ledger)
   - [3.7 Three.js 3D Study Universe](#37-threejs-3d-study-universe)
4. [Prerequisites & System Requirements](#4-prerequisites--system-requirements)
5. [Installation & Setup Guide](#5-installation--setup-guide)
   - [Step 1: Clone the Repository](#step-1-clone-the-repository)
   - [Step 2: Install Monorepo Dependencies](#step-2-install-monorepo-dependencies)
   - [Step 3: Environment Configuration](#step-3-environment-configuration)
   - [Step 4: Database Provisioning & Seeding](#step-4-database-provisioning--seeding)
   - [Step 5: Start Development Servers](#step-5-start-development-servers)
6. [Pre-Configured Student & Guest Accounts](#6-pre-configured-student--guest-accounts)
7. [Database & Backend Storage Guide](#7-database--backend-storage-guide)
   - [SQLite (Default Local & Single-VPS)](#sqlite-default-local--single-vps)
   - [PostgreSQL (Supabase / Neon Cloud Production)](#postgresql-supabase--neon-cloud-production)
8. [Docker & Containerized Deployment](#8-docker--containerized-deployment)
9. [Available NPM Scripts](#9-available-npm-scripts)
10. [REST API Specification](#10-rest-api-specification)
11. [Keyboard Shortcuts](#11-keyboard-shortcuts)
12. [Testing & Quality Verification](#12-testing--quality-verification)
13. [Security & Production Hardening](#13-security--production-hardening)
14. [Troubleshooting & FAQ](#14-troubleshooting--faq)
15. [License](#15-license)

---

## 1. Overview & Philosophy

The **AI Smart Study Planner** is built on a **minimal-first, calm productivity design standard**. Instead of overwhelming students with cluttered dashboards, unprompted robotic chatter, or fake analytics, the platform begins with a focused, elegant homepage and reveals depth progressively as needed:

* **Level 1 (Home):** Clean greeting, single AI input, and 3 primary actions (*Ask AI*, *Plan My Study*, *Open IDE*).
* **Level 2 (Dedicated Workspaces):** Deep, purpose-built workspaces tailored to the current task.
* **Level 3 (All Tools Library):** A structured directory of all academic utilities (Syllabus Analyzer, Spaced Repetition, Assessments, Notes, 3D Topology, Settings).

---

## 2. Architecture & Monorepo Structure

The project is architected as an **npm workspaces monorepo** with strict boundary separation between web applications, mobile apps, backend services, and pure algorithmic domain packages:

```text
ai-smart-study-planner/
├── apps/
│   ├── web/                          # React 18 + Vite + Tailwind CSS + Monaco Editor + Three.js
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ai/               # AIAgentAvatar (floating assistant drawer), prompt tools
│   │   │   │   ├── dashboard/        # Custom dashboard views, AIPlanBuilderDrawer, modals
│   │   │   │   ├── ide/              # Monaco code editor, AIAgentSidePanel, console, diagnostics
│   │   │   │   ├── layout/           # Sidebar navigation, TopBar, CommandPalette
│   │   │   │   ├── ui/               # Monoline SVG vector icon library (SvgRepoIcons)
│   │   │   │   └── universe/         # Three.js 3D spatial solar system & 2D fallback tree
│   │   │   ├── pages/                # Home, Dashboard, Planner, IDE, Revision, Quizzes, Notes, Tools
│   │   │   └── context/              # Auth, Theme (Light/Dark/System), Dashboard views
│   ├── api/                          # Node.js (ESM) + Express + Prisma ORM + Multi-Runtime Runner
│   │   ├── src/
│   │   │   ├── config/               # Centralized environment configuration
│   │   │   ├── db/                   # Prisma client instance & SQLite/PostgreSQL connection
│   │   │   ├── middleware/           # JWT auth, rate limiting, validation, error handler
│   │   │   ├── routes/               # Auth, Execution, AI, Planner, Subjects, Quizzes, Rewards
│   │   │   ├── services/             # CodeExecutionService, HuggingFaceAIService, AuthService
│   │   │   └── seed.js               # Multi-student seed script (Swetha, Prathima, Guest Scholar)
│   │   └── test/                     # Vitest API integration and sandbox execution test suites
│   └── mobile/                       # React Native + Expo Router + TypeScript + Reanimated
├── packages/
│   ├── api-client/                   # Universal isomorphic typed API client (Web & Mobile)
│   ├── design-tokens/                # Colors, typography, spacing, elevations, themes
│   ├── domain/                       # Pure algorithmic solvers (SM-2, Scheduler, XP Ledger)
│   └── shared-schemas/               # Zod validation schemas & TypeScript types
├── Dockerfile                        # Multi-stage production container image
├── docker-compose.yml                # Production orchestration with healthchecks & volume persistence
├── .env.example                      # Root environment configuration template
└── README.md                         # Project documentation
```

---

## 3. Key Features

### 3.1 Minimal Homepage & Progressive Disclosure
* **Calm Workspace Landing:** One primary input for student queries, 3 quick-launch actions, and a subtle "All Tools" entry point.
* **Zero-Emoji SVG Design Standard:** High-precision, monoline vector SVG icons throughout the interface—no system emojis or visual slop.
* **Dual Light/Dark Theme:** Real-time theme synchronization with persistent local storage.

### 3.2 Deterministic Study Planner
* **Constraint-Based Scheduling:** Mathematical solver prevents overlapping sessions, enforces daily hour limits, and reserves an automatic 15% pre-exam buffer for revisions.
* **Multiple Database Views:** Switch seamlessly between Table, Board (Kanban), Calendar, and Agenda views.
* **1-Click Recovery:** Missed sessions are automatically rescheduled forward without breaking downstream study commitments.

### 3.3 Student Multi-Language IDE & Execution Engine
* **Supported Languages:** Python, JavaScript, TypeScript, Java, C, C++, C#, Rust, SQL, and JSON.
* **Dynamic Java Entrypoint Detection:** Inspects Java code for any public class or `main` method (e.g. `class HelloWorld`, `class Solution`), executing via single-file execution without classpath errors.
* **Instant In-Memory SQL Runner:** Evaluates SQL queries against a live, in-memory SQLite sandbox with formatted tabular output.
* **Pedagogical Diagnostics:** Cryptic stack traces and compiler errors are parsed into friendly explanations, likely root causes, and recommended fixes.
* **Isolated Process Sandbox:** Runs code in isolated temporary directories with strict 5000ms timeouts and process termination guards.

### 3.4 AI Learning Assistant (Curriculum & Code Tutor)
* **Model Engine:** Powered by `Qwen/Qwen3-4B-Instruct-2507` via `@huggingface/inference` with fallback support for Google Gemini and IBM WatsonX.
* **16 Specialized Answer Formats:** Step-by-Step, ELI5 (Simple), 2-Mark, 5-Mark, 10-Mark, 15-Mark University Exam formats, Comparison Tables, Math Derivations, and Flashcards.
* **Integrated Offline Fallback:** If API tokens are absent or rate-limited, the built-in **Academic Curriculum Engine** answers syllabus queries instantly without failing.

### 3.5 SuperMemo SM-2 Spaced Repetition (SRS)
* **Active Recall Optimization:** Cards calculate ease factors ($EF \ge 1.3$), repetition counts, and exponential review intervals based on student performance ratings (*Again, Hard, Good, Easy*).
* **Cognitive Bucketing:** Separates revision items into *Due Today*, *Overdue*, and *Upcoming 7 Days*.

### 3.6 Verified Productivity Reward Ledger
* **Anti-Cheat Verification:** Experience points (XP) are minted server-side only when study sessions meet strict criteria ($\ge 15$ minutes studied, $\ge 70\%$ duration met).
* **Cryptographic Idempotency:** Database unique constraints `[userId, eventType, sourceEventId]` ensure rewards cannot be double-claimed.

### 3.7 Three.js 3D Study Universe
* **Celestial Syllabus Map:** Interactive 3D orbital visualization of academic subjects (stars) and topics (orbiting satellites).
* **Visual Mastery Indicators:** Color-coded by mastery: Mastered ($\ge 85\%$, Green), In Progress ($50-84\%$, Blue), Needs Attention ($< 50\%$, Crimson).
* **2D Fallback Tree:** Instant 2D SVG tree mode for low-power or battery-saver devices.

---

## 4. Prerequisites & System Requirements

Before installing, ensure your environment meets the following requirements:

### Required Software
| Tool | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.10.0` | `v20.x` or `v24.x LTS` | `node -v` |
| **npm** | `v10.0.0` | `v10.8.0+` | `npm -v` |
| **Git** | `v2.30.0` | Latest | `git --version` |

### Optional Language Compilers (For Student IDE Execution)
The Student IDE executes JavaScript, TypeScript, JSON, and SQL out-of-the-box using the built-in Node.js runtime and in-memory engine. For additional languages, install the respective compiler on your host machine:

* **Python:** Python 3.10+ (`python --version`)
* **Java:** JDK 11+ or OpenJDK 17+ (`java -version`)
* **C / C++:** GCC / G++ or MinGW (`gcc --version`)
* **Rust:** Rust & Cargo (`rustc --version`)
* **C#:** .NET 8.0 SDK (`dotnet --version`)

> **Note:** If a compiler is not installed, the IDE gracefully detects this and displays a friendly notice suggesting Python, JavaScript, or installing the toolchain.

---

## 5. Installation & Setup Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/ai-study-planner.git
cd "AI Study Planner"
```

### Step 2: Install Monorepo Dependencies
Install all dependencies across the entire monorepo with one command:
```bash
npm install
```

### Step 3: Environment Configuration
Copy `.env.example` to create `.env` in the root directory and in `apps/api/`:

**On Linux / macOS (bash):**
```bash
cp .env.example .env
cp .env.example apps/api/.env
```

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
Copy-Item .env.example apps/api/.env
```

Open `.env` in your text editor and review the configuration:
```ini
# Server Settings
PORT=4000
NODE_ENV=development
API_BASE_URL=http://localhost:4000/api/v1
CLIENT_ORIGIN=http://localhost:5173

# Database (SQLite local file by default)
DATABASE_URL="file:./dev.db"

# Authentication Security (Minimum 32 characters)
JWT_SECRET=super_secret_ai_smart_study_planner_jwt_key_2026_xyz

# AI Model Credentials (Hugging Face Qwen3)
HF_TOKEN=hf_your_token_here
HF_MODEL_ID=Qwen/Qwen3-4B-Instruct-2507
```

> **Hugging Face Token:** Obtain a free token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens). If left blank or if credits expire, the platform will seamlessly use its built-in offline Academic Curriculum Engine.

### Step 4: Database Provisioning & Seeding
Generate the Prisma ORM client, initialize the database schema, and seed the demo curriculum:

```bash
# Generate the Prisma client
npm run db:generate

# Push database schema (creates tables and relations)
npm run db:push

# Seed student accounts, subjects, syllabus units, and flashcards
npm run db:seed
```

### Step 5: Start Development Servers
Start both the backend API server and the Vite web application concurrently:
```bash
npm run dev
```

Once started, open your browser:
* **Web Application:** [http://localhost:5173](http://localhost:5173)
* **Backend API Health Check:** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## 6. Pre-Configured Student & Guest Accounts

The database seed initializes three complete student workspaces ready for immediate exploration:

| Account | Username / Email | Password | Academic Scope | Pre-loaded Data |
| :--- | :--- | :--- | :--- | :--- |
| **Swetha** | `swetha` or `swetha@university.edu` | `44111143` | Computer Science & Engineering | Operating Systems, Data Structures & Algorithms, Calculus, study sessions, revision flashcards. |
| **Prathima** | `prathima` or `prathima@university.edu` | `44111111` | Information Technology & AI | Machine Learning & Neural Networks, DBMS, Computer Networks, study sessions, revision notes. |
| **Guest Scholar** | *1-Click Guest Login* | *(None)* | Computer Science (Explorer) | Web Systems, Algorithms, active study plans, and live IDE workspace. |

*You can also create a new workspace anytime from the **Register** page.*

---

## 7. Database & Backend Storage Guide

### SQLite (Default Local & Single-VPS)
* **Location:** Stored locally in `apps/api/prisma/dev.db`.
* **Zero Configuration:** No external database server or Docker service required.
* **Persistence:** When running in Docker, data persists through the named volume `study_data`.

### PostgreSQL (Supabase / Neon Cloud Production)
For multi-instance cloud deployments (Render, Vercel, Railway, AWS):
1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy your connection URI:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/ai_study_planner?sslmode=require"
   ```
3. In [`apps/api/prisma/schema.prisma`](file:///c:/Projects/AI%20Study%20Planner/apps/api/prisma/schema.prisma), update line 2:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run migrations:
   ```bash
   npm run db:push
   npm run db:seed
   ```

---

## 8. Docker & Containerized Deployment

A multi-stage production [`Dockerfile`](file:///c:/Projects/AI%20Study%20Planner/Dockerfile) and [`docker-compose.yml`](file:///c:/Projects/AI%20Study%20Planner/docker-compose.yml) are pre-configured.

### 1-Command Production Launch
```bash
docker compose up -d --build
```

### What this accomplishes:
1. **Stage 1 (Builder):** Installs packages, generates Prisma client, and compiles the React production bundle into `apps/web/dist`.
2. **Stage 2 (Runner):** Lightweight `node:20-alpine` image with Python 3, OpenSSL, non-root user, and persistent SQLite volume at `/app/apps/api/data`.
3. **Unified Server:** Express serves the API on `/api/*` and the compiled single-page frontend on all other routes.
4. **Health Check:** Automatic probe tests `http://localhost:4000/api/v1/health` every 30 seconds.

---

## 9. Available NPM Scripts

Run these scripts from the repository root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts both backend API and Vite web frontend concurrently |
| `npm run dev:api` | Starts only the backend API server with auto-reload (`node --watch`) |
| `npm run dev:web` | Starts only the Vite frontend dev server on port 5173 |
| `npm run dev:mobile` | Starts the React Native Expo development server |
| `npm run build` | Builds all monorepo packages and compiles the web production bundle |
| `npm test` | Runs the full Vitest automated test suite across all workspaces |
| `npm run db:generate` | Generates the typed Prisma Client |
| `npm run db:push` | Pushes the Prisma schema to the database (creates tables & indexes) |
| `npm run db:seed` | Populates the database with initial curriculums, users, and achievements |

---

## 10. REST API Specification

All primary endpoints are prefixed with `/api/v1` (with `/api` available as an alias for AI routes).

### Authentication & Profile
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new student workspace |
| `POST` | `/api/v1/auth/login` | Login with email/username and password |
| `POST` | `/api/v1/auth/quick-login` | 1-click preset student login (`swetha`, `prathima`) |
| `POST` | `/api/v1/auth/guest` | Instant guest session initialization |
| `GET`  | `/api/v1/auth/me` | Fetch authenticated user profile & preferences |
| `PUT`  | `/api/v1/auth/profile` | Update profile information and goals |

### Code Execution & Diagnostics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`  | `/api/v1/execution/runtimes` | List available language runtimes on server |
| `POST` | `/api/v1/execution/run` | Execute code in sandbox with friendly error diagnostics |

### AI Study Assistant
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/ai/chat` | Multi-turn conversational academic tutoring |
| `GET`  | `/api/v1/ai/stream` | Server-Sent Events (SSE) real-time token streaming |
| `POST` | `/api/v1/ai/study-plan/draft` | Context-aware constraint study plan generation |
| `POST` | `/api/v1/ai/explain-code` | Structured code breakdown, bug analysis, Big-O complexity |
| `POST` | `/api/v1/ai/practice-questions` | Generate active recall assessment questions |
| `POST` | `/api/v1/ai/revision-notes` | Generate high-yield study notes with LaTeX formulas |
| `POST` | `/api/v1/ai/generate-flashcards` | Generate spaced repetition flashcards |

### Study Planning & Sessions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`  | `/api/v1/study-plans` | Retrieve active study plans |
| `POST` | `/api/v1/study-plans` | Save and commit a reviewed study plan |
| `POST` | `/api/v1/study-plans/auto-schedule` | Execute deterministic constraint solver |
| `POST` | `/api/v1/study-plans/recover` | 1-click missed session recovery and rebalancing |
| `GET`  | `/api/v1/sessions` | Fetch scheduled calendar sessions |
| `PATCH`| `/api/v1/sessions/:id` | Update session progress, mark completed, verify for XP |

---

## 11. Keyboard Shortcuts

| Shortcut | Scope | Action |
| :--- | :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Global | Open Notion-Style Command Palette |
| `Alt + J` or `Ctrl + Shift + L` | Global | Toggle AI Study Assistant Drawer |
| `F5` or `Ctrl + Enter` | Student IDE | Run Code in Editor |
| `Ctrl + S` | Student IDE | Save Code File |
| `Esc` | Global | Close active modal, drawer, or dialog |

---

## 12. Testing & Quality Verification

The platform maintains an automated test suite verifying mathematical solvers, security boundaries, error handlers, and code execution engines.

```bash
# Run all tests across the monorepo
npm test

# Run backend API integration tests specifically
npm test --workspace=@ai-study/api

# Run domain algorithm unit tests (SM-2, Scheduler, XP Ledger)
npm test --workspace=@ai-study/domain
```

### Test Suite Summary (45/45 Passing)
* **`test/execution.test.js` (9 tests):** Python, JavaScript, Java class name detection, single-file compilation, SQL evaluation, runtime diagnostic extraction.
* **`test/huggingfaceAi.test.js` (11 tests):** Token validation, SSE streaming, multi-turn history sanitization, curriculum engine fallback.
* **`test/quickAuth.test.js` (4 tests):** Swetha, Prathima, and Guest authentication workflows.
* **`test/api.test.js` (10 tests):** Authentication, session tracking, reward minting, study plan lifecycle.
* **`test/aiPlanBuilder.test.js` (4 tests):** Constraint feasibility, pre-exam buffer checks, conflict prevention.
* **`src/__tests__/domain.test.ts` (7 tests):** Pure SuperMemo SM-2 interval calculations and XP thresholds.

---

## 13. Security & Production Hardening

1. **Zero Secret Leakage:** Client bundles contain 0 API keys. AI tokens (`HF_TOKEN`, `GEMINI_API_KEY`) and database credentials reside strictly on the server.
2. **Tenant Scoping:** Every database mutation and query strictly enforces `where: { userId }` isolation to eliminate Insecure Direct Object References (IDOR).
3. **Execution Sandbox Limits:** Code execution processes enforce a 5-second hard execution ceiling, execution in isolated temporary directories, and automatic directory cleanup.
4. **Anti-Tampering XP Ledger:** XP is minted server-side only when verified study thresholds are met ($\ge 15$ min, $\ge 70\%$ duration), backed by unique database composite keys.
5. **CORS & Rate Limiting:** Dynamic CORS policy whitelists configured origins while allowing same-origin serving. Built-in rate limiter caps requests at 1000 per 15 minutes.

---

## 14. Troubleshooting & FAQ

### Port 4000 or 5173 is already in use
Specify custom ports via environment variables:
```bash
PORT=4001 npm run dev:api
```

### Java Execution: `Could not find or load main class`
The runner uses Java 11+ single-file execution (`java <ClassName>.java`) and automatically extracts the class name containing your `main` method. Ensure your source code includes a valid entrypoint:
```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

### Hugging Face returns `No remaining credits`
Hugging Face occasionally routes serverless requests to third-party endpoints requiring credits. The platform automatically catches this error and engages its internal **Academic Curriculum Engine**, allowing uninterrupted study without failure.

### Resetting the Database
To clear the local SQLite database and restore the clean seed state:
```bash
npm run db:push
npm run db:seed
```

---

## 15. License

This project is licensed under the MIT License.
