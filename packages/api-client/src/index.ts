/**
 * Universal Isomorphic API Client for Web & Mobile
 */

import type {
  RegisterRequest,
  LoginRequest,
  CreateSubject,
  CreateExamination,
  CreateUnit,
  CreateTopic,
  GeneratePlanRequest,
  CompleteSessionRequest,
  RescheduleSessionRequest,
  AIStreamRequest,
  SubmitQuizAttempt,
  RecordRecallRequest,
  UpdatePreferences
} from '@ai-study/shared-schemas';

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseUrl: string;
  private getToken?: () => string | null | Promise<string | null>;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // include cookies for web
    });

    if (response.status === 401 && this.onUnauthorized) {
      this.onUnauthorized();
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || `HTTP Error ${response.status}`);
    }

    return data;
  }

  // ----------------------------------------------------
  // Auth
  // ----------------------------------------------------
  async register(body: RegisterRequest) {
    return this.request<{ success: boolean; data: { user: any; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async login(body: LoginRequest) {
    return this.request<{ success: boolean; data: { user: any; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async quickLogin(scholar: 'swetha' | 'prathima') {
    return this.request<{ success: boolean; data: { user: any; token: string } }>('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ scholar })
    });
  }

  async guestLogin() {
    return this.request<{ success: boolean; data: { user: any; token: string } }>('/auth/guest', {
      method: 'POST'
    });
  }

  async getMe() {
    return this.request<{ success: boolean; data: { user: any } }>('/auth/me');
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }

  // ----------------------------------------------------
  // Subjects & Syllabus
  // ----------------------------------------------------
  async getSubjects() {
    return this.request<{ success: boolean; data: any[] }>('/subjects');
  }

  async createSubject(body: CreateSubject) {
    return this.request<{ success: boolean; data: any }>('/subjects', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async getSubject(id: string) {
    return this.request<{ success: boolean; data: any }>(`/subjects/${id}`);
  }

  async createExamination(body: CreateExamination) {
    return this.request<{ success: boolean; data: any }>('/examinations', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async createUnit(subjectId: string, body: Omit<CreateUnit, 'subjectId'>) {
    return this.request<{ success: boolean; data: any }>(`/subjects/${subjectId}/units`, {
      method: 'POST',
      body: JSON.stringify({ ...body, subjectId })
    });
  }

  async createTopic(unitId: string, body: Omit<CreateTopic, 'unitId'>) {
    return this.request<{ success: boolean; data: any }>(`/units/${unitId}/topics`, {
      method: 'POST',
      body: JSON.stringify({ ...body, unitId })
    });
  }

  // ----------------------------------------------------
  // Study Planning & Sessions
  // ----------------------------------------------------
  async previewPlan(body: GeneratePlanRequest) {
    return this.request<{ success: boolean; data: any }>('/planner/preview', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async confirmPlan(body: GeneratePlanRequest) {
    return this.request<{ success: boolean; data: any }>('/planner/confirm', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async getPlannerContext() {
    return this.request<{ success: boolean; data: any }>('/planner/context');
  }

  async generateAiPlanDraft(data: { prompt: string; constraints?: any; history?: any[] }) {
    return this.request<{ success: boolean; data: { draft: any; message: string; constraints: any; studentContext: any } }>('/planner/ai-draft', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async adjustAiPlanDraft(data: { draft: any; action: string; params?: any }) {
    return this.request<{ success: boolean; data: { draft: any; message: string } }>('/planner/adjust-draft', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async confirmAiPlanDraft(draft: any) {
    return this.request<{ success: boolean; data: any }>('/planner/confirm-ai-draft', {
      method: 'POST',
      body: JSON.stringify({ draft })
    });
  }

  async exportCalendarIcs(planId?: string): Promise<Blob> {
    const url = `${this.baseUrl}/planner/export/ics${planId ? `?planId=${encodeURIComponent(planId)}` : ''}`;
    const token = this.getToken ? await this.getToken() : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to export calendar (${res.status})`);
    }
    return res.blob();
  }

  async getSessions(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return this.request<{ success: boolean; data: any[] }>(`/sessions?${params.toString()}`);
  }

  async startSession(id: string) {
    return this.request<{ success: boolean; data: any }>(`/sessions/${id}/start`, { method: 'POST' });
  }

  async completeSession(id: string, body: CompleteSessionRequest) {
    return this.request<{ success: boolean; data: { session: any; reward: any } }>(`/sessions/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async rescheduleSession(id: string, body: RescheduleSessionRequest) {
    return this.request<{ success: boolean; data: any }>(`/sessions/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async recoverMissedSessions() {
    return this.request<{ success: boolean; data: any }>('/planner/recover-missed', { method: 'POST' });
  }

  // ----------------------------------------------------
  // AI Learning Assistant & Streaming
  // ----------------------------------------------------
  async getConversations() {
    return this.request<{ success: boolean; data: any[] }>('/ai/conversations');
  }

  async getConversation(id: string) {
    return this.request<{ success: boolean; data: any }>(`/ai/conversations/${id}`);
  }

  async createConversation(title?: string, subjectContext?: string, topicContext?: string) {
    return this.request<{ success: boolean; data: any }>('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, subjectContext, topicContext })
    });
  }

  /**
   * Streams AI completion tokens using Server-Sent Events (SSE)
   */
  async streamAI(
    req: AIStreamRequest,
    callbacks: {
      onDelta: (text: string) => void;
      onDone?: (info: any) => void;
      onError?: (err: any) => void;
    }
  ) {
    const url = `${this.baseUrl}/ai/stream`;
    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    });

    if (this.getToken) {
      const token = await this.getToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`AI Streaming error: HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported on response body.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const matchEvent = line.match(/^event:\s*(\w+)/m);
          const matchData = line.match(/^data:\s*(.+)$/m);
          const eventType = matchEvent ? matchEvent[1] : 'delta';

          if (matchData) {
            try {
              const parsed = JSON.parse(matchData[1]);
              if (eventType === 'delta') {
                callbacks.onDelta(parsed.text || '');
              } else if (eventType === 'done') {
                callbacks.onDone?.(parsed);
              } else if (eventType === 'error') {
                callbacks.onError?.(parsed);
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    } catch (err) {
      callbacks.onError?.(err);
    }
  }

  // ----------------------------------------------------
  // Hugging Face Qwen3 AI Assistant Endpoints
  // ----------------------------------------------------
  async aiChat(data: { message: string; history?: Array<{ role: 'user' | 'assistant'; content: string }> }, signal?: AbortSignal) {
    return this.request<{
      success: boolean;
      answer: string;
      model: string;
      provider: string;
      notice?: string;
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
      signal
    });
  }

  async aiStudyPlanDraft(data: { prompt?: string; constraints?: any; history?: any[] }, signal?: AbortSignal) {
    return this.request<{
      success: boolean;
      data: {
        draft: any;
        message: string;
        constraints: any;
        studentContext: any;
      };
    }>('/ai/study-plan/draft', {
      method: 'POST',
      body: JSON.stringify(data),
      signal
    });
  }

  async aiExplainCode(data: { code: string; language?: string; error?: string }) {
    return this.request<{ success: boolean; data: { answer: string; model: string; provider: string } }>('/ai/explain-code', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async aiPracticeQuestions(data: { topicTitle: string; subjectName?: string; difficulty?: number; count?: number }) {
    return this.request<{ success: boolean; data: { answer: string; model: string; provider: string } }>('/ai/practice-questions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async aiRevisionNotes(data: { topicTitle: string; subjectName?: string; material?: string }) {
    return this.request<{ success: boolean; data: { answer: string; model: string; provider: string } }>('/ai/revision-notes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async aiNextSteps() {
    return this.request<{ success: boolean; data: { recommendations: string; contextSummary: any } }>('/ai/next-steps', {
      method: 'POST'
    });
  }

  // ----------------------------------------------------
  // Assessments, Quizzes & Weak Topics
  // ----------------------------------------------------
  async getWeakTopics() {
    return this.request<{ success: boolean; data: any[] }>('/quizzes/weak-topics');
  }

  async getQuiz(id: string) {
    return this.request<{ success: boolean; data: any }>(`/quizzes/${id}`);
  }

  async submitQuizAttempt(body: SubmitQuizAttempt) {
    return this.request<{ success: boolean; data: any }>('/quizzes/attempts', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // ----------------------------------------------------
  // Spaced Repetition (SRS)
  // ----------------------------------------------------
  async getRevisionQueue() {
    return this.request<{ success: boolean; data: { dueToday: any[]; overdue: any[]; upcoming: any[] } }>(
      '/revision/queue'
    );
  }

  async recordRecall(body: RecordRecallRequest) {
    return this.request<{ success: boolean; data: any }>('/revision/record-recall', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // ----------------------------------------------------
  // Rewards & Gamification
  // ----------------------------------------------------
  async getRewardsSummary() {
    return this.request<{ success: boolean; data: any }>('/rewards/summary');
  }

  async getAchievements() {
    return this.request<{ success: boolean; data: any[] }>('/rewards/achievements');
  }

  async getRewardLedger(page = 1, limit = 20) {
    return this.request<{ success: boolean; data: any }>(`/rewards/ledger?page=${page}&limit=${limit}`);
  }

  // ----------------------------------------------------
  // Analytics & Preferences
  // ----------------------------------------------------
  async getDashboardAnalytics() {
    return this.request<{ success: boolean; data: any }>('/analytics/dashboard');
  }

  async getPreferences() {
    return this.request<{ success: boolean; data: any }>('/preferences');
  }

  async updatePreferences(body: UpdatePreferences) {
    return this.request<{ success: boolean; data: any }>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
}
