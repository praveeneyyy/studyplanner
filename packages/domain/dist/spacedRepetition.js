/**
 * Spaced Repetition System (SuperMemo SM-2 Hybrid Algorithm)
 * Calculates intervals, ease factors, and next review timestamps based on active recall.
 */
/**
 * Calculates new SM-2 parameters after an active recall review.
 */
export function calculateSM2(input, reviewDate = new Date()) {
    const { recallRating, repetitionNumber, easeFactor, intervalDays } = input;
    let newRepetition = repetitionNumber;
    let newEaseFactor = easeFactor;
    let newIntervalDays = intervalDays;
    // Rating < 3 means recall failed (Again or Hard restart)
    if (recallRating < 3) {
        newRepetition = 0;
        newIntervalDays = 1;
    }
    else {
        // Successful recall (Good or Easy)
        if (newRepetition === 0) {
            newIntervalDays = 1;
        }
        else if (newRepetition === 1) {
            newIntervalDays = 6;
        }
        else {
            newIntervalDays = Math.round(intervalDays * easeFactor);
        }
        newRepetition += 1;
    }
    // Update ease factor using SM-2 polynomial:
    // EF' = EF + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02))
    // Bound to minimum EF of 1.3
    const deltaEF = 0.1 - (4 - recallRating) * (0.08 + (4 - recallRating) * 0.02);
    newEaseFactor = Math.max(1.3, Math.round((easeFactor + deltaEF) * 100) / 100);
    // Bonus interval for "Easy" rating
    if (recallRating === 4) {
        newIntervalDays = Math.round(newIntervalDays * 1.25);
    }
    // Calculate next review timestamp
    const nextReviewDate = new Date(reviewDate);
    nextReviewDate.setDate(nextReviewDate.getDate() + Math.max(1, newIntervalDays));
    // Normalize to 09:00 morning review
    nextReviewDate.setHours(9, 0, 0, 0);
    return {
        repetitionNumber: newRepetition,
        easeFactor: newEaseFactor,
        intervalDays: Math.max(1, newIntervalDays),
        nextReviewDate
    };
}
//# sourceMappingURL=spacedRepetition.js.map