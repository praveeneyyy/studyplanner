/**
 * Timezone-Aware Study Streak Calculator
 */
export interface StreakState {
    currentStreak: number;
    longestStreak: number;
    lastStudiedDateString?: string;
}
/**
 * Returns formatted localized date string (YYYY-MM-DD) for a given timestamp and timezone.
 */
export declare function formatDateInTimezone(date: Date, timezone?: string): string;
/**
 * Calculates updated streak state when a student records a qualifying session or review.
 */
export declare function calculateUpdatedStreak(current: StreakState, actionDate?: Date, timezone?: string): {
    updatedState: StreakState;
    incremented: boolean;
};
//# sourceMappingURL=streakCalculator.d.ts.map