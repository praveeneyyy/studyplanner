import { prisma } from '../db/prisma.js';
import { RewardService } from './rewardService.js';
import { evaluateTopicMastery } from '@ai-study/domain';

export class QuizService {
  static async getQuiz(quizId) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!quiz) {
      const err = new Error('Quiz not found.');
      err.statusCode = 404;
      throw err;
    }

    return quiz;
  }

  static async submitQuizAttempt(userId, { quizId, responses }) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true }
    });

    if (!quiz) {
      const err = new Error('Quiz not found.');
      err.statusCode = 404;
      throw err;
    }

    let correctCount = 0;
    const evaluatedResponses = [];

    const questionMap = new Map();
    quiz.questions.forEach((q) => questionMap.set(q.id, q));

    for (const r of responses) {
      const question = questionMap.get(r.questionId);
      if (!question) continue;

      const isCorrect = question.correctAnswer.trim().toLowerCase() === r.studentAnswer.trim().toLowerCase();
      if (isCorrect) correctCount++;

      evaluatedResponses.push({
        questionId: r.questionId,
        studentAnswer: r.studentAnswer,
        isCorrect,
        pointsAwarded: isCorrect ? 1.0 : 0.0,
        feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`
      });
    }

    const totalQuestions = quiz.questions.length || 1;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);

    // Commit attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        scorePercent,
        totalQuestions,
        correctAnswers: correctCount,
        responses: {
          create: evaluatedResponses
        }
      },
      include: { responses: true }
    });

    // Update topic mastery for associated topics
    const topicIds = [...new Set(quiz.questions.map((q) => q.topicId).filter(Boolean))];
    for (const topicId of topicIds) {
      const topic = await prisma.topic.findUnique({ where: { id: topicId } });
      if (topic) {
        const newConfidence = scorePercent >= 80 ? 4 : scorePercent >= 60 ? 3 : 2;
        await prisma.topic.update({
          where: { id: topicId },
          data: { confidence: newConfidence }
        });
      }
    }

    // Award XP
    const reward = await RewardService.processRewardEvent({
      userId,
      eventType: 'QUIZ_FINISH',
      sourceEventId: attempt.id,
      xp: 10,
      description: `Completed quiz on ${quiz.title} (Score: ${scorePercent}%)`
    });

    let bonusReward = null;
    if (scorePercent >= 80) {
      bonusReward = await RewardService.processRewardEvent({
        userId,
        eventType: 'QUIZ_HIGH_SCORE',
        sourceEventId: `${attempt.id}_high`,
        xp: 15,
        description: `High score bonus (>= 80%) on ${quiz.title}`
      });
    }

    return {
      attempt,
      scorePercent,
      correctCount,
      totalQuestions,
      reward,
      bonusReward
    };
  }

  static async getWeakTopics(userId) {
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
        revisionRecords: { orderBy: { reviewDate: 'desc' } }
      }
    });

    const evaluated = topics.map((t) => {
      return evaluateTopicMastery({
        topicId: t.id,
        topicTitle: t.title,
        subjectId: t.unit.subject.id,
        subjectName: t.unit.subject.name,
        importance: t.importance,
        confidence: t.confidence,
        reviewRepetitions: t.revisionRecords.length
      });
    });

    // Filter to topics needing attention or developing
    return evaluated
      .filter((t) => t.masteryLevel === 'NEEDS_ATTENTION' || t.masteryLevel === 'DEVELOPING')
      .sort((a, b) => a.masteryScore - b.masteryScore);
  }
}
