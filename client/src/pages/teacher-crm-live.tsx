import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  BarChart3,
  BookCheck,
  Clock3,
  Eye,
  EyeOff,
  FileClock,
  LogOut,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { AppSession, StudentRecord, TeacherOverviewResponse } from "@shared/schema";
import SchoolNav from "@/components/school-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { loginTeacher, logoutSession } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

type StudentDraft = {
  status: string;
  note: string;
  subjectScores: Record<string, number>;
};

const reveal = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42 },
  },
};

function getGrade(percentage: number) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

function getPriorityClasses(priority: "low" | "medium" | "high") {
  if (priority === "high") return "bg-red-500/12 text-red-700 border-red-300/45";
  if (priority === "medium") return "bg-amber-500/12 text-amber-700 border-amber-300/45";
  return "bg-emerald-500/12 text-emerald-700 border-emerald-300/45";
}

function getStatusLabel(status: string) {
  if (status === "P") return "Present";
  if (status === "A") return "Absent";
  if (status === "L") return "Late";
  return "Not marked";
}

function getStatusClasses(status: string) {
  if (status === "P") return "bg-emerald-500/12 text-emerald-700 border-emerald-300/45";
  if (status === "A") return "bg-red-500/12 text-red-700 border-red-300/45";
  if (status === "L") return "bg-amber-500/12 text-amber-700 border-amber-300/45";
  return "bg-slate-500/10 text-slate-700 border-slate-300/45";
}

function subjectMessage(score: number) {
  if (score === 0) return "Marks not entered";
  if (score < 60) return "Immediate support";
  if (score < 75) return "Focused revision";
  if (score < 85) return "On track";
  return "Strong command";
}

function TrendBars({ values }: { values: number[] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-full items-end rounded-[16px] border border-foreground/8 bg-background/70 p-1.5">
            <div
              className="si-gradient-bar w-full rounded-[12px]"
              style={{ height: `${Math.max(10, value)}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/40">T{index + 1}</p>
            <p className="text-xs font-semibold">{value}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ArchiveFeed({ student }: { student: StudentRecord }) {
  const entries = [...student.attendanceHistory].reverse();

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-foreground/10 bg-background/55 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Performance trail</p>
            <p className="mt-1 text-xs text-foreground/58">Recent academic momentum from the stored seven-point history</p>
          </div>
          <Badge variant="secondary" className="rounded-full border px-3 py-1">
            Grade {getGrade(student.overall)}
          </Badge>
        </div>
        <div className="mt-4">
          <TrendBars values={student.last7} />
        </div>
      </div>

      <div className="rounded-[24px] border border-foreground/10 bg-background/55 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Student back log</p>
            <p className="mt-1 text-xs text-foreground/58">Chronological attendance and note archive for classroom follow-up</p>
          </div>
          <Archive className="h-4 w-4 text-foreground/45" />
        </div>
        <div className="mt-4 space-y-3">
          {entries.length ? (
            entries.map((entry) => (
              <div key={`${entry.dateKey}-${entry.markedAt}`} className="rounded-[18px] border border-foreground/10 bg-card/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{entry.dateKey}</p>
                    <p className="mt-1 text-xs text-foreground/58">
                      Logged {entry.markedAt ? new Date(entry.markedAt).toLocaleString() : "without timestamp"}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(entry.status)}`}>
                    {getStatusLabel(entry.status)}
                  </span>
                </div>
                {entry.note ? <p className="mt-3 text-sm leading-6 text-foreground/72">{entry.note}</p> : null}
              </div>
            ))
          ) : (
            <div className="rounded-[18px] border border-dashed border-foreground/15 bg-card/70 p-4 text-sm text-foreground/58">
              No archive entries are stored yet for this student.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherConsoleLive() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, StudentDraft>>({});
  const [newStudent, setNewStudent] = useState({ name: "", classId: "", section: "", rollNo: "" });
  const [analysisStudentId, setAnalysisStudentId] = useState("");
  const [recentlySavedStudentId, setRecentlySavedStudentId] = useState<string | null>(null);

  const sessionQuery = useQuery<AppSession>({ queryKey: ["/api/session"] });
  const session = sessionQuery.data;

  const overviewQuery = useQuery<TeacherOverviewResponse>({
    queryKey: ["/api/teacher-console/overview"],
    enabled: session?.role === "teacher",
  });

  const loginMutation = useMutation({
    mutationFn: async () => loginTeacher(loginId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
      toast({ title: "Teacher logged in", description: "You can now manage attendance, marks, and notes." });
    },
    onError: (error) =>
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid login",
        variant: "destructive",
      }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => logoutSession(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
      queryClient.removeQueries({ queryKey: ["/api/teacher-console/overview"] });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      note,
      subjectScores,
    }: {
      id: string;
      status?: string;
      note?: string;
      subjectScores?: Record<string, number>;
    }) => (await apiRequest("PATCH", `/api/students/${id}`, { status, note, subjectScores })).json(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-console/overview"] });
      setRecentlySavedStudentId(variables.id);
      window.setTimeout(() => setRecentlySavedStudentId((current) => (current === variables.id ? null : current)), 2200);
      toast({ title: "Record saved", description: "Student attendance, marks, and notes were updated." });
    },
    onError: (error) =>
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const createStudentMutation = useMutation({
    mutationFn: async () =>
      (
        await apiRequest("POST", "/api/students", {
          name: newStudent.name,
          classId: newStudent.classId,
          section: newStudent.section,
          rollNo: Number(newStudent.rollNo),
        })
      ).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-console/overview"] });
      setNewStudent({ name: "", classId: "", section: "", rollNo: "" });
      toast({ title: "Student added", description: "The student has been added to the assigned class." });
    },
    onError: (error) =>
      toast({
        title: "Could not add student",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-console/overview"] });
      toast({ title: "Student deleted", description: "The student record has been removed." });
    },
    onError: (error) =>
      toast({
        title: "Could not delete student",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const bulkAttendanceMutation = useMutation({
    mutationFn: async ({ studentIds, status }: { studentIds: string[]; status: "P" | "A" | "L" }) => {
      await Promise.all(studentIds.map((studentId) => apiRequest("PATCH", `/api/students/${studentId}`, { status })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-console/overview"] });
      toast({ title: "Attendance saved", description: "Bulk attendance has been applied to the visible students." });
    },
    onError: (error) =>
      toast({
        title: "Bulk attendance failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const teacherClasses = overviewQuery.data?.classes ?? [];
  const classOptions = useMemo(
    () => teacherClasses.map((item) => ({ id: item.id, name: item.name, section: item.section })),
    [teacherClasses],
  );
  const students = overviewQuery.data?.students ?? [];
  const analyses = overviewQuery.data?.analyses ?? [];
  const davFeed = overviewQuery.data?.davFeed;
  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return [...students]
      .filter((student) => (classFilter === "all" ? true : student.classId === classFilter))
      .filter((student) => {
        if (!normalizedQuery) return true;
        return (
          student.name.toLowerCase().includes(normalizedQuery) ||
          student.rollNo.toString().includes(normalizedQuery) ||
          `${student.classId}${student.section}`.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => a.classId.localeCompare(b.classId) || a.rollNo - b.rollNo || a.name.localeCompare(b.name));
  }, [classFilter, searchTerm, students]);
  const filteredStudentIds = new Set(filteredStudents.map((student) => student.id));
  const visibleAnalyses = analyses.filter((item) => filteredStudentIds.has(item.studentId));
  const showScopedPanels = filteredStudents.length > 0 || (classFilter === "all" && !searchTerm.trim());
  const activeAnalysis = showScopedPanels
    ? visibleAnalyses.find((item) => item.studentId === analysisStudentId) ?? visibleAnalyses[0] ?? analyses[0]
    : undefined;
  const activeStudent = showScopedPanels
    ? students.find((item) => item.id === activeAnalysis?.studentId) ?? filteredStudents[0] ?? students[0]
    : undefined;

  const summary = useMemo(() => {
    const totalStudents = students.length;
    const averageAttendance = totalStudents
      ? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / totalStudents)
      : 0;
    const averageOverall = totalStudents
      ? Math.round(students.reduce((sum, student) => sum + student.overall, 0) / totalStudents)
      : 0;
    const reviewCount = students.filter((student) => student.overall < 70 || student.attendance < 88).length;
    return { totalStudents, averageAttendance, averageOverall, reviewCount };
  }, [students]);

  if (session?.role === "principal") {
    return (
      <div className="min-h-screen si-gradient">
        <SchoolNav />
        <div className="mx-auto max-w-3xl px-4 py-28">
          <Card className="si-panel rounded-[28px] p-8 backdrop-blur">
            <p className="font-serif text-3xl font-semibold">Principal session detected</p>
            <p className="mt-3 text-sm text-foreground/65">
              This screen is reserved for teacher operations. Use the leadership console for staff management.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild className="rounded-2xl">
                <Link href="/principal-console">Open Leadership Console</Link>
              </Button>
              <Button variant="secondary" className="rounded-2xl" onClick={() => logoutMutation.mutate()}>
                Logout
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (session?.role !== "teacher") {
    return (
      <div className="min-h-screen si-gradient">
        <SchoolNav />
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 pt-20">
          <Card className="si-panel si-orbit w-full rounded-[36px] p-8 backdrop-blur-xl">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-foreground/42">Teacher workspace</p>
              <h1 className="mt-4 font-serif text-4xl font-semibold">Academic operations console</h1>
              <p className="mt-3 text-sm leading-6 text-foreground/65">
                Sign in with your teacher credentials to manage attendance, marks, student back logs, and review actions.
              </p>
            </div>
            <form
              className="mt-8 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                loginMutation.mutate();
              }}
            >
              <Input value={loginId} onChange={(event) => setLoginId(event.target.value)} placeholder="Teacher login ID" />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="pr-12"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" className="h-12 w-full rounded-2xl">
                {loginMutation.isPending ? "Signing in..." : "Enter teacher workspace"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button asChild variant="secondary" className="rounded-2xl">
                <Link href="/dashboard">
                  <span className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to dashboard
                  </span>
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen si-gradient">
      <SchoolNav />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-8 md:pt-32">
        <motion.header
          initial="hidden"
          animate="show"
          variants={reveal}
          className="si-panel si-orbit si-grid rounded-[38px] p-6 backdrop-blur-xl md:p-8"
        >
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em]">
                  Teacher workspace
                </Badge>
                <Badge variant="secondary" className="rounded-full border px-3 py-1 text-xs">
                  Logged in as {session.label}
                </Badge>
              </div>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold tracking-tight md:text-6xl">
                Precision control for attendance, marks, and student review
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground/68 md:text-base">
                Review current performance, open student back logs, update subject marks, and keep class records consistent from one high-focus academic workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-12 rounded-2xl">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
              <Button variant="secondary" className="h-12 rounded-2xl" onClick={() => logoutMutation.mutate()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <div className="si-kpi rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/42">Classes assigned</p>
                <p className="mt-2 font-serif text-3xl font-semibold">{teacherClasses.length}</p>
              </div>
              <div className="si-kpi rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/42">Students managed</p>
                <p className="mt-2 font-serif text-3xl font-semibold">{summary.totalStudents}</p>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          variants={reveal}
          className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {[
            { label: "Students managed", value: summary.totalStudents, note: "Current visible roster", icon: Users },
            { label: "Average attendance", value: `${summary.averageAttendance}%`, note: "Across assigned classes", icon: Clock3 },
            { label: "Average overall", value: `${summary.averageOverall}%`, note: "Current academic level", icon: BarChart3 },
            { label: "Review queue", value: summary.reviewCount, note: "Attendance or marks below target", icon: TriangleAlert },
          ].map((item) => (
            <Card key={item.label} className="si-kpi si-card-strong rounded-[28px] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground/64">{item.label}</p>
                <item.icon className="h-4 w-4 text-foreground/45" />
              </div>
              <p className="mt-4 font-serif text-4xl font-semibold">{item.value}</p>
              <p className="mt-2 text-xs text-foreground/55">{item.note}</p>
            </Card>
          ))}
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          variants={reveal}
          className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="space-y-5">
            <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
              <div className="si-divider pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Assigned classes</p>
                    <p className="mt-1 text-xs text-foreground/58">Only assigned sections can be edited from this account.</p>
                  </div>
                  <BookCheck className="h-4 w-4 text-foreground/45" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {teacherClasses.map((item) => (
                  <Badge key={item.id} variant="secondary" className="rounded-full border px-3 py-1.5">
                    {item.name}
                  </Badge>
                ))}
              </div>

              <div className="mt-6 rounded-[26px] border border-foreground/10 bg-background/55 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Add student</p>
                    <p className="mt-1 text-xs text-foreground/58">Create a new record directly inside an assigned class.</p>
                  </div>
                  <Plus className="h-4 w-4 text-foreground/45" />
                </div>
                <div className="mt-4 grid gap-3">
                  <Input
                    value={newStudent.name}
                    onChange={(event) => setNewStudent((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Student name"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                      value={newStudent.classId}
                      onValueChange={(value) => {
                        const selected = classOptions.find((item) => item.id === value);
                        setNewStudent((current) => ({
                          ...current,
                          classId: value,
                          section: selected?.section ?? "",
                        }));
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder="Choose class" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 rounded-2xl">
                        {classOptions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={newStudent.rollNo}
                      onChange={(event) => setNewStudent((current) => ({ ...current, rollNo: event.target.value }))}
                      placeholder="Roll number"
                    />
                  </div>
                  <Button
                    className="h-11 rounded-2xl"
                    onClick={() => createStudentMutation.mutate()}
                    disabled={createStudentMutation.isPending || !newStudent.name || !newStudent.classId || !newStudent.rollNo}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {createStudentMutation.isPending ? "Adding..." : "Add student"}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
              <div className="si-divider pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Student registry</p>
                    <p className="mt-1 text-xs text-foreground/58">
                      Search by name or roll number, filter by class, and update records from one board.
                    </p>
                  </div>
                  <Users className="h-4 w-4 text-foreground/45" />
                </div>
              </div>
              <div className="mt-5 rounded-[24px] border border-foreground/10 bg-background/55 p-4">
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search student by name, roll number, or section"
                      className="pl-10"
                    />
                  </div>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">All assigned classes</SelectItem>
                      {classOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="secondary"
                    className="h-11 rounded-2xl"
                    onClick={() =>
                      bulkAttendanceMutation.mutate({
                        studentIds: filteredStudents.map((student) => student.id),
                        status: "P",
                      })
                    }
                    disabled={!filteredStudents.length || bulkAttendanceMutation.isPending}
                  >
                    {bulkAttendanceMutation.isPending ? "Saving..." : "Mark all present"}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground/55">
                  <span>{filteredStudents.length} students shown</span>
                  <span className="text-foreground/30">•</span>
                  <span>{teacherClasses.length} assigned classes</span>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {filteredStudents.length ? (
                  filteredStudents.map((student) => {
                    const draft = drafts[student.id] ?? {
                      status: student.status,
                      note: student.note,
                      subjectScores: { ...student.subjectScores },
                    };
                    const draftOverall =
                      Object.values(draft.subjectScores).reduce((sum, score) => sum + score, 0) /
                      Math.max(1, Object.values(draft.subjectScores).length);
                    const selected = activeStudent?.id === student.id;

                    return (
                      <div
                        key={student.id}
                        className={`rounded-[28px] border p-5 transition-all ${selected ? "border-primary/30 bg-primary/6 shadow-[0_24px_52px_-36px_hsl(var(--primary)/0.55)]" : "border-foreground/10 bg-background/55"}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <button
                              type="button"
                              className="text-left"
                              onClick={() => setAnalysisStudentId(student.id)}
                            >
                              <p className="text-lg font-semibold">{student.name}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-foreground/45">
                                {student.classId.toUpperCase()} | Roll #{student.rollNo}
                              </p>
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(draft.status)}`}>
                              {getStatusLabel(draft.status)}
                            </span>
                            <span className="rounded-full border border-foreground/10 bg-card px-3 py-1 text-xs font-semibold">
                              {draftOverall.toFixed(1)}% | Grade {getGrade(draftOverall)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {[{ value: "P", label: "Present" }, { value: "A", label: "Absent" }, { value: "L", label: "Late" }].map((mark) => (
                            <Button
                              key={mark.value}
                              type="button"
                              variant="secondary"
                              className={`rounded-full px-4 ${
                                draft.status === mark.value
                                  ? mark.value === "P"
                                    ? "border-emerald-300/60 bg-emerald-500/15 text-emerald-800"
                                    : mark.value === "A"
                                      ? "border-red-300/60 bg-red-500/15 text-red-800"
                                      : "border-amber-300/60 bg-amber-500/15 text-amber-800"
                                  : ""
                              }`}
                              onClick={() =>
                                setDrafts((current) => ({ ...current, [student.id]: { ...draft, status: mark.value } }))
                              }
                            >
                              {mark.label}
                            </Button>
                          ))}
                        </div>

                        <div className="mt-4 rounded-[22px] border border-foreground/10 bg-card/80 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-foreground/42">Marks ledger</p>
                              <p className="mt-1 text-xs text-foreground/58">Edit current subject performance and save it directly into the record.</p>
                            </div>
                            <div className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-xs font-semibold">
                              Current overall {draftOverall.toFixed(1)}%
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(draft.subjectScores).map(([subject, score]) => (
                              <label key={subject} className="rounded-[18px] border border-foreground/10 bg-background/80 p-3">
                                <span className="text-xs uppercase tracking-[0.16em] text-foreground/45">{subject}</span>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={String(score)}
                                  onChange={(event) => {
                                    const numeric = Number(event.target.value);
                                    const nextScore = Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : 0;
                                    setDrafts((current) => ({
                                      ...current,
                                      [student.id]: {
                                        ...draft,
                                        subjectScores: { ...draft.subjectScores, [subject]: nextScore },
                                      },
                                    }));
                                  }}
                                  className="mt-2"
                                />
                                <p className="mt-2 text-xs text-foreground/55">{subjectMessage(score)}</p>
                              </label>
                            ))}
                          </div>
                        </div>

                        <Input
                          value={draft.note}
                          onChange={(event) =>
                            setDrafts((current) => ({ ...current, [student.id]: { ...draft, note: event.target.value } }))
                          }
                          placeholder="Teacher note"
                          className="mt-4"
                        />

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            className="h-11 rounded-2xl"
                            onClick={() =>
                              updateStudentMutation.mutate({
                                id: student.id,
                                status: draft.status,
                                note: draft.note,
                                subjectScores: draft.subjectScores,
                              })
                            }
                            disabled={updateStudentMutation.isPending}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {updateStudentMutation.isPending && updateStudentMutation.variables?.id === student.id
                              ? "Saving..."
                              : recentlySavedStudentId === student.id
                                ? "Saved successfully"
                                : "Save record"}
                          </Button>
                          <Button
                            variant="secondary"
                            className="h-11 rounded-2xl"
                            onClick={() => setAnalysisStudentId(student.id)}
                          >
                            <FileClock className="mr-2 h-4 w-4" />
                            View back logs
                          </Button>
                          <Button
                            variant="destructive"
                            className="h-11 rounded-2xl"
                            onClick={() => {
                              if (!window.confirm(`Delete student record for ${student.name}?`)) return;
                              deleteStudentMutation.mutate(student.id);
                            }}
                            disabled={deleteStudentMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[24px] border border-dashed border-foreground/15 bg-background/55 p-6 text-sm text-foreground/58">
                    {students.length
                      ? "No students matched the current search or class filter."
                      : "No student records are visible for this teacher account yet."}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
              <div className="si-divider pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Academic command center</p>
                    <p className="mt-1 text-xs text-foreground/58">Focused review surface for the selected student.</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-foreground/45" />
                </div>
              </div>

              {activeAnalysis ? (
                <div className="mt-5 space-y-4">
                  <Select value={activeAnalysis.studentId} onValueChange={setAnalysisStudentId}>
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Choose student for review" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 rounded-2xl">
                      {(visibleAnalyses.length ? visibleAnalyses : analyses).map((item) => (
                        <SelectItem key={item.studentId} value={item.studentId}>
                          {item.studentName} | {item.classLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="rounded-[26px] border border-foreground/10 bg-background/55 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{activeAnalysis.studentName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-foreground/45">{activeAnalysis.classLabel}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClasses(activeAnalysis.priority)}`}>
                        {activeAnalysis.priority} priority
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-foreground/72">{activeAnalysis.summary}</p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[20px] border border-foreground/10 bg-card/90 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-foreground/42">Current overall</p>
                        <p className="mt-2 font-serif text-3xl font-semibold">{activeStudent?.overall ?? 0}%</p>
                        <p className="mt-1 text-xs text-foreground/58">Grade {getGrade(activeStudent?.overall ?? 0)}</p>
                      </div>
                      <div className="rounded-[20px] border border-foreground/10 bg-card/90 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-foreground/42">Attendance</p>
                        <p className="mt-2 font-serif text-3xl font-semibold">{activeStudent?.attendance ?? 0}%</p>
                        <p className="mt-1 text-xs text-foreground/58">Current session attendance</p>
                      </div>
                      <div className="rounded-[20px] border border-foreground/10 bg-card/90 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-foreground/42">Suggested target</p>
                        <p className="mt-2 font-serif text-3xl font-semibold">{activeAnalysis.targetOverall}%</p>
                        <p className="mt-1 text-xs text-foreground/58">Next review benchmark</p>
                      </div>
                    </div>
                  </div>

                  {activeStudent ? (
                    <div className="rounded-[26px] border border-foreground/10 bg-background/55 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">Subject performance map</p>
                          <p className="mt-1 text-xs text-foreground/58">Current marks across all recorded study areas.</p>
                        </div>
                        <BarChart3 className="h-4 w-4 text-foreground/45" />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {Object.entries(activeStudent.subjectScores)
                          .sort((a, b) => b[1] - a[1])
                          .map(([subject, score]) => (
                            <div key={subject} className="rounded-[18px] border border-foreground/10 bg-card/90 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.18em] text-foreground/42">{subject}</p>
                                  <p className="mt-2 font-serif text-3xl font-semibold">{score}%</p>
                                </div>
                                <span className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-xs font-semibold">
                                  {subjectMessage(score)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-4 xl:grid-cols-3">
                    <div className="rounded-[24px] border border-foreground/10 bg-background/55 p-5">
                      <p className="text-sm font-semibold">Strengths</p>
                      <div className="mt-4 space-y-3">
                        {activeAnalysis.strengths.map((item) => (
                          <p key={item} className="text-sm leading-6 text-foreground/72">{item}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-foreground/10 bg-background/55 p-5">
                      <p className="text-sm font-semibold">Focus areas</p>
                      <div className="mt-4 space-y-3">
                        {activeAnalysis.focusAreas.map((item) => (
                          <p key={item} className="text-sm leading-6 text-foreground/72">{item}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-foreground/10 bg-background/55 p-5">
                      <p className="text-sm font-semibold">Action plan</p>
                      <div className="mt-4 space-y-3">
                        {activeAnalysis.actionPlan.map((item) => (
                          <p key={item} className="text-sm leading-6 text-foreground/72">{item}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-dashed border-foreground/15 bg-background/55 p-6 text-sm text-foreground/58">
                  {students.length
                    ? "Choose a matching student from the registry to open the academic review panel."
                    : "Academic review cards will appear once a student record is available."}
                </div>
              )}
            </Card>

            {activeStudent ? (
              <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
                <div className="si-divider pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Back log archive</p>
                      <p className="mt-1 text-xs text-foreground/58">Stored history for {activeStudent.name}.</p>
                    </div>
                    <FileClock className="h-4 w-4 text-foreground/45" />
                  </div>
                </div>
                <div className="mt-5">
                  <ArchiveFeed student={activeStudent} />
                </div>
              </Card>
            ) : null}

            <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
              <div className="si-divider pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Academic notices</p>
                    <p className="mt-1 text-xs text-foreground/58">Official school notices and quick academic links.</p>
                  </div>
                  <BookCheck className="h-4 w-4 text-foreground/45" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {davFeed?.notices.slice(0, 3).map((item) => (
                  <a
                    key={item.id}
                    href={item.url ?? davFeed.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-[20px] border border-foreground/10 bg-background/55 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]"
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-2 text-xs text-foreground/55">{item.publishedAt}</p>
                  </a>
                )) ?? null}
              </div>
              <div className="mt-4 grid gap-3">
                {davFeed?.quickLinks.slice(0, 3).map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[18px] border border-foreground/10 bg-background/55 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]"
                  >
                    {item.title}
                  </a>
                )) ?? null}
              </div>
            </Card>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
