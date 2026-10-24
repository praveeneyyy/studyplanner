import { describe, it, expect } from 'vitest';
import {
  generateStudySchedule,
  calculateTopicPriority,
  calculateSM2,
  evaluateTopicMastery,
  calculateLevelFromXP,
  verifySessionRewardEligibility,
  calculateUpdatedStreak
} from '../index.js';

describe('Domain Algorithms & Math Verification', () => {
  it('correctly calculates topic priority weights with exam urgency', () => {
    const topic = {
      id: 't1',
      title: 'Virtual Memory',
      unitId: 'u1',
      subjectId: 's1',
      subjectName: 'OS',
      estimatedMinutes: 45,
      difficulty: 4,
      importance: 5,
      confidence: 2
    };

    const examDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days away
    const priority = calculateTopicPriority(topic, examDate);
    expect(priority).toBeGreaterThan(3.5);
  });

  it('generates non-overlapping deterministic study sessions', () => {
    const topics = [
      {
        id: 't1',
        title: 'Paging',
        unitId: 'u1',
        subjectId: 's1',
        subjectName: 'OS',
        estimatedMinutes: 90,
        difficulty: 4,
        importance: 4,
        confidence: 2
      },
      {
        id: 't2',
        title: 'Deadlocks',
        unitId: 'u1',
        subjectId: 's1',
        subjectName: 'OS',
        estimatedMinutes: 45,
        difficulty: 3,
        importance: 5,
        confidence: 3
      }
    ];

    const startDate = new Date('2026-11-01T00:00:00Z');
    const targetEndDate = new Date('2026-11-10T00:00:00Z');

    const result = generateStudySchedule(topics, {
      startDate,
      targetEndDate,
      dailyHoursLimit: 3,
      sessionDurationMinutes: 45,
      breakMinutes: 10,
      exams: [{ subjectId: 's1', examDate: targetEndDate, title: 'OS Finals' }]
    });

    expect(result.isFeasible).toBe(true);
    expect(result.sessions.length).toBeGreaterThan(0);

    // Verify non-overlapping sessions
    for (let i = 0; i < result.sessions.length - 1; i++) {
      const s1 = result.sessions[i];
      const s2 = result.sessions[i + 1];
      expect(s1.scheduledStart.getTime()).toBeLessThan(s1.scheduledEnd.getTime());
      if (s1.scheduledStart.toDateString() === s2.scheduledStart.toDateString()) {
        expect(s1.scheduledEnd.getTime()).toBeLessThanOrEqual(s2.scheduledStart.getTime());
      }
    }
  });

  it('calculates SuperMemo SM-2 interval expansion and ease factors', () => {
    // Initial successful review (Good)
    const out1 = calculateSM2({
      recallRating: 3,
      repetitionNumber: 0,
      easeFactor: 2.5,
      intervalDays: 1
    });
    expect(out1.repetitionNumber).toBe(1);
    expect(out1.intervalDays).toBe(1);

    // Second successful review (Good)
    const out2 = calculateSM2({
      recallRating: 3,
      repetitionNumber: out1.repetitionNumber,
      easeFactor: out1.easeFactor,
      intervalDays: out1.intervalDays
    });
    expect(out2.repetitionNumber).toBe(2);
    expect(out2.intervalDays).toBe(6);

    // Failed recall (Again) resets repetition
    const outFail = calculateSM2({
      recallRating: 1,
      repetitionNumber: 5,
      easeFactor: 2.5,
      intervalDays: 20
    });
    expect(outFail.repetitionNumber).toBe(0);
    expect(outFail.intervalDays).toBe(1);
    expect(outFail.easeFactor).toBeLessThan(2.5);
  });

  it('evaluates weak-topic mastery correctly', () => {
    const weak = evaluateTopicMastery({
      topicId: 't1',
      topicTitle: 'Calculus Series',
      subjectId: 's2',
      subjectName: 'Math',
      importance: 5,
      confidence: 1,
      averageQuizScorePercent: 35,
      reviewRepetitions: 0
    });
    expect(weak.masteryLevel).toBe('NEEDS_ATTENTION');
    expect(weak.masteryScore).toBeLessThan(50);
  });

  it('calculates level thresholds and progression', () => {
    expect(calculateLevelFromXP(0).level).toBe(1);
    expect(calculateLevelFromXP(200).level).toBe(2);
    expect(calculateLevelFromXP(500).level).toBe(3);
    expect(calculateLevelFromXP(1000).level).toBe(4);
    expect(calculateLevelFromXP(1500).level).toBe(5);
  });

  it('validates session duration eligibility for rewards', () => {
    expect(
      verifySessionRewardEligibility({
        status: 'IN_PROGRESS',
        plannedMinutes: 45,
        actualMinutes: 40
      }).eligible
    ).toBe(true);

    expect(
      verifySessionRewardEligibility({
        status: 'IN_PROGRESS',
        plannedMinutes: 45,
        actualMinutes: 10 // < 15 min
      }).eligible
    ).toBe(false);
  });

  it('calculates timezone-aware daily streaks', () => {
    const today = new Date('2026-10-22T10:00:00Z');
    const yesterday = new Date('2026-10-21T10:00:00Z');

    const state = {
      currentStreak: 2,
      longestStreak: 5,
      lastStudiedDateString: '2026-10-21'
    };

    const res = calculateUpdatedStreak(state, today, 'UTC');
    expect(res.incremented).toBe(true);
    expect(res.updatedState.currentStreak).toBe(3);

    // Same day activity should not double-increment
    const resSameDay = calculateUpdatedStreak(res.updatedState, today, 'UTC');
    expect(resSameDay.incremented).toBe(false);
    expect(resSameDay.updatedState.currentStreak).toBe(3);
  });
});
