/**
 * Verified Reward Ledger & Progression Engine
 */

export const REWARD_XP_SCHEDULE = {
  SESSION_COMPLETE: 25,
  REVISION_COMPLETE: 15,
  QUIZ_FINISH: 10,
  QUIZ_HIGH_SCORE: 15, // bonus if score >= 80%
  UNIT_MASTERED: 50,
  DAILY_GOAL_MET: 30,
  MOCK_EXAM_COMPLETE: 40,
  PLAN_GENERATED: 20
} as const;

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

const LEVEL_TITLES = [
  'Novice Scholar',
  'Consistent Learner',
  'Focused Scholar',
  'Knowledge Builder',
  'Master Scholar',
  'Academic Paragon'
];

/**
 * Returns cumulative XP required to reach level L.
 * Formula: round(150 * (L - 1)^1.6)
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(150 * Math.pow(level - 1, 1.6));
}

/**
 * Calculates current level and progress from total cumulative XP.
 */
export function calculateLevelFromXP(totalXP: number): LevelInfo {
  let level = 1;
  while (totalXP >= getXPForLevel(level + 1)) {
    level++;
  }

  const currentLevelMinXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const levelXPDiff = nextLevelXP - currentLevelMinXP;
  const userXPInLevel = Math.max(0, totalXP - currentLevelMinXP);
  const progressPercent = levelXPDiff > 0 ? Math.min(100, Math.round((userXPInLevel / levelXPDiff) * 100)) : 100;

  const titleIndex = Math.min(LEVEL_TITLES.length - 1, level - 1);
  const title = LEVEL_TITLES[titleIndex];

  return {
    level,
    title,
    minXP: currentLevelMinXP,
    nextLevelXP,
    progressPercent
  };
}

/**
 * Verifies if a completed session qualifies for the 25 XP reward:
 * Must be in a valid status and actual elapsed time must be >= 70% of planned and >= 15 minutes.
 */
export function verifySessionRewardEligibility(session: SessionVerificationInput): {
  eligible: boolean;
  reason?: string;
} {
  if (session.status !== 'PLANNED' && session.status !== 'IN_PROGRESS' && session.status !== 'COMPLETED') {
    return { eligible: false, reason: 'Invalid session status.' };
  }

  if (session.actualMinutes < 15) {
    return { eligible: false, reason: 'Session duration must be at least 15 verified minutes to earn XP.' };
  }

  if (session.actualMinutes < session.plannedMinutes * 0.7) {
    return { eligible: false, reason: 'Session completed too quickly (< 70% of planned block).' };
  }

  return { eligible: true };
}
