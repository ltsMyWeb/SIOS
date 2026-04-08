import {
  backendMetaSchema,
  classSummarySchema,
  classroomSchema,
  createStudentSchema,
  createTeacherSchema,
  dashboardResponseSchema,
  principalOverviewResponseSchema,
  publicTeacherSchema,
  schoolCatalogResponseSchema,
  schoolClassOptionSchema,
  studentDetailResponseSchema,
  studentPortalResponseSchema,
  studentSchema,
  teacherAccountSchema,
  teacherOverviewResponseSchema,
  type BackendMeta,
  type ClassDetailResponse,
  type ClassSummary,
  type Classroom,
  type CreateStudentInput,
  type CreateTeacherInput,
  type DavPublicFeed,
  type DashboardResponse,
  type PrincipalOverviewResponse,
  type PublicTeacher,
  type SchoolCatalogResponse,
  type SchoolClassOption,
  type SchoolUpdate,
  type StudentDetailResponse,
  type TeacherAnalysis,
  type StudentPortalResponse,
  type StudentRecord,
  type TeacherAccount,
  type TeacherOverviewResponse,
  type UpdatePrincipalCodeInput,
  type UpdateStudentInput,
  type UpdateTeacherInput,
} from "@shared/schema";
import { randomUUID } from "crypto";
import type { Firestore } from "firebase-admin/firestore";
import { getDavPublicFeed } from "./dav-site";
import { describeFirebaseIssue, getFirestoreDb, probeFirestore } from "./firebase";
import { generateAccessCode, hashPassword, setPrincipalCode, verifyPassword } from "./principal-auth";
import { seedClasses, seedStudents } from "./seed-data";

type StorageCollections = {
  classes: Classroom[];
  students: StudentRecord[];
  teachers: TeacherAccount[];
};

type TeacherIdentity = {
  id: string;
  label: string;
  classIds: string[];
};

type StudentIdentity = {
  id: string;
  label: string;
  classIds: string[];
};

export interface IStorage {
  getBackendMeta(): BackendMeta;
  getSchoolCatalog(): Promise<SchoolCatalogResponse>;
  getDashboardData(): Promise<DashboardResponse>;
  getClassDetail(classId: string): Promise<ClassDetailResponse | null>;
  getStudentDetail(studentId: string): Promise<StudentDetailResponse | null>;
  getStudentPortal(studentId: string): Promise<StudentPortalResponse | null>;
  getTeacherOverview(classIds: string[]): Promise<TeacherOverviewResponse>;
  getPrincipalOverview(): Promise<PrincipalOverviewResponse>;
  authenticateTeacher(loginId: string, password: string): Promise<TeacherIdentity | null>;
  authenticateStudent(classId: string, rollNo: number, studentName: string): Promise<StudentIdentity | null>;
  createTeacher(input: CreateTeacherInput): Promise<PublicTeacher>;
  updateTeacher(teacherId: string, input: UpdateTeacherInput): Promise<PublicTeacher | null>;
  updatePrincipalCode(input: UpdatePrincipalCodeInput): Promise<{ principalCode: string }>;
  createStudent(input: CreateStudentInput): Promise<StudentRecord>;
  updateStudent(studentId: string, patch: UpdateStudentInput): Promise<StudentRecord | null>;
  canTeacherAccessClass(classIds: string[], classId: string): Promise<boolean>;
  canTeacherAccessStudent(classIds: string[], studentId: string): Promise<boolean>;
}

const SCHOOL_NAME = "SIOS School Hub";
const GRADE_ORDER = ["Pre-Primary", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function getTodayDateKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function withDerivedAttendance(student: StudentRecord): StudentRecord {
  const fallbackHistory =
    !student.attendanceHistory.length && student.status
      ? [
          {
            dateKey: getTodayDateKey(),
            status: student.status,
            markedAt: student.updatedAt || new Date().toISOString(),
            note: student.note,
          },
        ]
      : student.attendanceHistory;
  const todayEntry = fallbackHistory.find((entry) => entry.dateKey === getTodayDateKey());
  return {
    ...student,
    attendanceHistory: fallbackHistory,
    status: todayEntry?.status ?? "",
    updatedAt: student.updatedAt || todayEntry?.markedAt || "",
  };
}

function isAtRisk(student: StudentRecord) {
  return student.attendance < 88 || student.overall < 70 || student.subjectScores.Math < 65;
}

function classOrder(classroom: Pick<Classroom, "grade" | "section">) {
  const gradeIndex = GRADE_ORDER.indexOf(classroom.grade);
  return `${String(gradeIndex === -1 ? 99 : gradeIndex).padStart(2, "0")}-${classroom.section}`;
}

function sortClasses<T extends Pick<Classroom, "grade" | "section" | "name">>(classes: T[]) {
  return [...classes].sort((a, b) => classOrder(a).localeCompare(classOrder(b)) || a.name.localeCompare(b.name));
}

function toClassOption(classroom: Classroom): SchoolClassOption {
  return schoolClassOptionSchema.parse({
    id: classroom.id,
    name: classroom.name,
    grade: classroom.grade,
    section: classroom.section,
  });
}

function summarizeClassroom(classroom: Classroom, students: StudentRecord[]): ClassSummary {
  const attendance = students.reduce((acc, student) => acc + student.attendance, 0) / Math.max(1, students.length);

  return classSummarySchema.parse({
    ...classroom,
    students: students.length,
    attendance: round(attendance),
    atRisk: students.filter(isAtRisk).length,
  });
}

function buildSchoolUpdates(classes: ClassSummary[], students: StudentRecord[]): SchoolUpdate[] {
  const attendanceClass = [...classes].sort((a, b) => b.attendance - a.attendance)[0];
  const flaggedCount = students.filter(isAtRisk).length;

  return [
    {
      id: "notice-assembly",
      title: "Morning assembly stays at 8:00 AM",
      detail: "Teachers can keep attendance locked by 8:10 AM so daily reports stay accurate.",
      tag: "Notice",
      publishedAt: "Today",
    },
    {
      id: "event-review-week",
      title: "Review week is active for senior classes",
      detail: "Classes 9 to 12 should keep one short revision check each day this week.",
      tag: "Academics",
      publishedAt: "Today",
    },
    {
      id: "attendance-watch",
      title: `${flaggedCount} students need follow-up`,
      detail: attendanceClass
        ? `${attendanceClass.name} is leading attendance right now and can be used as the model section.`
        : "Attendance follow-up cards will appear once live data is available.",
      tag: "Attendance",
      publishedAt: "Today",
    },
  ];
}

function buildInsights(classes: ClassSummary[], students: StudentRecord[]) {
  const insights: DashboardResponse["insights"] = [];
  const softening = classes.find((item) => item.trend[0] - item.trend[item.trend.length - 1] >= 3);
  const mathRisk = students.find((student) => student.subjectScores.Math < 65);
  const strongClass = [...classes].sort((a, b) => b.attendance - a.attendance)[0];

  if (strongClass) {
    insights.push({
      id: "best-class",
      title: `${strongClass.name} is the strongest section this week`,
      detail: `Attendance is ${strongClass.attendance}% and only ${strongClass.atRisk} students are currently flagged.`,
      tone: "good",
    });
  }

  if (softening) {
    insights.push({
      id: "attendance-softening",
      title: `${softening.name} needs an attendance check`,
      detail: `The 7-day trend eased from ${softening.trend[0]}% to ${softening.trend[softening.trend.length - 1]}%.`,
      tone: "warn",
    });
  }

  if (mathRisk) {
    insights.push({
      id: "math-risk",
      title: `${mathRisk.name} needs math support`,
      detail: `Math is at ${mathRisk.subjectScores.Math}%. A short remedial cycle can help quickly.`,
      tone: "warn",
    });
  }

  if (!insights.length) {
    insights.push({
      id: "steady-school",
      title: "School trend is steady",
      detail: "Attendance and academic scores are in a healthy range this week.",
      tone: "info",
    });
  }

  return insights;
}

function buildLogs(classes: ClassSummary[], students: StudentRecord[], backend: BackendMeta): TeacherOverviewResponse["logs"] {
  const now = new Date();
  const flagged = students.filter(isAtRisk).length;

  return [
    {
      id: "log-backend",
      timestamp: now.toLocaleTimeString(),
      level: backend.configured ? "SYS" : "WARN",
      message: backend.configured ? "Live backend connected" : backend.detail ?? "Backend setup still needed",
    },
    {
      id: "log-flagged",
      timestamp: new Date(now.getTime() - 60000).toLocaleTimeString(),
      level: flagged > 2 ? "WARN" : "INFO",
      message: `${flagged} students are currently marked for follow-up`,
    },
    {
      id: "log-best-class",
      timestamp: new Date(now.getTime() - 120000).toLocaleTimeString(),
      level: "INFO",
      message: `Best class right now: ${classes[0]?.name ?? "No live class yet"}`,
    },
  ];
}

function buildStudentRecommendations(student: StudentRecord): StudentDetailResponse["recommendations"] {
  return [
    {
      id: "attendance",
      title: student.attendance < 88 ? "Attendance needs attention" : "Attendance is stable",
      detail:
        student.attendance < 88
          ? "Keep a 10-day check-in plan and talk to home if absences continue."
          : "Keep the current attendance routine and reward steady punctuality.",
      tone: student.attendance < 88 ? "warn" : "good",
    },
    {
      id: "math",
      title: student.subjectScores.Math < 65 ? "Math support recommended" : "Math is moving well",
      detail:
        student.subjectScores.Math < 65
          ? "Use three short revision sessions and one quick quiz at the end of the week."
          : "Add one higher-level practice set to keep progress moving.",
      tone: student.subjectScores.Math < 65 ? "warn" : "good",
    },
    {
      id: "reflection",
      title: "Weekly reflection helps",
      detail: "A short weekly self-check on confidence, effort, and blockers can improve consistency.",
      tone: "info",
    },
  ];
}

function buildTeacherAnalyses(students: StudentRecord[], classes: Classroom[]): TeacherAnalysis[] {
  return students
    .map((student) => {
      const classroom = classes.find((item) => item.id === student.classId);
      const strengths = Object.entries(student.subjectScores)
        .filter(([, score]) => score >= 80)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([subject, score]) => `${subject} is strong at ${score}%`);

      const focusAreas = Object.entries(student.subjectScores)
        .filter(([, score]) => score < 70)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3)
        .map(([subject, score]) => `${subject} needs support at ${score}%`);

      const actionPlan = [
        student.attendance < 88 ? "Watch attendance for the next 10 school days." : "Keep attendance routine steady.",
        focusAreas[0]
          ? `Plan one short revision block for ${focusAreas[0].split(" ")[0]}.`
          : "Push one challenge worksheet to maintain academic momentum.",
        student.note ? `Use the teacher note during the next parent update: "${student.note}"` : "Add one fresh teacher note after the next review.",
      ];

      const targetOverall = Math.min(100, Math.max(student.overall + 6, 75));
      const priority: TeacherAnalysis["priority"] =
        student.overall < 65 || student.attendance < 82 ? "high" : student.overall < 75 || student.attendance < 90 ? "medium" : "low";

      return {
        studentId: student.id,
        studentName: student.name,
        classLabel: classroom?.name ?? student.classId.toUpperCase(),
        priority,
        summary:
          priority === "high"
            ? `${student.name} needs an urgent academic follow-up plan.`
            : priority === "medium"
              ? `${student.name} can improve quickly with one focused support cycle.`
              : `${student.name} is doing well and can be pushed toward higher achievement.`,
        strengths: strengths.length ? strengths : ["General classroom consistency is improving."],
        focusAreas: focusAreas.length ? focusAreas : ["No major weak subject is showing right now."],
        actionPlan,
        targetOverall,
      };
    })
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority] || a.studentName.localeCompare(b.studentName);
    });
}

function emptyDavFeed(): DavPublicFeed {
  return {
    schoolName: "DAV Public School",
    campusLabel: "East of Loni Road, Shahdara, Delhi",
    sourceUrl: "https://daveastofloniroad.org",
    fetchedAt: new Date().toISOString(),
    notices: [],
    birthdays: [],
    quickLinks: [
      { id: "dav-home", title: "Official school website", url: "https://daveastofloniroad.org" },
      { id: "dav-gallery", title: "Photo gallery", url: "https://daveastofloniroad.org/Full/Photo/all" },
      { id: "dav-contact", title: "Contact us", url: "https://daveastofloniroad.org/34E2E822-B2A3-4EFF-9D6C-986FFD77F5DD/CMS/Page/Contact-Us" },
    ],
    contact: {
      address: "DAV Public School, East of Loni Road, Shahdara, Delhi",
    },
  };
}

function sanitizeTeacher(teacher: TeacherAccount): PublicTeacher {
  return publicTeacherSchema.parse({
    id: teacher.id,
    name: teacher.name,
    loginId: teacher.loginId,
    accessCode: teacher.accessCode,
    classIds: teacher.classIds,
    active: teacher.active,
  });
}

class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

function asBackendUnavailable(error: unknown) {
  if (error instanceof BackendUnavailableError) return error;
  const detail = describeFirebaseIssue(error);
  return detail ? new BackendUnavailableError(detail) : null;
}

abstract class BaseStorage implements IStorage {
  abstract getBackendMeta(): BackendMeta;
  protected abstract readCollections(): Promise<StorageCollections>;
  protected abstract writeStudent(student: StudentRecord): Promise<StudentRecord>;
  protected abstract writeTeacher(teacher: TeacherAccount): Promise<TeacherAccount>;

  async getSchoolCatalog(): Promise<SchoolCatalogResponse> {
    const { classes, students } = await this.readCollections();
    const activeStudents = students.map(withDerivedAttendance);
    const summaries = classes.map((classroom) => summarizeClassroom(classroom, activeStudents.filter((student) => student.classId === classroom.id)));
    const davFeed = await getDavPublicFeed();

    return schoolCatalogResponseSchema.parse({
      name: SCHOOL_NAME,
      classes: sortClasses(classes).map(toClassOption),
      updates: buildSchoolUpdates(summaries, activeStudents),
      davFeed,
      backend: this.getBackendMeta(),
    });
  }

  async getDashboardData(): Promise<DashboardResponse> {
    const { classes, students } = await this.readCollections();
    const activeStudents = students.map(withDerivedAttendance);
    const summaries = sortClasses(
      classes.map((classroom) => summarizeClassroom(classroom, activeStudents.filter((student) => student.classId === classroom.id))),
    );
    const averageAttendance = activeStudents.reduce((acc, student) => acc + student.attendance, 0) / Math.max(1, activeStudents.length);
    const averageOverall = activeStudents.reduce((acc, student) => acc + student.overall, 0) / Math.max(1, activeStudents.length);
    const davFeed = await getDavPublicFeed();

    return dashboardResponseSchema.parse({
      classes: summaries,
      students: activeStudents.sort((a, b) => a.name.localeCompare(b.name)),
      insights: buildInsights(summaries, activeStudents),
      updates: buildSchoolUpdates(summaries, activeStudents),
      davFeed,
      kpis: {
        totalStudents: activeStudents.length,
        averageAttendance: round(averageAttendance),
        averageOverall: round(averageOverall),
        flaggedStudents: activeStudents.filter(isAtRisk).length,
      },
      backend: this.getBackendMeta(),
    });
  }

  async getClassDetail(classId: string): Promise<ClassDetailResponse | null> {
    const { classes, students } = await this.readCollections();
    const classroom = classes.find((item) => item.id === classId);
    if (!classroom) return null;

    const classStudents = students.filter((student) => student.classId === classId).map(withDerivedAttendance).sort((a, b) => a.rollNo - b.rollNo);
    const summary = summarizeClassroom(classroom, classStudents);
    const bestStudent = [...classStudents].sort((a, b) => b.overall - a.overall)[0] ?? classStudents[0];
    const atRiskStudent = [...classStudents].sort((a, b) => a.overall + a.attendance - (b.overall + b.attendance))[0] ?? classStudents[0];

    return {
      classroom: {
        ...summary,
        mathAverage: round(classStudents.reduce((acc, student) => acc + student.subjectScores.Math, 0) / Math.max(1, classStudents.length)),
      },
      students: classStudents,
      highlights: {
        bestStudentId: bestStudent?.id ?? "",
        atRiskStudentId: atRiskStudent?.id ?? "",
      },
      backend: this.getBackendMeta(),
    };
  }

  async getStudentDetail(studentId: string): Promise<StudentDetailResponse | null> {
    const { classes, students } = await this.readCollections();
    const student = students.find((item) => item.id === studentId);
    if (!student) return null;

    const classroom = classes.find((item) => item.id === student.classId);
    if (!classroom) return null;

    const activeStudent = withDerivedAttendance(student);

    return studentDetailResponseSchema.parse({
      student: activeStudent,
      classroom: summarizeClassroom(classroom, students.filter((item) => item.classId === classroom.id).map(withDerivedAttendance)),
      recommendations: buildStudentRecommendations(activeStudent),
      backend: this.getBackendMeta(),
    });
  }

  async getStudentPortal(studentId: string): Promise<StudentPortalResponse | null> {
    const { classes, students } = await this.readCollections();
    const student = students.find((item) => item.id === studentId);
    if (!student) return null;

    const classroom = classes.find((item) => item.id === student.classId);
    if (!classroom) return null;

    const activeStudent = withDerivedAttendance(student);
    const activeStudents = students.map(withDerivedAttendance);
    const summaries = classes.map((item) => summarizeClassroom(item, activeStudents.filter((studentItem) => studentItem.classId === item.id)));
    const davFeed = await getDavPublicFeed();

    return studentPortalResponseSchema.parse({
      student: activeStudent,
      classroom: summarizeClassroom(classroom, activeStudents.filter((item) => item.classId === classroom.id)),
      recommendations: buildStudentRecommendations(activeStudent),
      updates: buildSchoolUpdates(summaries, activeStudents),
      davFeed,
      backend: this.getBackendMeta(),
    });
  }

  async getTeacherOverview(classIds: string[]): Promise<TeacherOverviewResponse> {
    const { classes, students } = await this.readCollections();
    const activeStudents = students.map(withDerivedAttendance);
    const allowedClassIds = new Set(classIds.map((item) => item.toLowerCase()));
    const filteredStudents = activeStudents.filter((student) => allowedClassIds.has(student.classId.toLowerCase()));
    const filteredClasses = sortClasses(
      classes
        .filter((classroom) => allowedClassIds.has(classroom.id.toLowerCase()))
        .map((classroom) => summarizeClassroom(classroom, filteredStudents.filter((student) => student.classId === classroom.id))),
    );
    const davFeed = await getDavPublicFeed();

    return teacherOverviewResponseSchema.parse({
      students: filteredStudents.sort((a, b) => a.classId.localeCompare(b.classId) || a.rollNo - b.rollNo),
      classes: filteredClasses,
      analyses: buildTeacherAnalyses(filteredStudents, classes),
      davFeed,
      logs: buildLogs(filteredClasses, filteredStudents, this.getBackendMeta()),
      backend: this.getBackendMeta(),
    });
  }

  async getPrincipalOverview(): Promise<PrincipalOverviewResponse> {
    const { classes, students, teachers } = await this.readCollections();
    const summaries = sortClasses(
      classes.map((classroom) => summarizeClassroom(classroom, students.filter((student) => student.classId === classroom.id))),
    );

    return principalOverviewResponseSchema.parse({
      teachers: teachers.map(sanitizeTeacher).sort((a, b) => a.name.localeCompare(b.name)),
      classes: summaries,
      classOptions: sortClasses(classes).map(toClassOption),
      backend: this.getBackendMeta(),
    });
  }

  async authenticateTeacher(loginId: string, password: string): Promise<TeacherIdentity | null> {
    const { teachers } = await this.readCollections();
    const teacher = teachers.find((item) => item.active && item.loginId.toLowerCase() === loginId.trim().toLowerCase());

    if (!teacher || !verifyPassword(password, teacher.passwordHash)) return null;

    return { id: teacher.id, label: teacher.name, classIds: teacher.classIds };
  }

  async authenticateStudent(classId: string, rollNo: number, studentName: string): Promise<StudentIdentity | null> {
    const { students } = await this.readCollections();
    const normalizedClassId = classId.trim().toLowerCase();
    const normalizedName = studentName.trim().toLowerCase();

    const student = students.find(
      (item) =>
        item.classId.toLowerCase() === normalizedClassId &&
        item.rollNo === rollNo &&
        item.name.trim().toLowerCase() === normalizedName,
    );

    if (!student) return null;

    return { id: student.id, label: student.name, classIds: [student.classId] };
  }

  async createTeacher(input: CreateTeacherInput): Promise<PublicTeacher> {
    const parsed = createTeacherSchema.parse({
      ...input,
      loginId: input.loginId.trim().toLowerCase(),
      classIds: input.classIds.map((item) => item.toLowerCase()),
    });
    const { classes, teachers } = await this.readCollections();

    if (teachers.some((teacher) => teacher.loginId.toLowerCase() === parsed.loginId.toLowerCase())) {
      throw new Error("Login ID already exists");
    }

    const validClasses = new Set(classes.map((item) => item.id.toLowerCase()));
    if (parsed.classIds.some((item) => !validClasses.has(item))) {
      throw new Error("One or more assigned classes do not exist");
    }

    const takenClasses = new Set(teachers.flatMap((teacher) => teacher.classIds.map((id) => id.toLowerCase())));
    if (parsed.classIds.some((item) => takenClasses.has(item))) {
      throw new Error("One or more classes are already assigned to another teacher");
    }

    const teacher = teacherAccountSchema.parse({
      id: `teacher-${randomUUID().slice(0, 8)}`,
      name: parsed.name.trim(),
      loginId: parsed.loginId,
      passwordHash: hashPassword(parsed.password),
      accessCode: generateAccessCode(),
      classIds: parsed.classIds,
      active: true,
    });

    return sanitizeTeacher(await this.writeTeacher(teacher));
  }

  async updateTeacher(teacherId: string, input: UpdateTeacherInput): Promise<PublicTeacher | null> {
    const { classes, teachers } = await this.readCollections();
    const existing = teachers.find((teacher) => teacher.id === teacherId);
    if (!existing) return null;

    const parsed: UpdateTeacherInput = {
      ...input,
      loginId: input.loginId?.trim().toLowerCase(),
      classIds: input.classIds?.map((item) => item.toLowerCase()),
    };

    if (parsed.loginId) {
      const collision = teachers.find((teacher) => teacher.id !== teacherId && teacher.loginId.toLowerCase() === parsed.loginId);
      if (collision) throw new Error("Login ID already exists");
    }

    if (parsed.classIds) {
      const validClasses = new Set(classes.map((item) => item.id.toLowerCase()));
      if (parsed.classIds.some((item) => !validClasses.has(item))) {
        throw new Error("One or more assigned classes do not exist");
      }

      const takenByOthers = new Set(
        teachers
          .filter((teacher) => teacher.id !== teacherId)
          .flatMap((teacher) => teacher.classIds.map((id) => id.toLowerCase())),
      );
      if (parsed.classIds.some((item) => takenByOthers.has(item))) {
        throw new Error("One or more classes are already assigned to another teacher");
      }
    }

    const nextTeacher = teacherAccountSchema.parse({
      ...existing,
      ...parsed,
      name: parsed.name?.trim() ?? existing.name,
      passwordHash: parsed.password ? hashPassword(parsed.password) : existing.passwordHash,
      classIds: parsed.classIds ?? existing.classIds,
      accessCode:
        parsed.loginId || parsed.password || parsed.classIds || parsed.active !== undefined || parsed.name
          ? generateAccessCode()
          : existing.accessCode,
    });

    return sanitizeTeacher(await this.writeTeacher(nextTeacher));
  }

  async updatePrincipalCode(input: UpdatePrincipalCodeInput) {
    return { principalCode: setPrincipalCode(input.principalCode) };
  }

  async createStudent(input: CreateStudentInput): Promise<StudentRecord> {
    const parsed = createStudentSchema.parse(input);
    const newStudent = studentSchema.parse({
      id: `st-${randomUUID().slice(0, 8)}`,
      name: parsed.name.trim(),
      classId: parsed.classId.toLowerCase(),
      rollNo: parsed.rollNo,
      section: parsed.section.toUpperCase(),
      attendance: 0,
      overall: 0,
      subjectScores: {
        Math: 0,
        Science: 0,
        English: 0,
        Social: 0,
        Computer: 0,
      },
      last7: [0, 0, 0, 0, 0, 0, 0],
      status: "",
      note: "Newly enrolled from Teacher Console.",
      attendanceHistory: [],
      updatedAt: new Date().toISOString(),
    });

    return this.writeStudent(newStudent);
  }

  async updateStudent(studentId: string, patch: UpdateStudentInput): Promise<StudentRecord | null> {
    const { students } = await this.readCollections();
    const existing = students.find((item) => item.id === studentId);
    if (!existing) return null;

    const todayDateKey = getTodayDateKey();
    const nextAttendanceHistory =
      patch.status
        ? [
            ...existing.attendanceHistory.filter((entry) => entry.dateKey !== todayDateKey),
            {
              dateKey: todayDateKey,
              status: patch.status,
              markedAt: new Date().toISOString(),
              note: patch.note ?? existing.note,
            },
          ].sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        : existing.attendanceHistory;

    const updated = studentSchema.parse({
      ...existing,
      ...patch,
      note: patch.note ?? existing.note,
      status: patch.status ?? withDerivedAttendance(existing).status,
      attendanceHistory: nextAttendanceHistory,
      updatedAt: new Date().toISOString(),
    });

    return this.writeStudent(updated);
  }

  async canTeacherAccessClass(classIds: string[], classId: string) {
    return classIds.map((item) => item.toLowerCase()).includes(classId.toLowerCase());
  }

  async canTeacherAccessStudent(classIds: string[], studentId: string) {
    const { students } = await this.readCollections();
    const student = students.find((item) => item.id === studentId);
    if (!student) return false;
    return this.canTeacherAccessClass(classIds, student.classId);
  }
}

class FirebaseStorage extends BaseStorage {
  private seeded = false;
  private backendDetail: string | undefined;

  constructor(private readonly db: Firestore) {
    super();
  }

  getBackendMeta(): BackendMeta {
    return backendMetaSchema.parse({
      provider: "firebase",
      configured: !this.backendDetail,
      detail: this.backendDetail,
    });
  }

  private async ensureBackendReady() {
    const status = await probeFirestore();
    this.backendDetail = status.detail;

    if (!status.configured) {
      throw new BackendUnavailableError(
        status.detail ?? "Firebase credentials are present, but the database is not reachable yet.",
      );
    }
  }

  private async runFirestore<T>(operation: () => Promise<T>) {
    try {
      await this.ensureBackendReady();
      const result = await operation();
      this.backendDetail = undefined;
      return result;
    } catch (error) {
      const backendError = asBackendUnavailable(error);
      if (backendError) {
        this.backendDetail = backendError.message;
        throw backendError;
      }
      throw error;
    }
  }

  private async ensureSeeded() {
    if (this.seeded) return;

    const classSnapshot = await this.runFirestore(() => this.db.collection("classes").limit(1).get());
    if (classSnapshot.empty) {
      const batch = this.db.batch();
      for (const classroom of seedClasses) {
        batch.set(this.db.collection("classes").doc(classroom.id), classroom);
      }
      for (const student of seedStudents) {
        batch.set(this.db.collection("students").doc(student.id), student);
      }
      await this.runFirestore(() => batch.commit());
    }

    this.seeded = true;
  }

  protected async readCollections(): Promise<StorageCollections> {
    await this.ensureSeeded();

    const [classSnapshot, studentSnapshot, teacherSnapshot] = await this.runFirestore(() =>
      Promise.all([
        this.db.collection("classes").get(),
        this.db.collection("students").get(),
        this.db.collection("teachers").get(),
      ]),
    );

    return {
      classes: classSnapshot.docs.map((doc) => classroomSchema.parse(doc.data())),
      students: studentSnapshot.docs.map((doc) => studentSchema.parse(doc.data())),
      teachers: teacherSnapshot.docs.map((doc) => teacherAccountSchema.parse(doc.data())),
    };
  }

  protected async writeStudent(student: StudentRecord): Promise<StudentRecord> {
    await this.ensureSeeded();
    await this.runFirestore(() => this.db.collection("students").doc(student.id).set(student));
    return student;
  }

  protected async writeTeacher(teacher: TeacherAccount): Promise<TeacherAccount> {
    await this.ensureSeeded();
    await this.runFirestore(() => this.db.collection("teachers").doc(teacher.id).set(teacher));
    return teacher;
  }

  async getDashboardData(): Promise<DashboardResponse> {
    try {
      return await super.getDashboardData();
    } catch (error) {
      const backendError = asBackendUnavailable(error);
      if (!backendError) throw error;
      this.backendDetail = backendError.message;
      return dashboardResponseSchema.parse({
        classes: [],
        students: [],
        insights: [],
        updates: [],
        davFeed: emptyDavFeed(),
        kpis: { totalStudents: 0, averageAttendance: 0, averageOverall: 0, flaggedStudents: 0 },
        backend: this.getBackendMeta(),
      });
    }
  }

  async getSchoolCatalog(): Promise<SchoolCatalogResponse> {
    try {
      return await super.getSchoolCatalog();
    } catch (error) {
      const backendError = asBackendUnavailable(error);
      if (!backendError) throw error;
      this.backendDetail = backendError.message;
      return schoolCatalogResponseSchema.parse({
        name: SCHOOL_NAME,
        classes: sortClasses(seedClasses).map(toClassOption),
        updates: buildSchoolUpdates([], []),
        davFeed: emptyDavFeed(),
        backend: this.getBackendMeta(),
      });
    }
  }

  async getClassDetail(classId: string): Promise<ClassDetailResponse | null> {
    try {
      return await super.getClassDetail(classId);
    } catch (error) {
      const backendError = asBackendUnavailable(error);
      if (!backendError) throw error;
      this.backendDetail = backendError.message;
      return null;
    }
  }

  async getStudentDetail(studentId: string): Promise<StudentDetailResponse | null> {
    try {
      return await super.getStudentDetail(studentId);
    } catch (error) {
      const backendError = asBackendUnavailable(error);
      if (!backendError) throw error;
      this.backendDetail = backendError.message;
      return null;
    }
  }

  async getStudentPortal(studentId: string): Promise<StudentPortalResponse | null> {
    try {
      return await super.getStudentPortal(studentId);
    } catch (error) {
      const backendError = asBackendUnavailable(error);
      if (!backendError) throw error;
      this.backendDetail = backendError.message;
      return null;
    }
  }

  async getTeacherOverview(classIds: string[]): Promise<TeacherOverviewResponse> {
    try {
      return await super.getTeacherOverview(classIds);
    } catch (error) {
      const backendError = asBackendUnavailable(error);
      if (!backendError) throw error;
      this.backendDetail = backendError.message;
      return teacherOverviewResponseSchema.parse({
        students: [],
        classes: [],
        analyses: [],
        davFeed: emptyDavFeed(),
        logs: [
          {
            id: "firebase-unavailable",
            timestamp: new Date().toLocaleTimeString(),
            level: "WARN",
            message: backendError.message,
          },
        ],
        backend: this.getBackendMeta(),
      });
    }
  }

  async getPrincipalOverview(): Promise<PrincipalOverviewResponse> {
    try {
      return await super.getPrincipalOverview();
    } catch (error) {
      const backendError = asBackendUnavailable(error);
      if (!backendError) throw error;
      this.backendDetail = backendError.message;
      return principalOverviewResponseSchema.parse({
        teachers: [],
        classes: sortClasses(seedClasses).map((classroom) => classSummarySchema.parse({ ...classroom, students: 0, attendance: 0, atRisk: 0 })),
        classOptions: sortClasses(seedClasses).map(toClassOption),
        backend: this.getBackendMeta(),
      });
    }
  }
}

class UnconfiguredFirebaseStorage implements IStorage {
  constructor(private readonly detail?: string) {}

  getBackendMeta(): BackendMeta {
    return backendMetaSchema.parse({
      provider: "firebase",
      configured: false,
      detail: this.detail,
    });
  }

  private throwNotConfigured(): never {
    throw new Error(
      this.detail ??
        "Firebase backend is not connected yet. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to enable persistent storage.",
    );
  }

  async getSchoolCatalog(): Promise<SchoolCatalogResponse> {
    return schoolCatalogResponseSchema.parse({
      name: SCHOOL_NAME,
      classes: sortClasses(seedClasses).map(toClassOption),
      updates: buildSchoolUpdates([], []),
      davFeed: emptyDavFeed(),
      backend: this.getBackendMeta(),
    });
  }

  async getDashboardData(): Promise<DashboardResponse> {
    return dashboardResponseSchema.parse({
      classes: [],
      students: [],
      insights: [],
      updates: buildSchoolUpdates([], []),
      davFeed: emptyDavFeed(),
      kpis: { totalStudents: 0, averageAttendance: 0, averageOverall: 0, flaggedStudents: 0 },
      backend: this.getBackendMeta(),
    });
  }

  async getClassDetail(): Promise<ClassDetailResponse | null> {
    return null;
  }

  async getStudentDetail(): Promise<StudentDetailResponse | null> {
    return null;
  }

  async getStudentPortal(): Promise<StudentPortalResponse | null> {
    return null;
  }

  async getTeacherOverview(): Promise<TeacherOverviewResponse> {
    return teacherOverviewResponseSchema.parse({
      students: [],
      classes: [],
      analyses: [],
      davFeed: emptyDavFeed(),
      logs: [
        {
          id: "firebase-missing",
          timestamp: new Date().toLocaleTimeString(),
          level: "WARN",
          message: "Add Firebase credentials before teachers can save attendance or student updates.",
        },
      ],
      backend: this.getBackendMeta(),
    });
  }

  async getPrincipalOverview(): Promise<PrincipalOverviewResponse> {
    return principalOverviewResponseSchema.parse({
      teachers: [],
      classes: sortClasses(seedClasses).map((classroom) => classSummarySchema.parse({ ...classroom, students: 0, attendance: 0, atRisk: 0 })),
      classOptions: sortClasses(seedClasses).map(toClassOption),
      backend: this.getBackendMeta(),
    });
  }

  async authenticateTeacher(): Promise<TeacherIdentity | null> {
    return this.throwNotConfigured();
  }

  async authenticateStudent(): Promise<StudentIdentity | null> {
    return this.throwNotConfigured();
  }

  async createTeacher(): Promise<PublicTeacher> {
    return this.throwNotConfigured();
  }

  async updateTeacher(): Promise<PublicTeacher | null> {
    return this.throwNotConfigured();
  }

  async updatePrincipalCode(): Promise<{ principalCode: string }> {
    return this.throwNotConfigured();
  }

  async createStudent(): Promise<StudentRecord> {
    return this.throwNotConfigured();
  }

  async updateStudent(): Promise<StudentRecord | null> {
    return this.throwNotConfigured();
  }

  async canTeacherAccessClass(): Promise<boolean> {
    return this.throwNotConfigured();
  }

  async canTeacherAccessStudent(): Promise<boolean> {
    return this.throwNotConfigured();
  }
}

function createStorage() {
  const db = getFirestoreDb();
  if (!db) return new UnconfiguredFirebaseStorage();
  return new FirebaseStorage(db);
}

export const storage = createStorage();





