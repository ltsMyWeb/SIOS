import { z } from "zod";

export const schoolRoleSchema = z.enum(["teacher", "principal", "student"]);

export const studentStatusSchema = z.union([
  z.literal(""),
  z.literal("P"),
  z.literal("A"),
  z.literal("L"),
]);

export const subjectScoresSchema = z.record(z.string(), z.number().min(0).max(100));

export const classroomSchema = z.object({
  id: z.string(),
  name: z.string(),
  grade: z.string(),
  section: z.string(),
  termDelta: z.number(),
  trend: z.array(z.number().min(0).max(100)).min(2),
});

export const schoolClassOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  grade: z.string(),
  section: z.string(),
});

export const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  classId: z.string(),
  rollNo: z.number().int().positive(),
  section: z.string(),
  attendance: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
  subjectScores: subjectScoresSchema,
  last7: z.array(z.number().min(0).max(100)).min(2),
  status: studentStatusSchema,
  note: z.string(),
});

export const classSummarySchema = classroomSchema.extend({
  students: z.number().int().nonnegative(),
  attendance: z.number().min(0).max(100),
  atRisk: z.number().int().nonnegative(),
});

export const insightSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  tone: z.enum(["info", "warn", "good"]),
});

export const schoolUpdateSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  tag: z.enum(["Academics", "Attendance", "Events", "Notice"]),
  publishedAt: z.string(),
});

export const dashboardKpisSchema = z.object({
  totalStudents: z.number().int().nonnegative(),
  averageAttendance: z.number().min(0).max(100),
  averageOverall: z.number().min(0).max(100),
  flaggedStudents: z.number().int().nonnegative(),
});

export const backendMetaSchema = z.object({
  provider: z.enum(["firebase", "memory"]),
  configured: z.boolean(),
  detail: z.string().optional(),
});

export const dashboardResponseSchema = z.object({
  classes: z.array(classSummarySchema),
  students: z.array(studentSchema),
  insights: z.array(insightSchema),
  updates: z.array(schoolUpdateSchema),
  kpis: dashboardKpisSchema,
  backend: backendMetaSchema,
});

export const classDetailResponseSchema = z.object({
  classroom: classSummarySchema.extend({ mathAverage: z.number().min(0).max(100) }),
  students: z.array(studentSchema),
  highlights: z.object({ bestStudentId: z.string(), atRiskStudentId: z.string() }),
  backend: backendMetaSchema,
});

export const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  tone: z.enum(["info", "warn", "good"]),
});

export const studentDetailResponseSchema = z.object({
  student: studentSchema,
  classroom: classSummarySchema,
  recommendations: z.array(recommendationSchema),
  backend: backendMetaSchema,
});

export const teacherOverviewResponseSchema = z.object({
  students: z.array(studentSchema),
  classes: z.array(classSummarySchema),
  logs: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string(),
      level: z.enum(["INFO", "WARN", "SYS"]),
      message: z.string(),
    }),
  ),
  backend: backendMetaSchema,
});

export const appSessionSchema = z.object({
  authenticated: z.boolean(),
  role: schoolRoleSchema.nullable(),
  label: z.string().nullable(),
  teacherId: z.string().nullable(),
  studentId: z.string().nullable(),
  classIds: z.array(z.string()),
});

export const teacherAuthSchema = z.object({
  loginId: z.string().min(3).max(40),
  password: z.string().min(4).max(80),
});

export const studentAuthSchema = z.object({
  classId: z.string().min(1),
  rollNo: z.coerce.number().int().positive(),
  studentName: z.string().min(2).max(80),
});

export const principalAuthSchema = z.object({ principalCode: z.string().min(1) });

export const teacherAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  loginId: z.string(),
  passwordHash: z.string(),
  accessCode: z.string(),
  classIds: z.array(z.string()),
  active: z.boolean(),
});

export const publicTeacherSchema = teacherAccountSchema.omit({ passwordHash: true });

export const createTeacherSchema = z.object({
  name: z.string().min(2).max(80),
  loginId: z.string().min(3).max(40),
  password: z.string().min(4).max(80),
  classIds: z.array(z.string().min(1)).min(1),
});

export const updateTeacherSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  loginId: z.string().min(3).max(40).optional(),
  password: z.string().min(4).max(80).optional(),
  classIds: z.array(z.string().min(1)).min(1).optional(),
  active: z.boolean().optional(),
});

export const updatePrincipalCodeSchema = z.object({ principalCode: z.string().min(1) });

export const principalOverviewResponseSchema = z.object({
  teachers: z.array(publicTeacherSchema),
  classes: z.array(classSummarySchema),
  classOptions: z.array(schoolClassOptionSchema),
  backend: backendMetaSchema,
});

export const createStudentSchema = z.object({
  name: z.string().min(2).max(80),
  classId: z.string().min(1),
  section: z.string().min(1).max(12),
  rollNo: z.coerce.number().int().positive(),
});

export const updateStudentSchema = z.object({
  status: studentStatusSchema.optional(),
  note: z.string().max(280).optional(),
});

export const schoolCatalogResponseSchema = z.object({
  name: z.string(),
  classes: z.array(schoolClassOptionSchema),
  updates: z.array(schoolUpdateSchema),
  backend: backendMetaSchema,
});

export const studentPortalResponseSchema = z.object({
  student: studentSchema,
  classroom: classSummarySchema,
  recommendations: z.array(recommendationSchema),
  updates: z.array(schoolUpdateSchema),
  backend: backendMetaSchema,
});

export type SchoolRole = z.infer<typeof schoolRoleSchema>;
export type StudentStatus = z.infer<typeof studentStatusSchema>;
export type Classroom = z.infer<typeof classroomSchema>;
export type SchoolClassOption = z.infer<typeof schoolClassOptionSchema>;
export type ClassSummary = z.infer<typeof classSummarySchema>;
export type StudentRecord = z.infer<typeof studentSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type SchoolUpdate = z.infer<typeof schoolUpdateSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
export type ClassDetailResponse = z.infer<typeof classDetailResponseSchema>;
export type StudentDetailResponse = z.infer<typeof studentDetailResponseSchema>;
export type TeacherOverviewResponse = z.infer<typeof teacherOverviewResponseSchema>;
export type AppSession = z.infer<typeof appSessionSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type TeacherAuthInput = z.infer<typeof teacherAuthSchema>;
export type StudentAuthInput = z.infer<typeof studentAuthSchema>;
export type PrincipalAuthInput = z.infer<typeof principalAuthSchema>;
export type TeacherAccount = z.infer<typeof teacherAccountSchema>;
export type PublicTeacher = z.infer<typeof publicTeacherSchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type PrincipalOverviewResponse = z.infer<typeof principalOverviewResponseSchema>;
export type UpdatePrincipalCodeInput = z.infer<typeof updatePrincipalCodeSchema>;
export type BackendMeta = z.infer<typeof backendMetaSchema>;
export type SchoolCatalogResponse = z.infer<typeof schoolCatalogResponseSchema>;
export type StudentPortalResponse = z.infer<typeof studentPortalResponseSchema>;
