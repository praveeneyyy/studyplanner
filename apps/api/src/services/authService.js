import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { config } from '../config/index.js';

export class AuthService {
  static async register({ email, password, fullName, academicLevel, institution }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      err.code = 'EMAIL_ALREADY_EXISTS';
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        academicLevel: academicLevel || 'Undergraduate',
        institution,
        preferences: {
          create: {}
        },
        notificationPref: {
          create: {}
        }
      },
      include: {
        preferences: true
      }
    });

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
    const { passwordHash: _, ...safeUser } = user;

    return { user: safeUser, token };
  }

  static async login({ email, password }) {
    const raw = String(email || '').trim();
    const identifier = raw.toLowerCase();
    const emailToFind = identifier.includes('@') ? identifier : `${identifier}@university.edu`;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { email: emailToFind },
          { fullName: { equals: raw } },
          { fullName: { equals: raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() } }
        ]
      },
      include: { preferences: true }
    });

    if (!user) {
      const err = new Error('Invalid username, email, or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const err = new Error('Invalid username, email, or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
    const { passwordHash: _, ...safeUser } = user;

    return { user: safeUser, token };
  }

  static async quickLogin({ scholar }) {
    const scholarKey = String(scholar || '').toLowerCase().trim();
    const emailMap = {
      swetha: 'swetha@university.edu',
      prathima: 'prathima@university.edu'
    };

    const targetEmail = emailMap[scholarKey];
    if (!targetEmail) {
      const err = new Error(`Unauthorized scholar profile: ${scholar}`);
      err.statusCode = 400;
      err.code = 'INVALID_SCHOLAR';
      throw err;
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: targetEmail },
          { fullName: { equals: scholarKey.charAt(0).toUpperCase() + scholarKey.slice(1) } }
        ]
      },
      include: { preferences: true }
    });

    if (!user) {
      const defaultHash = await bcrypt.hash('Scholar2026!', 10);
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          passwordHash: defaultHash,
          fullName: scholarKey.charAt(0).toUpperCase() + scholarKey.slice(1),
          academicLevel: scholarKey === 'swetha' ? 'Undergraduate (Computer Science)' : 'Undergraduate (Electrical Engineering)',
          institution: 'Institute of Technology',
          totalXP: 320,
          currentLevel: 2,
          preferences: {
            create: {
              theme: 'system',
              timezone: 'UTC',
              dailyStudyMinutesGoal: 150,
              sessionDurationPref: 45,
              breakDurationPref: 10
            }
          },
          notificationPref: {
            create: {}
          }
        },
        include: { preferences: true }
      });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
    const { passwordHash: _, ...safeUser } = user;

    return { user: safeUser, token };
  }

  static async guestLogin() {
    const guestEmail = 'guest@university.edu';
    let user = await prisma.user.findUnique({
      where: { email: guestEmail },
      include: { preferences: true }
    });

    if (!user) {
      const dummyPasswordHash = await bcrypt.hash(`guest-${Date.now()}`, 10);
      user = await prisma.user.create({
        data: {
          email: guestEmail,
          passwordHash: dummyPasswordHash,
          fullName: 'Guest Scholar',
          academicLevel: 'Computer Science (Guest Explorer)',
          institution: 'Open Academic Commons',
          totalXP: 100,
          currentLevel: 1,
          preferences: {
            create: {
              theme: 'system',
              timezone: 'UTC',
              dailyStudyMinutesGoal: 120,
              sessionDurationPref: 30,
              breakDurationPref: 5
            }
          },
          notificationPref: {
            create: {}
          }
        },
        include: { preferences: true }
      });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
    const { passwordHash: _, ...safeUser } = user;

    return { user: safeUser, token };
  }

  static async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        notificationPref: true
      }
    });

    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  static async updateProfile(userId, data) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      include: { preferences: true }
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  static async exportUserData(userId) {
    const data = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        subjects: {
          include: {
            examinations: true,
            units: {
              include: {
                topics: true
              }
            }
          }
        },
        studyPlans: {
          include: {
            sessions: true
          }
        },
        notes: true,
        flashcards: true,
        quizAttempts: {
          include: {
            responses: true
          }
        },
        rewardLedgerEntries: true,
        achievements: true,
        streaks: true
      }
    });

    if (data) {
      delete data.passwordHash;
    }
    return data;
  }

  static async deleteAccount(userId) {
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }
}
