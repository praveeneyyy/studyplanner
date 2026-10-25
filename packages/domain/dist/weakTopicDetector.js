/**
 * Weak-Topic Detection & Examination Readiness Scoring
 */
/**
 * Computes topic mastery score:
 * 50% weighted by quiz performance, 30% by self-confidence, 20% by spaced review repetitions.
 */
export function evaluateTopicMastery(data) {
    const quizScore = data.averageQuizScorePercent ?? 50; // default neutral if unquizzed
    const confidenceScore = Math.max(1, Math.min(5, data.confidence)) * 20; // scale 1-5 to 20-100
    const reviewScore = Math.min(100, (data.reviewRepetitions / 5) * 100);
    const rawMastery = quizScore * 0.5 + confidenceScore * 0.3 + reviewScore * 0.2;
    const masteryScore = Math.round(rawMastery);
    let masteryLevel = 'DEVELOPING';
    let recommendedAction = 'Review key notes and test recall.';
    if (masteryScore < 50) {
        masteryLevel = 'NEEDS_ATTENTION';
        recommendedAction = 'High priority: Schedule an immediate 45m study session and use AI simple explanation.';
    }
    else if (masteryScore < 70) {
        masteryLevel = 'DEVELOPING';
        recommendedAction = 'Practice 5-question micro-quiz to solidify recall.';
    }
    else if (masteryScore < 85) {
        masteryLevel = 'GOOD';
        recommendedAction = 'On track. Review scheduled spaced flashcards.';
    }
    else {
        masteryLevel = 'MASTERED';
        recommendedAction = 'Topic mastered. Keep up standard maintenance reviews.';
    }
    return {
        topicId: data.topicId,
        topicTitle: data.topicTitle,
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        masteryScore,
        masteryLevel,
        recommendedAction
    };
}
/**
 * Computes overall examination readiness index as a weighted average across syllabus topics.
 */
export function calculateExamReadiness(topics, importanceWeights) {
    if (topics.length === 0)
        return 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const topic of topics) {
        const weight = importanceWeights.get(topic.topicId) ?? 3;
        totalWeightedScore += topic.masteryScore * weight;
        totalWeight += weight;
    }
    if (totalWeight === 0)
        return 0;
    return Math.round((totalWeightedScore / totalWeight) * 10) / 10;
}
//# sourceMappingURL=weakTopicDetector.js.map