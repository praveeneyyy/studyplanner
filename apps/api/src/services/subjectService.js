import { prisma } from '../db/prisma.js';

export class SubjectService {
  static async listSubjects(userId, includeArchived = false) {
    return prisma.subject.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { archived: false })
      },
      include: {
        examinations: {
          orderBy: { examDate: 'asc' }
        },
        units: {
          orderBy: { orderIndex: 'asc' },
          include: {
            topics: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      },
      orderBy: { priority: 'desc' }
    });
  }

  static async createSubject(userId, data) {
    return prisma.subject.create({
      data: {
        ...data,
        userId
      }
    });
  }

  static async getSubject(userId, subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId },
      include: {
        examinations: { orderBy: { examDate: 'asc' } },
        units: {
          orderBy: { orderIndex: 'asc' },
          include: {
            topics: {
              orderBy: { orderIndex: 'asc' },
              include: {
                progressRecords: true,
                revisionRecords: { orderBy: { reviewDate: 'desc' }, take: 1 }
              }
            }
          }
        }
      }
    });

    if (!subject) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }

    return subject;
  }

  static async updateSubject(userId, subjectId, data) {
    const existing = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
    if (!existing) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }

    return prisma.subject.update({
      where: { id: subjectId },
      data
    });
  }

  static async deleteSubject(userId, subjectId) {
    const existing = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
    if (!existing) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.subject.delete({ where: { id: subjectId } });
    return { success: true };
  }

  // ----------------------------------------------------
  // Examinations
  // ----------------------------------------------------
  static async createExamination(userId, data) {
    const subject = await prisma.subject.findFirst({ where: { id: data.subjectId, userId } });
    if (!subject) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }

    return prisma.examination.create({
      data: {
        ...data,
        examDate: new Date(data.examDate)
      }
    });
  }

  // ----------------------------------------------------
  // Units & Topics
  // ----------------------------------------------------
  static async createUnit(userId, data) {
    const subject = await prisma.subject.findFirst({ where: { id: data.subjectId, userId } });
    if (!subject) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }

    return prisma.syllabusUnit.create({
      data
    });
  }

  static async createTopic(userId, data) {
    const unit = await prisma.syllabusUnit.findFirst({
      where: { id: data.unitId },
      include: { subject: true }
    });

    if (!unit || unit.subject.userId !== userId) {
      const err = new Error('Unit not found or unauthorized.');
      err.statusCode = 404;
      throw err;
    }

    return prisma.topic.create({
      data: {
        ...data,
        progressRecords: {
          create: {
            confidence: data.confidence || 1
          }
        }
      }
    });
  }

  static async updateTopic(userId, topicId, data) {
    const topic = await prisma.topic.findFirst({
      where: { id: topicId },
      include: { unit: { include: { subject: true } } }
    });

    if (!topic || topic.unit.subject.userId !== userId) {
      const err = new Error('Topic not found or unauthorized.');
      err.statusCode = 404;
      throw err;
    }

    return prisma.topic.update({
      where: { id: topicId },
      data
    });
  }

  static async importSyllabus(userId, subjectId, unitsData) {
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
    if (!subject) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }

    const createdUnits = [];
    for (let uIdx = 0; uIdx < unitsData.length; uIdx++) {
      const u = unitsData[uIdx];
      const unit = await prisma.syllabusUnit.create({
        data: {
          subjectId,
          title: u.title,
          unitNumber: u.unitNumber || uIdx + 1,
          orderIndex: uIdx,
          topics: {
            create: (u.topics || []).map((t, tIdx) => ({
              title: t.title,
              description: t.description,
              estimatedMinutes: t.estimatedMinutes || 45,
              difficulty: t.difficulty || 3,
              importance: t.importance || 3,
              confidence: t.confidence || 1,
              orderIndex: tIdx
            }))
          }
        },
        include: { topics: true }
      });
      createdUnits.push(unit);
    }

    return createdUnits;
  }
}
