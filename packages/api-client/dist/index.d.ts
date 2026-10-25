/**
 * Universal Isomorphic API Client for Web & Mobile
 */
import type { RegisterRequest, LoginRequest, CreateSubject, CreateExamination, CreateUnit, CreateTopic, GeneratePlanRequest, CompleteSessionRequest, RescheduleSessionRequest, AIStreamRequest, SubmitQuizAttempt, RecordRecallRequest, UpdatePreferences } from '@ai-study/shared-schemas';
export interface ApiClientConfig {
    baseUrl?: string;
    getToken?: () => string | null | Promise<string | null>;
    onUnauthorized?: () => void;
}
export declare class ApiClient {
    private baseUrl;
    private getToken?;
    private onUnauthorized?;
    constructor(config?: ApiClientConfig);
    request<T>(endpoint: string, options?: RequestInit): Promise<T>;
    register(body: RegisterRequest): Promise<{
        success: boolean;
        data: {
            user: any;
            token: string;
        };
    }>;
    login(body: LoginRequest): Promise<{
        success: boolean;
        data: {
            user: any;
            token: string;
        };
    }>;
    quickLogin(scholar: 'swetha' | 'prathima'): Promise<{
        success: boolean;
        data: {
            user: any;
            token: string;
        };
    }>;
    guestLogin(): Promise<{
        success: boolean;
        data: {
            user: any;
            token: string;
        };
    }>;
    getMe(): Promise<{
        success: boolean;
        data: {
            user: any;
        };
    }>;
    logout(): Promise<{
        success: boolean;
    }>;
    getSubjects(): Promise<{
        success: boolean;
        data: any[];
    }>;
    createSubject(body: CreateSubject): Promise<{
        success: boolean;
        data: any;
    }>;
    getSubject(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createExamination(body: CreateExamination): Promise<{
        success: boolean;
        data: any;
    }>;
    createUnit(subjectId: string, body: Omit<CreateUnit, 'subjectId'>): Promise<{
        success: boolean;
        data: any;
    }>;
    createTopic(unitId: string, body: Omit<CreateTopic, 'unitId'>): Promise<{
        success: boolean;
        data: any;
    }>;
    previewPlan(body: GeneratePlanRequest): Promise<{
        success: boolean;
        data: any;
    }>;
    confirmPlan(body: GeneratePlanRequest): Promise<{
        success: boolean;
        data: any;
    }>;
    getPlannerContext(): Promise<{
        success: boolean;
        data: any;
    }>;
    generateAiPlanDraft(data: {
        prompt: string;
        constraints?: any;
        history?: any[];
    }): Promise<{
        success: boolean;
        data: {
            draft: any;
            message: string;
            constraints: any;
            studentContext: any;
        };
    }>;
    adjustAiPlanDraft(data: {
        draft: any;
        action: string;
        params?: any;
    }): Promise<{
        success: boolean;
        data: {
            draft: any;
            message: string;
        };
    }>;
    confirmAiPlanDraft(draft: any): Promise<{
        success: boolean;
        data: any;
    }>;
    exportCalendarIcs(planId?: string): Promise<Blob>;
    getSessions(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: any[];
    }>;
    startSession(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    completeSession(id: string, body: CompleteSessionRequest): Promise<{
        success: boolean;
        data: {
            session: any;
            reward: any;
        };
    }>;
    rescheduleSession(id: string, body: RescheduleSessionRequest): Promise<{
        success: boolean;
        data: any;
    }>;
    recoverMissedSessions(): Promise<{
        success: boolean;
        data: any;
    }>;
    getConversations(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getConversation(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createConversation(title?: string, subjectContext?: string, topicContext?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    /**
     * Streams AI completion tokens using Server-Sent Events (SSE)
     */
    streamAI(req: AIStreamRequest, callbacks: {
        onDelta: (text: string) => void;
        onDone?: (info: any) => void;
        onError?: (err: any) => void;
    }): Promise<void>;
    aiChat(data: {
        message: string;
        history?: Array<{
            role: 'user' | 'assistant';
            content: string;
        }>;
    }, signal?: AbortSignal): Promise<{
        success: boolean;
        answer: string;
        model: string;
        provider: string;
        notice?: string;
    }>;
    aiStudyPlanDraft(data: {
        prompt?: string;
        constraints?: any;
        history?: any[];
    }, signal?: AbortSignal): Promise<{
        success: boolean;
        data: {
            draft: any;
            message: string;
            constraints: any;
            studentContext: any;
        };
    }>;
    aiExplainCode(data: {
        code: string;
        language?: string;
        error?: string;
    }): Promise<{
        success: boolean;
        data: {
            answer: string;
            model: string;
            provider: string;
        };
    }>;
    aiPracticeQuestions(data: {
        topicTitle: string;
        subjectName?: string;
        difficulty?: number;
        count?: number;
    }): Promise<{
        success: boolean;
        data: {
            answer: string;
            model: string;
            provider: string;
        };
    }>;
    aiRevisionNotes(data: {
        topicTitle: string;
        subjectName?: string;
        material?: string;
    }): Promise<{
        success: boolean;
        data: {
            answer: string;
            model: string;
            provider: string;
        };
    }>;
    aiNextSteps(): Promise<{
        success: boolean;
        data: {
            recommendations: string;
            contextSummary: any;
        };
    }>;
    getWeakTopics(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getQuiz(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    submitQuizAttempt(body: SubmitQuizAttempt): Promise<{
        success: boolean;
        data: any;
    }>;
    getRevisionQueue(): Promise<{
        success: boolean;
        data: {
            dueToday: any[];
            overdue: any[];
            upcoming: any[];
        };
    }>;
    recordRecall(body: RecordRecallRequest): Promise<{
        success: boolean;
        data: any;
    }>;
    getRewardsSummary(): Promise<{
        success: boolean;
        data: any;
    }>;
    getAchievements(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getRewardLedger(page?: number, limit?: number): Promise<{
        success: boolean;
        data: any;
    }>;
    getDashboardAnalytics(): Promise<{
        success: boolean;
        data: any;
    }>;
    getPreferences(): Promise<{
        success: boolean;
        data: any;
    }>;
    updatePreferences(body: UpdatePreferences): Promise<{
        success: boolean;
        data: any;
    }>;
}
//# sourceMappingURL=index.d.ts.map