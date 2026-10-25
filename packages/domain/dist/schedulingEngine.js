/**
 * Deterministic Constraint-Based Study Scheduling Engine
 * Enforces capacity limits, priority ordering, rest breaks, and pre-exam revision buffers.
 */
/**
 * Calculates priority weight for topic:
 * Higher difficulty, higher importance, lower confidence, and closer exam date = higher priority.
 */
export function calculateTopicPriority(topic, examDate, currentDate = new Date()) {
    let urgency = 1;
    if (examDate) {
        const diffDays = Math.max(1, Math.ceil((examDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
        urgency = Math.max(1, Math.min(5, Math.floor(30 / diffDays)));
    }
    // Weight formulation: Difficulty(25%) + Importance(35%) + Inverted Confidence(25%) + Exam Urgency(15%)
    const invertedConfidence = 6 - Math.max(1, Math.min(5, topic.confidence));
    const score = topic.difficulty * 0.25 +
        topic.importance * 0.35 +
        invertedConfidence * 0.25 +
        urgency * 0.15;
    return Math.round(score * 100) / 100;
}
/**
 * Pure deterministic scheduling algorithm.
 */
export function generateStudySchedule(topics, options) {
    const { startDate, targetEndDate, dailyHoursLimit, sessionDurationMinutes, breakMinutes, exams } = options;
    const totalDays = Math.max(1, Math.ceil((targetEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyCapacityMinutes = Math.floor(dailyHoursLimit * 60);
    const totalAvailableMinutes = totalDays * dailyCapacityMinutes;
    // Calculate pre-exam revision buffer (15% of total days)
    const bufferDays = Math.max(1, Math.floor(totalDays * 0.15));
    const learningDays = Math.max(1, totalDays - bufferDays);
    // Map exam dates by subject
    const examMap = new Map();
    exams.forEach((ex) => examMap.set(ex.subjectId, new Date(ex.examDate)));
    // Filter out already mastered topics
    const unmasteredTopics = topics.filter((t) => t.status !== 'MASTERED');
    // Score and sort topics
    const scoredTopics = unmasteredTopics.map((topic) => {
        const examDate = examMap.get(topic.subjectId);
        return {
            topic,
            score: calculateTopicPriority(topic, examDate, startDate),
            examDate
        };
    });
    // Sort: earlier exam date first, then highest priority score descending
    scoredTopics.sort((a, b) => {
        if (a.examDate && b.examDate && a.examDate.getTime() !== b.examDate.getTime()) {
            return a.examDate.getTime() - b.examDate.getTime();
        }
        return b.score - a.score;
    });
    const totalRequiredMinutes = scoredTopics.reduce((acc, curr) => acc + curr.topic.estimatedMinutes, 0);
    const isFeasible = totalRequiredMinutes <= totalAvailableMinutes;
    let feasibilityWarning;
    if (!isFeasible) {
        const deficitHours = Math.round(((totalRequiredMinutes - totalAvailableMinutes) / 60) * 10) / 10;
        feasibilityWarning = `Schedule deficit: Remaining syllabus requires ${Math.round(totalRequiredMinutes / 60)}h, but only ${Math.round(totalAvailableMinutes / 60)}h are available before deadlines. Deficit: ${deficitHours}h.`;
    }
    const sessions = [];
    let currentDate = new Date(startDate);
    // Normalize to 09:00 local
    currentDate.setHours(9, 0, 0, 0);
    let currentDayMinutes = 0;
    let dayOffset = 0;
    for (const item of scoredTopics) {
        let remainingMinutes = item.topic.estimatedMinutes;
        while (remainingMinutes > 0 && dayOffset < totalDays) {
            const isBufferPeriod = dayOffset >= learningDays;
            const sessionType = isBufferPeriod ? 'REVISE' : 'LEARN';
            const duration = Math.min(sessionDurationMinutes, remainingMinutes);
            // Check if current day capacity is reached
            if (currentDayMinutes + duration > dailyCapacityMinutes) {
                // Advance to next day at 09:00
                dayOffset++;
                currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + dayOffset);
                currentDate.setHours(9, 0, 0, 0);
                currentDayMinutes = 0;
                if (dayOffset >= totalDays)
                    break;
            }
            const sessionStart = new Date(currentDate.getTime() + currentDayMinutes * 60 * 1000);
            const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);
            sessions.push({
                topicId: item.topic.id,
                topicTitle: item.topic.title,
                subjectId: item.topic.subjectId,
                subjectName: item.topic.subjectName,
                scheduledStart: sessionStart,
                scheduledEnd: sessionEnd,
                durationMinutes: duration,
                sessionType,
                priorityScore: item.score
            });
            remainingMinutes -= duration;
            currentDayMinutes += duration + breakMinutes;
        }
    }
    const totalPlannedMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    return {
        isFeasible,
        feasibilityWarning,
        totalPlannedMinutes,
        totalAvailableMinutes,
        bufferDays,
        sessions
    };
}
//# sourceMappingURL=schedulingEngine.js.map