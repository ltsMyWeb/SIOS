import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, LogOut, Plus, Save, Users } from "lucide-react";
import type { AppSession, TeacherOverviewResponse } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const pageMotion = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay } }),
};

export default function TeacherConsoleLive() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { status: string; note: string }>>({});
  const [newStudent, setNewStudent] = useState({ name: "", classId: "", section: "", rollNo: "" });

  const sessionQuery = useQuery<AppSession>({ queryKey: ["/api/session"] });
  const session = sessionQuery.data;

  const overviewQuery = useQuery<TeacherOverviewResponse>({
    queryKey: ["/api/teacher-console/overview"],
    enabled: session?.role === "teacher",
  });

  const loginMutation = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", "/api/teacher-console/login", { loginId, password })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
      toast({ title: "Teacher logged in", description: "You can now update attendance and notes." });
    },
    onError: (error) =>
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid login",
        variant: "destructive",
      }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/logout")).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
      queryClient.removeQueries({ queryKey: ["/api/teacher-console/overview"] });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status?: string; note?: string }) =>
      (await apiRequest("PATCH", `/api/students/${id}`, { status, note })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-console/overview"] });
      toast({ title: "Saved", description: "Student record updated." });
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
      toast({ title: "Student added", description: "The new student is now in the selected class." });
    },
    onError: (error) =>
      toast({
        title: "Could not add student",
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

  if (session?.role === "principal") {
    return (
      <div className="min-h-screen si-gradient">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Card className="si-card rounded-[28px] border bg-card/80 p-8 backdrop-blur">
            <p className="font-serif text-3xl font-semibold">Principal session detected</p>
            <p className="mt-3 text-sm text-foreground/65">
              This page is only for teachers. Open the principal console for staff access management.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild className="rounded-2xl">
                <Link href="/principal-console">Open Principal Console</Link>
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
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <motion.div initial="hidden" animate="show" variants={pageMotion}>
            <Card className="w-full rounded-[32px] border bg-card/80 p-8 shadow-[var(--shadow-2)] backdrop-blur">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">SIOS School Hub</p>
                <h1 className="mt-3 font-serif text-4xl font-semibold">Teacher Console</h1>
                <p className="mt-3 text-sm text-foreground/65">Log in with your teacher login ID and password.</p>
              </div>
              <form
                className="mt-6 space-y-4"
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
                  {loginMutation.isPending ? "Signing in..." : "Open Teacher Console"}
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
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen si-gradient">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
        <motion.header initial="hidden" animate="show" variants={pageMotion} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" className="rounded-2xl" asChild>
                <Link href="/dashboard">
                  <span className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Dashboard
                  </span>
                </Link>
              </Button>
              <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-xs">
                Logged in as {session.label}
              </Badge>
            </div>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight">Teacher Console</h1>
            <p className="mt-2 text-sm text-foreground/65">
              Mark attendance, update notes, and add students only inside your assigned classes.
            </p>
          </div>
          <Button variant="secondary" className="rounded-2xl" onClick={() => logoutMutation.mutate()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </motion.header>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
          <motion.div custom={0.08} initial="hidden" animate="show" variants={pageMotion}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Assigned classes</p>
                  <p className="mt-1 text-xs text-foreground/58">Only these classes can be edited from this account</p>
                </div>
                <Users className="h-4 w-4 text-foreground/55" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {teacherClasses.map((item) => (
                  <Badge key={item.id} variant="secondary" className="rounded-full px-3 py-1.5">
                    {item.name}
                  </Badge>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-foreground/10 bg-background/45 p-4">
                <p className="text-sm font-semibold">Add student</p>
                <p className="mt-1 text-xs text-foreground/58">Class is selected from your assigned list only.</p>
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
          </motion.div>

          <motion.div custom={0.14} initial="hidden" animate="show" variants={pageMotion}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Student records</p>
                  <p className="mt-1 text-xs text-foreground/58">Mark students present, absent, or late and save notes.</p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1.5">
                  {students.length} students
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {students.length ? (
                  students.map((student, index) => {
                    const draft = drafts[student.id] ?? { status: student.status, note: student.note };

                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="rounded-[24px] border border-foreground/10 bg-background/45 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="mt-1 text-xs text-foreground/58">
                              {student.classId.toUpperCase()} • Roll #{student.rollNo}
                            </p>
                          </div>
                          <Badge variant="secondary" className="rounded-full px-3 py-1.5">
                            {draft.status === "P" ? "Present" : draft.status === "A" ? "Absent" : draft.status === "L" ? "Late" : "Not marked"}
                          </Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {[
                            { value: "P", label: "Present" },
                            { value: "A", label: "Absent" },
                            { value: "L", label: "Late" },
                          ].map((mark) => (
                            <Button
                              key={mark.value}
                              type="button"
                              variant={draft.status === mark.value ? "default" : "secondary"}
                              className="rounded-full px-4"
                              onClick={() =>
                                setDrafts((current) => ({
                                  ...current,
                                  [student.id]: { ...draft, status: mark.value },
                                }))
                              }
                            >
                              {mark.label}
                            </Button>
                          ))}
                        </div>

                        <Input
                          value={draft.note}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [student.id]: { ...draft, note: event.target.value },
                            }))
                          }
                          placeholder="Teacher note"
                          className="mt-4"
                        />

                        <Button
                          className="mt-4 h-11 rounded-2xl"
                          onClick={() => updateStudentMutation.mutate({ id: student.id, status: draft.status, note: draft.note })}
                          disabled={updateStudentMutation.isPending}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save changes
                        </Button>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="rounded-[24px] border border-foreground/10 bg-background/45 p-4 text-sm text-foreground/65">
                    No students are showing for this teacher account yet.
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
