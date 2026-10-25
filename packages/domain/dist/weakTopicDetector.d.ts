/**
 * Weak-Topic Detection & Examination Readiness Scoring
 */
export interface TopicPerformanceData {
    topicId: string;
    topicTitle: string;
    subjectId: string;
    subjectName: string;
    importance: number;
    confidence: number;
    averageQuizScorePercent?: number;
    reviewRepetitions: number;
}
export type MasteryLevel = 'NEEDS_ATTENTION' | 'DEVELOPING' | 'GOOD' | 'MASTERED';
export interface EvaluatedTopic {
    topicId: string;
    topicTitle: string;
    subjectId: string;
    subjectName: string;
    masteryScore: number;
    masteryLevel: MasteryLevel;
    recommendedAction: string;
}
/**
 * Computes topic mastery score:
 * 50% weighted by quiz performance, 30% by self-confidence, 20% by spaced review repetitions.
 */
export declare function evaluateTopicMastery(data: TopicPerformanceData): EvaluatedTopic;
/**
 * Computes overall examination readiness index as a weighted average across syllabus topics.
 */
export declare function calculateExamReadiness(topics: EvaluatedTopic[], importanceWeights: Map<string, number>): number;
//# sourceMappingURL=weakTopicDetector.d.ts.map