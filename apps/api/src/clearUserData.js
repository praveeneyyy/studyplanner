import { prisma } from './db/prisma.js';

async function clearAllData() {
  console.log('--- Clearing all predefined example data from database ---');

  const users = await prisma.user.findMany();

  for (const user of users) {
    console.log(`Clearing workspace for user: ${user.email} (${user.id})`);

    // Delete child records first
    await prisma.rewardLedgerEntry.deleteMany({ where: { userId: user.id } });
    await prisma.userStreak.deleteMany({ where: { userId: user.id } });
    await prisma.weeklyGoal.deleteMany({ where: { userId: user.id } });
    await prisma.userAchievement.deleteMany({ where: { userId: user.id } });
    await prisma.notificationRecord.deleteMany({ where: { userId: user.id } });
    await prisma.aIUsageRecord.deleteMany({ where: { userId: user.id } });
    await prisma.aIConversation.deleteMany({ where: { userId: user.id } });
    await prisma.quizAttempt.deleteMany({ where: { userId: user.id } });
    await prisma.studySession.deleteMany({ where: { studyPlan: { userId: user.id } } });
    await prisma.studyPlan.deleteMany({ where: { userId: user.id } });
    await prisma.note.deleteMany({ where: { userId: user.id } });
    await prisma.flashcard.deleteMany({ where: { userId: user.id } });
    await prisma.subject.deleteMany({ where: { userId: user.id } });

    // Reset XP and level back to brand-new student state
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalXP: 0,
        currentLevel: 1
      }
    });
  }

  console.log('--- All predefined study plans, tasks, subjects, sessions, and notes successfully cleared! ---');
}

clearAllData()
  .catch((e) => {
    console.error('Error during data clearing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
