/**
 * Verified Reward Ledger & Progression Engine
 */
export declare const REWARD_XP_SCHEDULE: {
    readonly SESSION_COMPLETE: 25;
    readonly REVISION_COMPLETE: 15;
    readonly QUIZ_FINISH: 10;
    readonly QUIZ_HIGH_SCORE: 15;
    readonly UNIT_MASTERED: 50;
    readonly DAILY_GOAL_MET: 30;
    readonly MOCK_EXAM_COMPLETE: 40;
    readonly PLAN_GENERATED: 20;
};
export type RewardEventType = keyof typeof REWARD_XP_SCHEDULE;
export interface SessionVerificationInput {
    status: string;
    plannedMinutes: number;
    actualMinutes: number;
}
export interface LevelInfo {
    level: number;
    title: string;
    minXP: number;
    nextLevelXP: number;
    progressPercent: number;
}
/**
 * Returns cumulative XP required to reach level L.
 * Formula: round(150 * (L - 1)^1.6)
 */
export declare function getXPForLevel(level: number): number;
/**
 * Calculates current level and progress from total cumulative XP.
 */
export declare function calculateLevelFromXP(totalXP: number): LevelInfo;
/**
 * Verifies if a completed session qualifies for the 25 XP reward:
 * Must be in a valid status and actual elapsed time must be >= 70% of planned and >= 15 minutes.
 */
export declare function verifySessionRewardEligibility(session: SessionVerificationInput): {
    eligible: boolean;
    reason?: string;
};
//# sourceMappingURL=rewardLedger.d.ts.map