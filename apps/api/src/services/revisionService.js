import { prisma } from '../db/prisma.js';
import { calculateSM2 } from '@ai-study/domain';
import { RewardService } from './rewardService.js';

export class RevisionService {
  static async getRevisionQueue(userId) {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const topics = await prisma.topic.findMany({
      where: {
        unit: {
          subject: {
            userId,
            archived: false
          }
        }
      },
      include: {
        unit: { include: { subject: true } },
        revisionRecords: {
          orderBy: { reviewDate: 'desc' },
          take: 1
        }
      }
    });

    const overdue = [];
    const dueToday = [];
    const upcoming = [];

    for (const topic of topics) {
      const lastRec = topic.revisionRecords[0];
      const nextDate = topic.nextRevisionDate || (lastRec ? lastRec.nextScheduledReview : null);

      if (!nextDate) {
        // If never reviewed, queue as due today for initial review
        dueToday.push({
          topic,
          reviewStatus: 'NEW_REVIEW',
          nextReviewDate: now
        });
        continue;
      }

      const reviewTime = new Date(nextDate).getTime();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      if (reviewTime < startOfToday.getTime()) {
        overdue.push({
          topic,
          reviewStatus: 'OVERDUE',
          nextReviewDate: nextDate
        });
      } else if (reviewTime <= endOfToday.getTime()) {
        dueToday.push({
          topic,
          reviewStatus: 'DUE_TODAY',
          nextReviewDate: nextDate
        });
      } else if (reviewTime <= sevenDaysLater.getTime()) {
        upcoming.push({
          topic,
          reviewStatus: 'UPCOMING',
          nextReviewDate: nextDate
        });
      }
    }

    return {
      dueToday,
      overdue,
      upcoming
    };
  }

  static async recordRecall(userId, { topicId, recallRating }) {
    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        unit: { subject: { userId } }
      },
      include: {
        revisionRecords: {
          orderBy: { reviewDate: 'desc' },
          take: 1
        }
      }
    });

    if (!topic) {
      const err = new Error('Topic not found or unauthorized.');
      err.statusCode = 404;
      throw err;
    }

    const lastRec = topic.revisionRecords[0];
    const prevRep = lastRec ? lastRec.repetitionNumber : 0;
    const prevEF = lastRec ? lastRec.easeFactor : 2.5;
    const prevInterval = lastRec ? lastRec.intervalDays : 1;

    const sm2Output = calculateSM2(
      {
        recallRating,
        repetitionNumber: prevRep,
        easeFactor: prevEF,
        intervalDays: prevInterval
      },
      new Date()
    );

    const record = await prisma.revisionRecord.create({
      data: {
        topicId,
        recallRating,
        repetitionNumber: sm2Output.repetitionNumber,
        easeFactor: sm2Output.easeFactor,
        intervalDays: sm2Output.intervalDays,
        nextScheduledReview: sm2Output.nextReviewDate
      }
    });

    // Update topic with next review date and confidence
    await prisma.topic.update({
      where: { id: topicId },
      data: {
        nextRevisionDate: sm2Output.nextReviewDate,
        confidence: recallRating === 4 ? 5 : recallRating === 3 ? 4 : recallRating === 2 ? 3 : 1
      }
    });

    // Award revision XP (15 XP)
    const reward = await RewardService.processRewardEvent({
      userId,
      eventType: 'REVISION_COMPLETE',
      sourceEventId: record.id,
      xp: 15,
      description: `Completed spaced review on ${topic.title}`
    });

    return {
      record,
      sm2Output,
      reward
    };
  }
}
