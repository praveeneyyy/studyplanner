/**
 * Spaced Repetition System (SuperMemo SM-2 Hybrid Algorithm)
 * Calculates intervals, ease factors, and next review timestamps based on active recall.
 */
export interface SM2Input {
    recallRating: number;
    repetitionNumber: number;
    easeFactor: number;
    intervalDays: number;
}
export interface SM2Output {
    repetitionNumber: number;
    easeFactor: number;
    intervalDays: number;
    nextReviewDate: Date;
}
/**
 * Calculates new SM-2 parameters after an active recall review.
 */
export declare function calculateSM2(input: SM2Input, reviewDate?: Date): SM2Output;
//# sourceMappingURL=spacedRepetition.d.ts.map