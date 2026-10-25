/**
 * Deterministic Constraint-Based Study Scheduling Engine
 * Enforces capacity limits, priority ordering, rest breaks, and pre-exam revision buffers.
 */
export interface TopicCandidate {
    id: string;
    title: string;
    unitId: string;
    subjectId: string;
    subjectName: string;
    estimatedMinutes: number;
    difficulty: number;
    importance: number;
    confidence: number;
    status?: string;
}
export interface ExamConstraint {
    subjectId: string;
    examDate: Date;
    title: string;
}
export interface SchedulingOptions {
    startDate: Date;
    targetEndDate: Date;
    dailyHoursLimit: number;
    sessionDurationMinutes: number;
    breakMinutes: number;
    exams: ExamConstraint[];
    existingCompletedMinutes?: number;
}
export interface GeneratedSession {
    id?: string;
    topicId: string;
    topicTitle: string;
    subjectId: string;
    subjectName: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    durationMinutes: number;
    sessionType: 'LEARN' | 'REVISE';
    priorityScore: number;
}
export interface ScheduleResult {
    isFeasible: boolean;
    feasibilityWarning?: string;
    totalPlannedMinutes: number;
    totalAvailableMinutes: number;
    bufferDays: number;
    sessions: GeneratedSession[];
}
/**
 * Calculates priority weight for topic:
 * Higher difficulty, higher importance, lower confidence, and closer exam date = higher priority.
 */
export declare function calculateTopicPriority(topic: TopicCandidate, examDate?: Date, currentDate?: Date): number;
/**
 * Pure deterministic scheduling algorithm.
 */
export declare function generateStudySchedule(topics: TopicCandidate[], options: SchedulingOptions): ScheduleResult;
//# sourceMappingURL=schedulingEngine.d.ts.map