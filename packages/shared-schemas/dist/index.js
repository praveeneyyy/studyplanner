import { z } from 'zod';
// ----------------------------------------------------
// Auth & User Schemas
// ----------------------------------------------------
export const RegisterRequestSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    academicLevel: z.string().optional(),
    institution: z.string().optional()
});
export const LoginRequestSchema = z.object({
    email: z.string().min(1, 'Please enter your username or email address'),
    password: z.string().min(1, 'Password is required')
});
export const QuickLoginRequestSchema = z.object({
    scholar: z.enum(['swetha', 'prathima'])
});
export const UpdateProfileSchema = z.object({
    fullName: z.string().min(2).optional(),
    academicLevel: z.string().optional(),
    institution: z.string().optional(),
    avatarUrl: z.string().url().optional()
});
// ----------------------------------------------------
// Subject & Curriculum Schemas
// ----------------------------------------------------
export const CreateSubjectSchema = z.object({
    name: z.string().min(2, 'Subject name must be at least 2 characters'),
    code: z.string().optional(),
    colorToken: z.enum(['cs', 'math', 'physics', 'chem', 'humanities', 'lang', 'default']).default('default'),
    priority: z.number().int().min(1).max(5).default(3)
});
export const UpdateSubjectSchema = CreateSubjectSchema.partial().extend({
    archived: z.boolean().optional()
});
export const CreateExaminationSchema = z.object({
    subjectId: z.string(),
    title: z.string().min(2),
    examDate: z.string().datetime(),
    weightagePercent: z.number().int().min(1).max(100).default(100),
    targetScorePercent: z.number().int().min(1).max(100).default(85)
});
export const CreateUnitSchema = z.object({
    subjectId: z.string(),
    title: z.string().min(2),
    unitNumber: z.number().int().min(1).default(1),
    description: z.string().optional(),
    orderIndex: z.number().int().default(0)
});
export const CreateTopicSchema = z.object({
    unitId: z.string(),
    title: z.string().min(2),
    description: z.string().optional(),
    estimatedMinutes: z.number().int().min(15).max(300).default(45),
    difficulty: z.number().int().min(1).max(5).default(3),
    importance: z.number().int().min(1).max(5).default(3),
    confidence: z.number().int().min(1).max(5).default(1),
    orderIndex: z.number().int().default(0)
});
export const UpdateTopicSchema = CreateTopicSchema.partial().extend({
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'MASTERED']).optional(),
    confidence: z.number().int().min(1).max(5).optional()
});
// ----------------------------------------------------
// Study Plan & Sessions Schemas
// ----------------------------------------------------
export const GeneratePlanRequestSchema = z.object({
    examinationId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    targetEndDate: z.string().datetime().optional(),
    subjectIds: z.array(z.string()).optional(),
    dailyHoursLimit: z.number().min(1).max(14).default(4),
    sessionDurationMinutes: z.number().int().min(25).max(120).default(45),
    breakMinutes: z.number().int().min(5).max(30).default(10)
});
export const CompleteSessionRequestSchema = z.object({
    actualDurationMinutes: z.number().int().min(1),
    reflectionScore: z.number().int().min(1).max(5).optional(),
    notes: z.string().optional()
});
export const RescheduleSessionRequestSchema = z.object({
    newStart: z.string().datetime(),
    newEnd: z.string().datetime()
});
// ----------------------------------------------------
// AI Assistant Schemas
// ----------------------------------------------------
export const AnswerFormatEnum = z.enum([
    'EXPLAIN',
    'SIMPLE',
    'DETAILED',
    'STEP_BY_STEP',
    'EXAM_2M',
    'EXAM_5M',
    'EXAM_10M',
    'EXAM_12M',
    'EXAM_15M',
    'SHORT_NOTES',
    'BULLET_POINTS',
    'TABLE',
    'CODE',
    'MATH_DERIVATION',
    'FLASHCARDS',
    'QUIZ'
]);
export const AIStreamRequestSchema = z.object({
    conversationId: z.string().optional(),
    prompt: z.string().min(1, 'Prompt is required'),
    formatType: AnswerFormatEnum.default('EXPLAIN'),
    topicId: z.string().optional(),
    subjectId: z.string().optional()
});
// ----------------------------------------------------
// Assessments & Quizzes Schemas
// ----------------------------------------------------
export const SubmitQuizAttemptSchema = z.object({
    quizId: z.string(),
    responses: z.array(z.object({
        questionId: z.string(),
        studentAnswer: z.string()
    }))
});
// ----------------------------------------------------
// Spaced Repetition (SRS) Schemas
// ----------------------------------------------------
export const RecordRecallRequestSchema = z.object({
    topicId: z.string(),
    recallRating: z.number().int().min(1).max(4) // 1: Again, 2: Hard, 3: Good, 4: Easy
});
// ----------------------------------------------------
// User Preferences Schema
// ----------------------------------------------------
export const UpdatePreferencesSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    timezone: z.string().optional(),
    dailyStudyMinutesGoal: z.number().int().min(30).max(800).optional(),
    sessionDurationPref: z.number().int().min(20).max(120).optional(),
    breakDurationPref: z.number().int().min(5).max(30).optional(),
    weeklyAvailability: z.string().optional(),
    reducedMotion: z.boolean().optional(),
    soundEffects: z.boolean().optional(),
    hapticFeedback: z.boolean().optional()
});
//# sourceMappingURL=index.js.map