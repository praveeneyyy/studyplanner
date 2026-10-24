# System Architecture & Technical Design
## AI Smart Study Planner

**Version:** 1.0.0  
**Status:** Approved  
**Language/Runtime:** Node.js (JavaScript ES Modules) / React (TypeScript) / React Native (Expo)

---

## 1. System Context & Monorepo Layout

The AI Smart Study Planner is structured as an enterprise-grade monorepo containing three core applications and four shared packages. This guarantees shared typing, unified validation rules, and cohesive business domain logic across web and native mobile clients.

```text
ai-smart-study-planner/
├── apps/
│   ├── web/                     # React 18 + Vite + Tailwind CSS + shadcn/ui + Three.js/R3F
│   ├── mobile/                  # React Native + Expo Router + TypeScript + Reanimated
│   └── api/                     # Node.js (ESM) + Express + Prisma ORM + SSE + Pino
├── packages/
│   ├── shared-schemas/          # Zod request/response validation schemas & TypeScript types
│   ├── design-tokens/           # Design system tokens (colors, typography, spacing, themes)
│   ├── domain/                  # Pure deterministic algorithms (Scheduling, SM-2, XP, Streaks)
│   └── api-client/              # Universal isomorphic typed HTTP/SSE API client
├── docs/                        # Complete technical specifications
├── design/                      # UI/UX design specifications
├── package.json                 # Monorepo workspace configuration
├── .env.example
└── README.md
```

### High-Level System Context Diagram

```mermaid
graph TB
    subgraph Clients
        Web["Web Application<br/>(React + Vite + R3F)"]
        Mobile["Mobile Native App<br/>(React Native / Expo)"]
    end

    subgraph Edge_Gateway["API Gateway & Transport Layer"]
        CORS["CORS & Helmet Security"]
        RateLimit["Rate Limiter (express-rate-limit)"]
        Router["Express REST Router (/api/v1)"]
        SSERoute["Server-Sent Events Gateway (/api/v1/ai/stream)"]
    end

    subgraph Service_Layer["Domain Service Layer"]
        AuthSvc["Auth & Security Service (JWT / Argon2)"]
        PlanSvc["Deterministic Scheduling Engine"]
        AISvc["AI Model Gateway (WatsonX / Gemini / Demo)"]
        QuizSvc["Assessment & Weak-Topic Analyzer"]
        RevSvc["Spaced Repetition Service (SM-2)"]
        RewardSvc["Reward Ledger & Streak Engine"]
    end

    subgraph Persistence["Storage & External APIs"]
        Prisma["Prisma ORM Client"]
        Database[(PostgreSQL / SQLite Storage)]
        LLMProvider["IBM watsonx / Google Gemini API"]
    end

    Web --> CORS
    Mobile --> CORS
    CORS --> RateLimit
    RateLimit --> Router
    RateLimit --> SSERoute

    Router --> AuthSvc
    Router --> PlanSvc
    Router --> QuizSvc
    Router --> RevSvc
    Router --> RewardSvc
    SSERoute --> AISvc

    AuthSvc --> Prisma
    PlanSvc --> Prisma
    QuizSvc --> Prisma
    RevSvc --> Prisma
    RewardSvc --> Prisma

    AISvc --> LLMProvider
    Prisma --> Database
```

---

## 2. Web Frontend Architecture (`apps/web`)

The web frontend is built with modern React 18, Vite, TypeScript, and a bespoke design system inspired by Linear and Notion.

```mermaid
graph TD
    subgraph Presentation_Layer
        Router["React Router (v6)"]
        Layout["Root Layout (Sidebar + TopBar + Theme)"]
        Views["Page Views (Dashboard, Planner, AI Tutor, Universe)"]
        Modals["Accessible Dialogs & Action Sheets"]
    end

    subgraph State_And_Data
        TanStack["TanStack Query (Cache, Invalidation)"]
        Zustand["Zustand Client State (Active Session Timer, Audio)"]
        APIClient["@ai-study/api-client"]
    end

    subgraph Visual_Engine
        DOM["Tailwind CSS + shadcn/ui components"]
        R3F["React Three Fiber / Three.js (Universe, Progress Orb)"]
        Motion["Framer Motion (Transitions, Micro-interactions)"]
    end

    Router --> Layout
    Layout --> Views
    Views --> TanStack
    Views --> Zustand
    Views --> DOM
    Views --> R3F
    Views --> Motion
    TanStack --> APIClient
```

---

## 3. Mobile Native Architecture (`apps/mobile`)

The mobile client is built on React Native with Expo and Expo Router, engineered for native tactile interactions, safe-area adaptation, and offline-resilient access.

```mermaid
graph TD
    subgraph Navigation_Stack
        Tabs["Bottom Tab Navigator (Home, Plan, AI Tutor, Subjects, Profile)"]
        NativeSheets["BottomSheet Modals (Session Detail, Quick Log)"]
        Stack["Nested Stack Routes"]
    end

    subgraph Native_Capabilities
        Haptics["Expo Haptics (Feedback on Study Complete)"]
        SecureStore["Expo SecureStore (Auth Tokens)"]
        AsyncStore["AsyncStorage (Offline Cache)"]
        Notify["Expo Notifications (Study Reminders)"]
    end

    subgraph Shared_Integration
        MobileQuery["TanStack Query (Cached REST Data)"]
        MobileClient["@ai-study/api-client"]
        Tokens["@ai-study/design-tokens"]
    end

    Tabs --> Stack
    Stack --> NativeSheets
    Stack --> MobileQuery
    MobileQuery --> MobileClient
    Stack --> Tokens
    Stack --> Haptics
    MobileClient --> SecureStore
```

---

## 4. AI Question & Streaming Lifecycle

The AI subsystem guarantees transparent, failure-resilient communication with language models.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Web/Mobile)
    participant UI as Chat View / Client
    participant API as Express API Server
    participant Gateway as AI Provider Gateway
    participant LLM as watsonx / Gemini / Demo Tutor
    participant DB as Prisma Database

    Student->>UI: Types question & selects format (e.g. 5-Mark Exam Answer)
    UI->>API: POST /api/v1/ai/stream (conversationId, topicId, prompt, format)
    API->>DB: Verify conversation ownership & store User Message
    API->>Gateway: streamCompletion({ prompt, topicContext, formatPrompt })
    Gateway->>LLM: Invoke Model with Structured System Persona
    
    alt Model Responds with Tokens
        loop Stream Chunks
            LLM-->>Gateway: Delta Token
            Gateway-->>API: SSE payload: "event: delta\ndata: {...}\n\n"
            API-->>UI: Real-time token render in Markdown
        end
        Gateway-->>API: End of Stream (Total Tokens, Finish Reason)
        API->>DB: Persist Assistant Message
        API-->>UI: SSE payload: "event: done\ndata: { messageId }\n\n"
    else Model Errors or Rate Limits (429 / 503)
        LLM-->>Gateway: Error / Timeout
        Gateway-->>API: Fallback to Verified Domain Curriculum
        API-->>UI: SSE payload: "event: fallback\ndata: { fallbackContent, warning }\n\n"
        API->>DB: Store Fallback Message with flagged status
    end
```

---

## 5. Study-Plan Generation Pipeline

The deterministic study-plan generation pipeline executes in four disciplined phases:

```mermaid
flowchart TD
    A[Start: Generate Plan Request] --> B[Fetch User Inputs: Exams, Availability, Syllabus, Existing Progress]
    B --> C{Verify Feasibility}
    C -- Infeasible: Total Topic Hours > Available Hours --> D[Return Feasibility Warning & Minimum Required Hours]
    C -- Feasible --> E[Calculate Topic Priority Weights]
    
    subgraph Topic_Scoring
        E --> E1["Weight = Difficulty (1-5) * 0.3 + Importance (1-5) * 0.35 + (6 - Confidence) * 0.25 + ExamUrgency * 0.1"]
    end

    E1 --> F[Sort Topics by Exam Date ASC, then Priority Weight DESC]
    F --> G[Generate Available Time Slots across Date Range]
    G --> H[Reserve Final 20% Pre-Exam Period for Revision Buffers]
    H --> I[Assign Topics to Slots matching Preferred Session Duration]
    I --> J[Insert 10-15m Rest Breaks between Slots]
    J --> K[Persist Plan in Transaction: StudyPlan & StudySessions]
    K --> L[Emit Plan Generated Event to Client]
```

---

## 6. Adaptive Rescheduling & Missed-Session Recovery

When a student misses a planned session, the system prevents silent backlog accumulation:

```mermaid
flowchart LR
    MissedSession["Missed / Skipped Session Detected"] --> CheckExam["Check Target Exam Date"]
    CheckExam --> FindSlots["Find Upcoming Under-Capacity Days"]
    FindSlots --> SlotFound{"Slot Available Before Exam?"}
    
    SlotFound -- Yes --> Reassign["Move Topic to Nearest Free Slot without overloading daily cap"]
    SlotFound -- No --> Rebalance["Rebalance: Condense low-priority elective topics or propose revised daily target"]
    
    Reassign --> Commit["Update StudySession record & notify student"]
    Rebalance --> Commit
```

---

## 7. Verified Reward Event Processing & Anti-Abuse Architecture

To ensure game mechanics foster genuine productivity rather than dopamine-chasing exploits, all XP, levels, and streaks are backed by an immutable ledger:

```mermaid
sequenceDiagram
    actor Student
    participant Client as Web / Mobile UI
    participant API as /api/v1/sessions/:id/complete
    participant Engine as Reward Ledger Engine
    participant DB as Prisma Database

    Student->>Client: Clicks "Complete Session"
    Client->>API: POST /api/v1/sessions/101/complete { actualDuration: 45, confidence: 4 }
    
    API->>DB: Query Session 101
    Note over API,DB: Validation Checks:<br/>1. Session status == 'IN_PROGRESS' or 'PLANNED'<br/>2. actualDuration >= plannedDuration * 0.7<br/>3. Session belongs to authenticated user
    
    alt Validation Fails
        API-->>Client: 400 Bad Request ("Session duration criteria not met")
    else Validation Passes
        API->>DB: Update Session status to 'COMPLETED'
        API->>Engine: processRewardEvent({ userId, eventType: 'SESSION_COMPLETE', sourceId: '101', xp: 25 })
        
        Engine->>DB: Check RewardLedgerEntry where sourceId='101' and eventType='SESSION_COMPLETE'
        alt Record Exists (Replay Attack)
            Engine-->>API: Duplicate ignored, return existing balance
        else Fresh Record
            Engine->>DB: INSERT into RewardLedgerEntry (id, userId, eventType, sourceId, xp: 25)
            Engine->>DB: UPDATE User balance (totalXP += 25)
            Engine->>Engine: Re-evaluate Level Thresholds & Achievements
            Engine->>DB: UPDATE UserStreak (calculate daily timezone boundary)
            Engine-->>API: Reward Outcome: { xpAwarded: 25, newTotalXP: 450, levelUp: false, unlockedAchievements: [] }
        end
        API-->>Client: 200 OK with Reward Outcome & Haptic trigger data
    end
```

---

## 8. Database Entity Relationships Overview

The schema is normalized to ensure data integrity, cascade deletion safety, and fast query indexing across user workspaces.

```mermaid
erDiagram
    User ||--o{ UserPreference : has
    User ||--o{ Subject : creates
    User ||--o{ StudyPlan : owns
    User ||--o{ Note : writes
    User ||--o{ AIConversation : holds
    User ||--o{ QuizAttempt : takes
    User ||--o{ RewardLedgerEntry : earns
    User ||--o{ UserAchievement : unlocks
    User ||--o{ UserStreak : maintains

    Subject ||--o{ Examination : scheduled_for
    Subject ||--o{ SyllabusUnit : divided_into
    SyllabusUnit ||--o{ Topic : contains

    Topic ||--o{ StudySession : scheduled_in
    Topic ||--o{ RevisionRecord : reviewed_via
    Topic ||--o{ TopicProgress : tracked_by
    Topic ||--o{ QuizQuestion : assessed_by

    StudyPlan ||--o{ StudySession : contains
    Quiz ||--o{ QuizQuestion : has
    Quiz ||--o{ QuizAttempt : generates
    QuizAttempt ||--o{ QuizResponse : records
```
