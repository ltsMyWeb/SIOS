import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, LogOut, ShieldCheck, Trash2, UserCog } from "lucide-react";
import type { AppSession, PrincipalOverviewResponse } from "@shared/schema";
import SchoolNav from "@/components/school-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { loginPrincipal, logoutSession } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TeacherDraft = {
  name: string;
  loginId: string;
  password: string;
  classIds: string[];
  active: boolean;
  showPassword: boolean;
  classPicker: string;
};

const reveal = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45 },
  },
};

export default function PrincipalConsoleLive() {
  const [principalPassword, setPrincipalPassword] = useState("");
  const [newPrincipalPassword, setNewPrincipalPassword] = useState("");
  const [showPrincipalPassword, setShowPrincipalPassword] = useState(false);
  const [showNewPrincipalPassword, setShowNewPrincipalPassword] = useState(false);
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    loginId: "",
    password: "",
    classIds: [] as string[],
    classPicker: "",
  });
  const [editingTeachers, setEditingTeachers] = useState<Record<string, TeacherDraft>>({});

  const sessionQuery = useQuery<AppSession>({ queryKey: ["/api/session"] });
  const principalSession = sessionQuery.data?.role === "principal" ? sessionQuery.data : null;

  const principalLoginMutation = useMutation({
    mutationFn: async () => loginPrincipal(principalPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
      toast({ title: "Principal logged in", description: "You can now manage teacher accounts." });
    },
    onError: (error) =>
      toast({
        title: "Access denied",
        description: error instanceof Error ? error.message : "Invalid principal password",
        variant: "destructive",
      }),
  });

  const overviewQuery = useQuery<PrincipalOverviewResponse>({
    queryKey: ["/api/principal/overview"],
    enabled: principalSession !== null,
  });
  const backendConfigured = overviewQuery.data?.backend.configured ?? false;

  const logoutMutation = useMutation({
    mutationFn: async () => logoutSession(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
      queryClient.removeQueries({ queryKey: ["/api/principal/overview"] });
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async () =>
      (
        await apiRequest("POST", "/api/principal/teachers", {
          name: teacherForm.name,
          loginId: teacherForm.loginId,
          password: teacherForm.password,
          classIds: teacherForm.classIds,
        })
      ).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/principal/overview"] });
      setTeacherForm({ name: "", loginId: "", password: "", classIds: [], classPicker: "" });
      toast({ title: "Teacher created", description: "New staff account saved to the backend." });
    },
    onError: (error) =>
      toast({
        title: "Could not create teacher",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const draft = editingTeachers[teacherId];
      return (
        await apiRequest("PATCH", `/api/principal/teachers/${teacherId}`, {
          name: draft.name,
          loginId: draft.loginId,
          password: draft.password || undefined,
          classIds: draft.classIds,
          active: draft.active,
        })
      ).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/principal/overview"] });
      toast({ title: "Teacher updated", description: "Teacher details and class access saved." });
    },
    onError: (error) =>
      toast({
        title: "Could not update teacher",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      await apiRequest("DELETE", `/api/principal/teachers/${teacherId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/principal/overview"] });
      toast({ title: "Teacher deleted", description: "The teacher account has been removed." });
    },
    onError: (error) =>
      toast({
        title: "Could not delete teacher",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const updatePrincipalPasswordMutation = useMutation({
    mutationFn: async () =>
      (await apiRequest("PATCH", "/api/principal/password", { password: newPrincipalPassword })).json(),
    onSuccess: () => {
      setNewPrincipalPassword("");
      toast({ title: "Principal password updated", description: "Use the new password next time you log in." });
    },
    onError: (error) =>
      toast({
        title: "Could not update principal password",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const classOptions = useMemo(() => overviewQuery.data?.classOptions ?? [], [overviewQuery.data?.classOptions]);
  const takenClassIds = useMemo(
    () => new Set((overviewQuery.data?.teachers ?? []).flatMap((teacher) => teacher.classIds)),
    [overviewQuery.data?.teachers],
  );
  const availableCreateClasses = useMemo(
    () => classOptions.filter((item) => !takenClassIds.has(item.id)),
    [classOptions, takenClassIds],
  );

  useEffect(() => {
    const teachers = overviewQuery.data?.teachers ?? [];
    if (!teachers.length) return;
    setEditingTeachers((current) => {
      const next = { ...current };
      for (const teacher of teachers) {
        next[teacher.id] ??= {
          name: teacher.name,
          loginId: teacher.loginId,
          password: "",
          classIds: teacher.classIds,
          active: teacher.active,
          showPassword: false,
          classPicker: "",
        };
      }
      return next;
    });
  }, [overviewQuery.data?.teachers]);

  const addCreateClass = (value: string) => {
    if (!value || teacherForm.classIds.includes(value)) return;
    setTeacherForm((current) => ({ ...current, classIds: [...current.classIds, value], classPicker: "" }));
  };

  const removeCreateClass = (value: string) =>
    setTeacherForm((current) => ({
      ...current,
      classIds: current.classIds.filter((item) => item !== value),
    }));

  const addEditClass = (teacherId: string, value: string) => {
    if (!value) return;
    setEditingTeachers((current) => {
      const draft = current[teacherId];
      if (!draft || draft.classIds.includes(value)) return current;
      return {
        ...current,
        [teacherId]: { ...draft, classIds: [...draft.classIds, value], classPicker: "" },
      };
    });
  };

  const removeEditClass = (teacherId: string, value: string) =>
    setEditingTeachers((current) => ({
      ...current,
      [teacherId]: {
        ...current[teacherId],
        classIds: current[teacherId].classIds.filter((item) => item !== value),
      },
    }));

  if (sessionQuery.data?.role === "teacher") {
    return (
      <div className="min-h-screen si-gradient">
        <SchoolNav />
        <div className="mx-auto max-w-3xl px-4 py-28">
          <Card className="si-card rounded-[28px] border bg-card/80 p-8 backdrop-blur">
            <p className="font-serif text-3xl font-semibold">Teacher session detected</p>
            <p className="mt-3 text-sm text-foreground/65">
              This page is only for the principal. Return to the teacher console for attendance and student updates.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild className="rounded-2xl">
                <Link href="/teacher-console">Open Teacher Console</Link>
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

  if (!principalSession) {
    return (
      <div className="min-h-screen si-gradient">
        <SchoolNav />
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 pt-20">
          <Card className="w-full rounded-[32px] border bg-card/80 p-8 shadow-[var(--shadow-2)] backdrop-blur">
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-full border border-emerald-600/20 bg-emerald-600/10 p-4">
                <ShieldCheck className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">SIOS School Hub</p>
                <h1 className="mt-3 font-serif text-4xl font-semibold">Principal Console</h1>
                <p className="mt-2 text-sm text-foreground/60">
                  Manage staff access, passwords, and class ownership.
                </p>
              </div>
              <form
                className="w-full space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  principalLoginMutation.mutate();
                }}
              >
                <div className="relative">
                  <Input
                    type={showPrincipalPassword ? "text" : "password"}
                    placeholder="Principal password"
                    className="h-12 pr-12 text-center"
                    value={principalPassword}
                    onChange={(event) => setPrincipalPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground"
                    onClick={() => setShowPrincipalPassword((current) => !current)}
                  >
                    {showPrincipalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="submit" className="h-12 w-full rounded-2xl">
                  {principalLoginMutation.isPending || sessionQuery.isLoading ? "Checking..." : "Open Principal Console"}
                </Button>
              </form>
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
          className="rounded-[34px] border border-white/55 bg-card/75 p-6 shadow-[var(--shadow-2)] backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
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
                  Principal session active
                </Badge>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-foreground/45">Leadership office</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-5xl">Principal Console</h1>
              <p className="mt-3 max-w-2xl text-sm text-foreground/67 md:text-base">
                Create teacher accounts, protect staff access, assign class ownership, and keep school operations
                organised in one place.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:w-[300px]">
              <Button asChild className="h-12 rounded-2xl">
                <Link href="/teacher-console">Teacher Console</Link>
              </Button>
              <Button variant="secondary" className="h-12 rounded-2xl" onClick={() => logoutMutation.mutate()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </motion.header>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          variants={reveal}
          className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <Card className="si-card si-noise rounded-[30px] border bg-card/80 p-5 backdrop-blur">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-foreground/55" />
              <p className="text-sm font-semibold">Create teacher account</p>
            </div>
            <div className="mt-4 grid gap-3">
              {!backendConfigured ? (
                <div className="rounded-[22px] border border-amber-300/50 bg-amber-50/85 p-4 text-sm text-amber-900">
                  {overviewQuery.data?.backend.detail ??
                    "Backend setup is still needed before teacher accounts can be created."}
                </div>
              ) : null}
              <Input
                value={teacherForm.name}
                onChange={(event) => setTeacherForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Teacher name"
                disabled={!backendConfigured}
              />
              <Input
                value={teacherForm.loginId}
                onChange={(event) => setTeacherForm((current) => ({ ...current, loginId: event.target.value }))}
                placeholder="Login ID"
                disabled={!backendConfigured}
              />
              <div className="relative">
                <Input
                  type={showTeacherPassword ? "text" : "password"}
                  value={teacherForm.password}
                  onChange={(event) => setTeacherForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Password"
                  className="pr-12"
                  disabled={!backendConfigured}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground"
                  onClick={() => setShowTeacherPassword((current) => !current)}
                  disabled={!backendConfigured}
                >
                  {showTeacherPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="rounded-[24px] border border-foreground/10 bg-background/45 p-4">
                <p className="text-sm font-semibold">Available classes</p>
                <p className="mt-1 text-xs text-foreground/58">
                  Classes already assigned to other teachers are hidden here.
                </p>
                <div className="mt-4 grid gap-3">
                  <Select
                    value={teacherForm.classPicker}
                    onValueChange={addCreateClass}
                    disabled={!backendConfigured || !availableCreateClasses.length}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder={availableCreateClasses.length ? "Choose class" : "No free classes left"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 rounded-2xl">
                      {availableCreateClasses.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    {teacherForm.classIds.map((classId) => {
                      const classInfo = classOptions.find((item) => item.id === classId);
                      return (
                        <button
                          key={classId}
                          type="button"
                          onClick={() => removeCreateClass(classId)}
                          className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-xs transition hover:bg-background/70"
                        >
                          {classInfo?.name ?? classId} ×
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Button
                className="h-11 rounded-2xl"
                onClick={() => createTeacherMutation.mutate()}
                disabled={
                  createTeacherMutation.isPending ||
                  !backendConfigured ||
                  !teacherForm.name ||
                  !teacherForm.loginId ||
                  !teacherForm.password ||
                  !teacherForm.classIds.length
                }
              >
                {createTeacherMutation.isPending ? "Creating..." : "Create teacher"}
              </Button>
            </div>

            <div className="mt-6 rounded-[24px] border border-foreground/10 bg-background/45 p-4">
              <p className="text-sm font-semibold">Change principal password</p>
              <div className="mt-3 grid gap-3">
                <div className="relative">
                  <Input
                    type={showNewPrincipalPassword ? "text" : "password"}
                    value={newPrincipalPassword}
                    onChange={(event) => setNewPrincipalPassword(event.target.value)}
                    placeholder="New principal password"
                    className="pr-12"
                    disabled={!backendConfigured}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground"
                    onClick={() => setShowNewPrincipalPassword((current) => !current)}
                    disabled={!backendConfigured}
                  >
                    {showNewPrincipalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  className="h-11 rounded-2xl"
                  onClick={() => updatePrincipalPasswordMutation.mutate()}
                  disabled={
                    updatePrincipalPasswordMutation.isPending || !newPrincipalPassword.trim() || !backendConfigured
                  }
                >
                  {updatePrincipalPasswordMutation.isPending ? "Updating..." : "Update principal password"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="si-card si-noise rounded-[30px] border bg-card/80 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Teacher directory</p>
                <p className="mt-1 text-xs text-foreground/58">
                  Edit passwords, login IDs, status, and class assignments.
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-xs">
                {(overviewQuery.data?.teachers ?? []).length} teachers
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              {(overviewQuery.data?.teachers ?? []).length ? (
                overviewQuery.data!.teachers.map((teacher) => {
                  const draft = editingTeachers[teacher.id];
                  if (!draft) return null;
                  const availableEditClasses = classOptions.filter(
                    (item) =>
                      !takenClassIds.has(item.id) ||
                      teacher.classIds.includes(item.id) ||
                      draft.classIds.includes(item.id),
                  );

                  return (
                    <div key={teacher.id} className="rounded-[24px] border border-foreground/10 bg-background/45 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="mt-1 text-xs text-foreground/58">Access code: {teacher.accessCode}</p>
                        </div>
                        <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-xs">
                          {teacher.active ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <Input
                          value={draft.name}
                          onChange={(event) =>
                            setEditingTeachers((current) => ({
                              ...current,
                              [teacher.id]: { ...draft, name: event.target.value },
                            }))
                          }
                          placeholder="Teacher name"
                        />
                        <Input
                          value={draft.loginId}
                          onChange={(event) =>
                            setEditingTeachers((current) => ({
                              ...current,
                              [teacher.id]: { ...draft, loginId: event.target.value },
                            }))
                          }
                          placeholder="Login ID"
                        />
                        <div className="relative">
                          <Input
                            type={draft.showPassword ? "text" : "password"}
                            value={draft.password}
                            onChange={(event) =>
                              setEditingTeachers((current) => ({
                                ...current,
                                [teacher.id]: { ...draft, password: event.target.value },
                              }))
                            }
                            placeholder="New password (optional)"
                            className="pr-12"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground"
                            onClick={() =>
                              setEditingTeachers((current) => ({
                                ...current,
                                [teacher.id]: { ...draft, showPassword: !draft.showPassword },
                              }))
                            }
                          >
                            {draft.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="rounded-[22px] border border-foreground/10 bg-background/35 p-4">
                          <p className="text-xs text-foreground/58">Assigned classes</p>
                          <div className="mt-3 grid gap-3">
                            <Select value={draft.classPicker} onValueChange={(value) => addEditClass(teacher.id, value)}>
                              <SelectTrigger className="h-11 rounded-2xl">
                                <SelectValue placeholder="Choose class" />
                              </SelectTrigger>
                              <SelectContent className="max-h-72 rounded-2xl">
                                {availableEditClasses.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-2">
                              {draft.classIds.map((classId) => {
                                const classInfo = classOptions.find((item) => item.id === classId);
                                return (
                                  <button
                                    key={classId}
                                    type="button"
                                    onClick={() => removeEditClass(teacher.id, classId)}
                                    className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-xs transition hover:bg-background/70"
                                  >
                                    {classInfo?.name ?? classId} ×
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-foreground/70">
                          <input
                            type="checkbox"
                            checked={draft.active}
                            onChange={(event) =>
                              setEditingTeachers((current) => ({
                                ...current,
                                [teacher.id]: { ...draft, active: event.target.checked },
                              }))
                            }
                          />
                          Active account
                        </label>
                        <Button
                          className="h-11 rounded-2xl"
                          onClick={() => updateTeacherMutation.mutate(teacher.id)}
                          disabled={updateTeacherMutation.isPending}
                        >
                          Save teacher changes
                        </Button>
                        <Button
                          variant="destructive"
                          className="h-11 rounded-2xl"
                          onClick={() => {
                            if (!window.confirm(`Delete teacher account for ${teacher.name}?`)) return;
                            deleteTeacherMutation.mutate(teacher.id);
                          }}
                          disabled={deleteTeacherMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete teacher
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-foreground/10 bg-background/45 p-4 text-sm text-foreground/65">
                  No teacher accounts created yet.
                </div>
              )}
            </div>
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          variants={reveal}
          className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <Card className="si-card rounded-[30px] border bg-card/80 p-6 backdrop-blur">
            <p className="text-sm font-semibold">Principal standards</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: "Controlled access",
                  detail: "Every class is assigned on purpose so teachers only work inside the right sections.",
                },
                {
                  title: "Simple staff setup",
                  detail: "Login IDs, passwords, and active status all stay in one clear leadership panel.",
                },
                {
                  title: "Role protection",
                  detail: "Teachers stay limited to assigned classes while the principal keeps full control.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-2 text-sm text-foreground/65">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="si-card rounded-[30px] border bg-card/80 p-6 backdrop-blur">
            <p className="text-sm font-semibold">Access note</p>
            <p className="mt-4 text-sm leading-6 text-foreground/68">
              Principal access stays hardcoded for now and is organised so Firebase Authentication can replace it later
              without changing the rest of the console flow.
            </p>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}
