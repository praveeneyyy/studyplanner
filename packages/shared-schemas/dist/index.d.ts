import { z } from 'zod';
export declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    academicLevel: z.ZodOptional<z.ZodString>;
    institution: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    fullName: string;
    academicLevel?: string | undefined;
    institution?: string | undefined;
}, {
    email: string;
    password: string;
    fullName: string;
    academicLevel?: string | undefined;
    institution?: string | undefined;
}>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export declare const QuickLoginRequestSchema: z.ZodObject<{
    scholar: z.ZodEnum<["swetha", "prathima"]>;
}, "strip", z.ZodTypeAny, {
    scholar: "swetha" | "prathima";
}, {
    scholar: "swetha" | "prathima";
}>;
export type QuickLoginRequest = z.infer<typeof QuickLoginRequestSchema>;
export declare const UpdateProfileSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    academicLevel: z.ZodOptional<z.ZodString>;
    institution: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    academicLevel?: string | undefined;
    institution?: string | undefined;
    avatarUrl?: string | undefined;
}, {
    fullName?: string | undefined;
    academicLevel?: string | undefined;
    institution?: string | undefined;
    avatarUrl?: string | undefined;
}>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export declare const CreateSubjectSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    colorToken: z.ZodDefault<z.ZodEnum<["cs", "math", "physics", "chem", "humanities", "lang", "default"]>>;
    priority: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    colorToken: "cs" | "math" | "physics" | "chem" | "humanities" | "lang" | "default";
    priority: number;
    code?: string | undefined;
}, {
    name: string;
    code?: string | undefined;
    colorToken?: "cs" | "math" | "physics" | "chem" | "humanities" | "lang" | "default" | undefined;
    priority?: number | undefined;
}>;
export type CreateSubject = z.infer<typeof CreateSubjectSchema>;
export declare const UpdateSubjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    colorToken: z.ZodOptional<z.ZodDefault<z.ZodEnum<["cs", "math", "physics", "chem", "humanities", "lang", "default"]>>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
} & {
    archived: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    colorToken?: "cs" | "math" | "physics" | "chem" | "humanities" | "lang" | "default" | undefined;
    priority?: number | undefined;
    archived?: boolean | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    colorToken?: "cs" | "math" | "physics" | "chem" | "humanities" | "lang" | "default" | undefined;
    priority?: number | undefined;
    archived?: boolean | undefined;
}>;
export type UpdateSubject = z.infer<typeof UpdateSubjectSchema>;
export declare const CreateExaminationSchema: z.ZodObject<{
    subjectId: z.ZodString;
    title: z.ZodString;
    examDate: z.ZodString;
    weightagePercent: z.ZodDefault<z.ZodNumber>;
    targetScorePercent: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    subjectId: string;
    title: string;
    examDate: string;
    weightagePercent: number;
    targetScorePercent: number;
}, {
    subjectId: string;
    title: string;
    examDate: string;
    weightagePercent?: number | undefined;
    targetScorePercent?: number | undefined;
}>;
export type CreateExamination = z.infer<typeof CreateExaminationSchema>;
export declare const CreateUnitSchema: z.ZodObject<{
    subjectId: z.ZodString;
    title: z.ZodString;
    unitNumber: z.ZodDefault<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    orderIndex: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    subjectId: string;
    title: string;
    unitNumber: number;
    orderIndex: number;
    description?: string | undefined;
}, {
    subjectId: string;
    title: string;
    unitNumber?: number | undefined;
    description?: string | undefined;
    orderIndex?: number | undefined;
}>;
export type CreateUnit = z.infer<typeof CreateUnitSchema>;
export declare const CreateTopicSchema: z.ZodObject<{
    unitId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    estimatedMinutes: z.ZodDefault<z.ZodNumber>;
    difficulty: z.ZodDefault<z.ZodNumber>;
    importance: z.ZodDefault<z.ZodNumber>;
    confidence: z.ZodDefault<z.ZodNumber>;
    orderIndex: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    orderIndex: number;
    unitId: string;
    estimatedMinutes: number;
    difficulty: number;
    importance: number;
    confidence: number;
    description?: string | undefined;
}, {
    title: string;
    unitId: string;
    description?: string | undefined;
    orderIndex?: number | undefined;
    estimatedMinutes?: number | undefined;
    difficulty?: number | undefined;
    importance?: number | undefined;
    confidence?: number | undefined;
}>;
export type CreateTopic = z.infer<typeof CreateTopicSchema>;
export declare const UpdateTopicSchema: z.ZodObject<{
    unitId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    estimatedMinutes: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    difficulty: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    importance: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    orderIndex: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["NOT_STARTED", "IN_PROGRESS", "MASTERED"]>>;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "MASTERED" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    orderIndex?: number | undefined;
    unitId?: string | undefined;
    estimatedMinutes?: number | undefined;
    difficulty?: number | undefined;
    importance?: number | undefined;
    confidence?: number | undefined;
}, {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "MASTERED" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    orderIndex?: number | undefined;
    unitId?: string | undefined;
    estimatedMinutes?: number | undefined;
    difficulty?: number | undefined;
    importance?: number | undefined;
    confidence?: number | undefined;
}>;
export type UpdateTopic = z.infer<typeof UpdateTopicSchema>;
export declare const GeneratePlanRequestSchema: z.ZodObject<{
    examinationId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    targetEndDate: z.ZodOptional<z.ZodString>;
    subjectIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dailyHoursLimit: z.ZodDefault<z.ZodNumber>;
    sessionDurationMinutes: z.ZodDefault<z.ZodNumber>;
    breakMinutes: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    dailyHoursLimit: number;
    sessionDurationMinutes: number;
    breakMinutes: number;
    examinationId?: string | undefined;
    startDate?: string | undefined;
    targetEndDate?: string | undefined;
    subjectIds?: string[] | undefined;
}, {
    examinationId?: string | undefined;
    startDate?: string | undefined;
    targetEndDate?: string | undefined;
    subjectIds?: string[] | undefined;
    dailyHoursLimit?: number | undefined;
    sessionDurationMinutes?: number | undefined;
    breakMinutes?: number | undefined;
}>;
export type GeneratePlanRequest = z.infer<typeof GeneratePlanRequestSchema>;
export declare const CompleteSessionRequestSchema: z.ZodObject<{
    actualDurationMinutes: z.ZodNumber;
    reflectionScore: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    actualDurationMinutes: number;
    reflectionScore?: number | undefined;
    notes?: string | undefined;
}, {
    actualDurationMinutes: number;
    reflectionScore?: number | undefined;
    notes?: string | undefined;
}>;
export type CompleteSessionRequest = z.infer<typeof CompleteSessionRequestSchema>;
export declare const RescheduleSessionRequestSchema: z.ZodObject<{
    newStart: z.ZodString;
    newEnd: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newStart: string;
    newEnd: string;
}, {
    newStart: string;
    newEnd: string;
}>;
export type RescheduleSessionRequest = z.infer<typeof RescheduleSessionRequestSchema>;
export declare const AnswerFormatEnum: z.ZodEnum<["EXPLAIN", "SIMPLE", "DETAILED", "STEP_BY_STEP", "EXAM_2M", "EXAM_5M", "EXAM_10M", "EXAM_12M", "EXAM_15M", "SHORT_NOTES", "BULLET_POINTS", "TABLE", "CODE", "MATH_DERIVATION", "FLASHCARDS", "QUIZ"]>;
export type AnswerFormat = z.infer<typeof AnswerFormatEnum>;
export declare const AIStreamRequestSchema: z.ZodObject<{
    conversationId: z.ZodOptional<z.ZodString>;
    prompt: z.ZodString;
    formatType: z.ZodDefault<z.ZodEnum<["EXPLAIN", "SIMPLE", "DETAILED", "STEP_BY_STEP", "EXAM_2M", "EXAM_5M", "EXAM_10M", "EXAM_12M", "EXAM_15M", "SHORT_NOTES", "BULLET_POINTS", "TABLE", "CODE", "MATH_DERIVATION", "FLASHCARDS", "QUIZ"]>>;
    topicId: z.ZodOptional<z.ZodString>;
    subjectId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    prompt: string;
    formatType: "EXPLAIN" | "SIMPLE" | "DETAILED" | "STEP_BY_STEP" | "EXAM_2M" | "EXAM_5M" | "EXAM_10M" | "EXAM_12M" | "EXAM_15M" | "SHORT_NOTES" | "BULLET_POINTS" | "TABLE" | "CODE" | "MATH_DERIVATION" | "FLASHCARDS" | "QUIZ";
    subjectId?: string | undefined;
    conversationId?: string | undefined;
    topicId?: string | undefined;
}, {
    prompt: string;
    subjectId?: string | undefined;
    conversationId?: string | undefined;
    formatType?: "EXPLAIN" | "SIMPLE" | "DETAILED" | "STEP_BY_STEP" | "EXAM_2M" | "EXAM_5M" | "EXAM_10M" | "EXAM_12M" | "EXAM_15M" | "SHORT_NOTES" | "BULLET_POINTS" | "TABLE" | "CODE" | "MATH_DERIVATION" | "FLASHCARDS" | "QUIZ" | undefined;
    topicId?: string | undefined;
}>;
export type AIStreamRequest = z.infer<typeof AIStreamRequestSchema>;
export declare const SubmitQuizAttemptSchema: z.ZodObject<{
    quizId: z.ZodString;
    responses: z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        studentAnswer: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        studentAnswer: string;
    }, {
        questionId: string;
        studentAnswer: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    quizId: string;
    responses: {
        questionId: string;
        studentAnswer: string;
    }[];
}, {
    quizId: string;
    responses: {
        questionId: string;
        studentAnswer: string;
    }[];
}>;
export type SubmitQuizAttempt = z.infer<typeof SubmitQuizAttemptSchema>;
export declare const RecordRecallRequestSchema: z.ZodObject<{
    topicId: z.ZodString;
    recallRating: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    topicId: string;
    recallRating: number;
}, {
    topicId: string;
    recallRating: number;
}>;
export type RecordRecallRequest = z.infer<typeof RecordRecallRequestSchema>;
export declare const UpdatePreferencesSchema: z.ZodObject<{
    theme: z.ZodOptional<z.ZodEnum<["light", "dark", "system"]>>;
    timezone: z.ZodOptional<z.ZodString>;
    dailyStudyMinutesGoal: z.ZodOptional<z.ZodNumber>;
    sessionDurationPref: z.ZodOptional<z.ZodNumber>;
    breakDurationPref: z.ZodOptional<z.ZodNumber>;
    weeklyAvailability: z.ZodOptional<z.ZodString>;
    reducedMotion: z.ZodOptional<z.ZodBoolean>;
    soundEffects: z.ZodOptional<z.ZodBoolean>;
    hapticFeedback: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    theme?: "light" | "dark" | "system" | undefined;
    timezone?: string | undefined;
    dailyStudyMinutesGoal?: number | undefined;
    sessionDurationPref?: number | undefined;
    breakDurationPref?: number | undefined;
    weeklyAvailability?: string | undefined;
    reducedMotion?: boolean | undefined;
    soundEffects?: boolean | undefined;
    hapticFeedback?: boolean | undefined;
}, {
    theme?: "light" | "dark" | "system" | undefined;
    timezone?: string | undefined;
    dailyStudyMinutesGoal?: number | undefined;
    sessionDurationPref?: number | undefined;
    breakDurationPref?: number | undefined;
    weeklyAvailability?: string | undefined;
    reducedMotion?: boolean | undefined;
    soundEffects?: boolean | undefined;
    hapticFeedback?: boolean | undefined;
}>;
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
//# sourceMappingURL=index.d.ts.map