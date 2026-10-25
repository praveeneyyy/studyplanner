/**
 * Universal Isomorphic API Client for Web & Mobile
 */
export class ApiClient {
    baseUrl;
    getToken;
    onUnauthorized;
    constructor(config = {}) {
        const rawUrl = config.baseUrl || (typeof process !== 'undefined' && process.env?.API_URL ? process.env.API_URL : '/api/v1');
        this.baseUrl = rawUrl.replace(/\/$/, '');
        this.getToken = config.getToken;
        this.onUnauthorized = config.onUnauthorized;
    }
    async request(endpoint, options = {}) {
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
    async register(body) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async login(body) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async quickLogin(scholar) {
        return this.request('/auth/quick-login', {
            method: 'POST',
            body: JSON.stringify({ scholar })
        });
    }
    async guestLogin() {
        return this.request('/auth/guest', {
            method: 'POST'
        });
    }
    async getMe() {
        return this.request('/auth/me');
    }
    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    }
    // ----------------------------------------------------
    // Subjects & Syllabus
    // ----------------------------------------------------
    async getSubjects() {
        return this.request('/subjects');
    }
    async createSubject(body) {
        return this.request('/subjects', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async getSubject(id) {
        return this.request(`/subjects/${id}`);
    }
    async createExamination(body) {
        return this.request('/examinations', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async createUnit(subjectId, body) {
        return this.request(`/subjects/${subjectId}/units`, {
            method: 'POST',
            body: JSON.stringify({ ...body, subjectId })
        });
    }
    async createTopic(unitId, body) {
        return this.request(`/units/${unitId}/topics`, {
            method: 'POST',
            body: JSON.stringify({ ...body, unitId })
        });
    }
    // ----------------------------------------------------
    // Study Planning & Sessions
    // ----------------------------------------------------
    async previewPlan(body) {
        return this.request('/planner/preview', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async confirmPlan(body) {
        return this.request('/planner/confirm', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async getPlannerContext() {
        return this.request('/planner/context');
    }
    async generateAiPlanDraft(data) {
        return this.request('/planner/ai-draft', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async adjustAiPlanDraft(data) {
        return this.request('/planner/adjust-draft', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async confirmAiPlanDraft(draft) {
        return this.request('/planner/confirm-ai-draft', {
            method: 'POST',
            body: JSON.stringify({ draft })
        });
    }
    async exportCalendarIcs(planId) {
        const url = `${this.baseUrl}/planner/export/ics${planId ? `?planId=${encodeURIComponent(planId)}` : ''}`;
        const token = this.getToken ? await this.getToken() : null;
        const headers = {};
        if (token)
            headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(url, { headers });
        if (!res.ok) {
            throw new Error(`Failed to export calendar (${res.status})`);
        }
        return res.blob();
    }
    async getSessions(startDate, endDate) {
        const params = new URLSearchParams();
        if (startDate)
            params.set('startDate', startDate);
        if (endDate)
            params.set('endDate', endDate);
        return this.request(`/sessions?${params.toString()}`);
    }
    async startSession(id) {
        return this.request(`/sessions/${id}/start`, { method: 'POST' });
    }
    async completeSession(id, body) {
        return this.request(`/sessions/${id}/complete`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async rescheduleSession(id, body) {
        return this.request(`/sessions/${id}/reschedule`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async recoverMissedSessions() {
        return this.request('/planner/recover-missed', { method: 'POST' });
    }
    // ----------------------------------------------------
    // AI Learning Assistant & Streaming
    // ----------------------------------------------------
    async getConversations() {
        return this.request('/ai/conversations');
    }
    async getConversation(id) {
        return this.request(`/ai/conversations/${id}`);
    }
    async createConversation(title, subjectContext, topicContext) {
        return this.request('/ai/conversations', {
            method: 'POST',
            body: JSON.stringify({ title, subjectContext, topicContext })
        });
    }
    /**
     * Streams AI completion tokens using Server-Sent Events (SSE)
     */
    async streamAI(req, callbacks) {
        const url = `${this.baseUrl}/ai/stream`;
        const headers = new Headers({
            'Content-Type': 'application/json',
            Accept: 'text/event-stream'
        });
        if (this.getToken) {
            const token = await this.getToken();
            if (token)
                headers.set('Authorization', `Bearer ${token}`);
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
            if (!reader)
                throw new Error('ReadableStream not supported on response body.');
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim())
                        continue;
                    const matchEvent = line.match(/^event:\s*(\w+)/m);
                    const matchData = line.match(/^data:\s*(.+)$/m);
                    const eventType = matchEvent ? matchEvent[1] : 'delta';
                    if (matchData) {
                        try {
                            const parsed = JSON.parse(matchData[1]);
                            if (eventType === 'delta') {
                                callbacks.onDelta(parsed.text || '');
                            }
                            else if (eventType === 'done') {
                                callbacks.onDone?.(parsed);
                            }
                            else if (eventType === 'error') {
                                callbacks.onError?.(parsed);
                            }
                        }
                        catch {
                            // Ignore partial JSON parse errors
                        }
                    }
                }
            }
        }
        catch (err) {
            callbacks.onError?.(err);
        }
    }
    // ----------------------------------------------------
    // Hugging Face Qwen3 AI Assistant Endpoints
    // ----------------------------------------------------
    async aiChat(data, signal) {
        return this.request('/ai/chat', {
            method: 'POST',
            body: JSON.stringify(data),
            signal
        });
    }
    async aiStudyPlanDraft(data, signal) {
        return this.request('/ai/study-plan/draft', {
            method: 'POST',
            body: JSON.stringify(data),
            signal
        });
    }
    async aiExplainCode(data) {
        return this.request('/ai/explain-code', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async aiPracticeQuestions(data) {
        return this.request('/ai/practice-questions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async aiRevisionNotes(data) {
        return this.request('/ai/revision-notes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async aiNextSteps() {
        return this.request('/ai/next-steps', {
            method: 'POST'
        });
    }
    // ----------------------------------------------------
    // Assessments, Quizzes & Weak Topics
    // ----------------------------------------------------
    async getWeakTopics() {
        return this.request('/quizzes/weak-topics');
    }
    async getQuiz(id) {
        return this.request(`/quizzes/${id}`);
    }
    async submitQuizAttempt(body) {
        return this.request('/quizzes/attempts', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    // ----------------------------------------------------
    // Spaced Repetition (SRS)
    // ----------------------------------------------------
    async getRevisionQueue() {
        return this.request('/revision/queue');
    }
    async recordRecall(body) {
        return this.request('/revision/record-recall', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    // ----------------------------------------------------
    // Rewards & Gamification
    // ----------------------------------------------------
    async getRewardsSummary() {
        return this.request('/rewards/summary');
    }
    async getAchievements() {
        return this.request('/rewards/achievements');
    }
    async getRewardLedger(page = 1, limit = 20) {
        return this.request(`/rewards/ledger?page=${page}&limit=${limit}`);
    }
    // ----------------------------------------------------
    // Analytics & Preferences
    // ----------------------------------------------------
    async getDashboardAnalytics() {
        return this.request('/analytics/dashboard');
    }
    async getPreferences() {
        return this.request('/preferences');
    }
    async updatePreferences(body) {
        return this.request('/preferences', {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }
}
//# sourceMappingURL=index.js.map