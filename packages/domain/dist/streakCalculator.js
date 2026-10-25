/**
 * Timezone-Aware Study Streak Calculator
 */
/**
 * Returns formatted localized date string (YYYY-MM-DD) for a given timestamp and timezone.
 */
export function formatDateInTimezone(date, timezone = 'UTC') {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(date);
    }
    catch {
        return date.toISOString().slice(0, 10);
    }
}
/**
 * Calculates updated streak state when a student records a qualifying session or review.
 */
export function calculateUpdatedStreak(current, actionDate = new Date(), timezone = 'UTC') {
    const todayStr = formatDateInTimezone(actionDate, timezone);
    // Already logged qualifying activity today
    if (current.lastStudiedDateString === todayStr) {
        return { updatedState: current, incremented: false };
    }
    // Calculate previous calendar date in user's timezone
    const yesterday = new Date(actionDate.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = formatDateInTimezone(yesterday, timezone);
    let newStreak = 1;
    if (current.lastStudiedDateString === yesterdayStr) {
        newStreak = current.currentStreak + 1;
    }
    const newLongest = Math.max(current.longestStreak, newStreak);
    return {
        updatedState: {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastStudiedDateString: todayStr
        },
        incremented: true
    };
}
//# sourceMappingURL=streakCalculator.js.map