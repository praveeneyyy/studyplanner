# Hugging Face Qwen3 AI Integration — Smart Study Planner

This document provides a comprehensive operational guide for the AI integration powered by Hugging Face's Inference API (`@huggingface/inference`) with the open-weights model **`Qwen/Qwen3-4B-Instruct-2507`**.

---

## 1. Architecture & Design Principles

The AI service is engineered for resilient, educational-first assistance:

1. **Server-Side Token Isolation**: The Hugging Face API key (`HF_TOKEN`) is only ever accessed on the Node.js backend. It is never sent to the browser or compiled into client-side bundles.
2. **Deterministic Fallbacks**: If `HF_TOKEN` is unset, rate-limited, or if the Hugging Face API endpoint undergoes a cold boot / 503 Service Unavailable, the system gracefully falls back to deterministic, domain-specific educational heuristics and curriculum models rather than crashing or stranding the student.
3. **Structured Outputs**: Prompts enforce structured JSON responses for complex operations (study plan drafts, practice questions, revision notes, flashcards) with fallback parsers and schema validation.
4. **Zero-Emoji SVG Standard**: Consistent with project rules, all interface elements and icons utilize Lucide SVG icons instead of emojis.

---

## 2. Environment Configuration

Configure the environment variables in `apps/api/.env` (or root `.env`):

```bash
# Hugging Face Inference API Configuration
HF_TOKEN=hf_your_actual_token_here
HF_MODEL_ID=Qwen/Qwen3-4B-Instruct-2507
```

> **Note**: An access token can be obtained for free at [Hugging Face Settings -> Tokens](https://huggingface.co/settings/tokens) with `read` permissions.

---

## 3. Endpoints & API Reference

All AI endpoints are mounted under both `/api/v1/ai/*` and `/api/ai/*` for full backwards and alias compatibility.

### 3.1 Chat Assistant (`POST /api/ai/chat`)
Sends a message to the AI study assistant with conversation context.

- **Headers**: `Authorization: Bearer <token>` (optional if authenticated or guest), `Content-Type: application/json`
- **Body**:
  ```json
  {
    "message": "Explain Dijkstra's algorithm step-by-step with complexity.",
    "history": [
      { "role": "user", "content": "Hi, I need help with Graph algorithms." },
      { "role": "assistant", "content": "I'd be glad to help! Which algorithm are you studying?" }
    ],
    "context": {
      "subject": "Algorithms & Data Structures",
      "examDate": "2026-11-15"
    }
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "model": "Qwen/Qwen3-4B-Instruct-2507",
    "provider": "huggingface",
    "reply": "Dijkstra's Algorithm finds the shortest paths from a single source vertex to all other vertices in a weighted graph with non-negative edge weights...",
    "usage": { "promptTokens": 142, "completionTokens": 310 }
  }
  ```

### 3.2 Live SSE Streaming (`GET /api/ai/stream?message=...`)
Streams tokens in real time using Server-Sent Events (`text/event-stream`).

- **Query Parameters**:
  - `message`: encoded user prompt
  - `token`: Bearer JWT token
- **Stream format**:
  ```text
  data: {"delta": "Dijkstra's"}
  data: {"delta": " algorithm"}
  data: {"done": true}
  ```

### 3.3 Context-Aware Study Plan Draft (`POST /api/ai/study-plan/draft`)
Analyzes student constraints and generates a balanced, conflict-free study schedule.

- **Body**:
  ```json
  {
    "targetExamDate": "2026-11-20",
    "dailyAvailableHours": 4,
    "weakTopics": ["Binary Search Trees", "Dynamic Programming"],
    "subjects": ["Algorithms", "Computer Systems"]
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "model": "Qwen/Qwen3-4B-Instruct-2507",
    "draft": {
      "title": "Algorithms & Computer Systems Intensive",
      "startDate": "2026-10-24",
      "endDate": "2026-11-20",
      "totalHours": 108,
      "sessions": [
        {
          "subject": "Algorithms",
          "topic": "Binary Search Trees & Balancing",
          "allocatedHours": 2,
          "difficulty": "hard",
          "date": "2026-10-24"
        }
      ]
    }
  }
  ```

### 3.4 Code Diagnostics & Explanation (`POST /api/ai/explain-code`)
Explains code, runtime errors, or time/space complexity for the Student IDE.

- **Body**:
  ```json
  {
    "code": "function binarySearch(arr, target) { ... }",
    "language": "javascript",
    "error": "ReferenceError: mid is not defined"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "model": "Qwen/Qwen3-4B-Instruct-2507",
    "explanation": "The ReferenceError occurs because `mid` was referenced before declaration. In JavaScript, declare `let mid = Math.floor((low + high) / 2);` inside the while loop."
  }
  ```

### 3.5 Practice Questions (`POST /api/ai/practice-questions`)
Generates multiple-choice and conceptual practice questions for active recall.

- **Body**:
  ```json
  {
    "topic": "Memory Hierarchy and Cache Coherence",
    "count": 3,
    "difficulty": "medium"
  }
  ```

### 3.6 Revision Notes (`POST /api/ai/revision-notes`)
Generates structured markdown revision summaries and key formulas for high-yield review.

- **Body**:
  ```json
  {
    "topic": "Relational Normalization: 1NF to BCNF",
    "format": "bullet-summary"
  }
  ```

---

## 4. Frontend Integration Points

1. **Floating AI Agent (`AIAgentAvatar.tsx`)**:
   - Fixed to the bottom-right corner of the learning workspace.
   - Badge displays active model: `Qwen3-4B`.
   - Real-time status indicators: `Ready`, `Thinking...`, `Error`.
   - Supports keyboard shortcut (`Alt+J` or `Ctrl+Shift+L` to toggle).
   - AbortController `Square` button allows canceling in-flight generation.

2. **Dashboard Plan Builder Drawer (`AIPlanBuilderDrawer.tsx`)**:
   - Conversational prompt interface that sends user schedule constraints to `POST /api/ai/study-plan/draft`.
   - Preview modal allows previewing sessions, editing blocks, and validating workload before saving.
   - Never auto-saves to database without student approval.

3. **Student IDE AI Assistant Panel (`AIAgentSidePanel.tsx`)**:
   - Integrated into the Monaco-based multi-language code editor.
   - Provides one-click "Explain Code", "Fix Error", and "Optimize" buttons linked directly to backend code explanation endpoints.

---

## 5. Verification & Testing

Run the automated test suite covering all AI endpoints and fallbacks:

```bash
# Run backend test suite
npm test --workspace=@ai-study/api

# Run entire monorepo test suite
npm test
```

All 39 unit and integration tests verify:
- Input sanitization and bounded conversation history
- Token presence / absence handling
- Fallback activation under network disconnection or missing credentials
- Structured study plan schema generation
- Code diagnostic parsing
