import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, BookOpen, LogOut, Trophy } from "lucide-react";
import type { AppSession, SchoolCatalogResponse, StudentPortalResponse } from "@shared/schema";
import SchoolNav from "@/components/school-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay },
  }),
};

export default function StudentPortalLive() {
  const [classId, setClassId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [studentName, setStudentName] = useState("");

  const sessionQuery = useQuery<AppSession>({ queryKey: ["/api/session"] });
  const session = sessionQuery.data;

  const catalogQuery = useQuery<SchoolCatalogResponse>({ queryKey: ["/api/catalog"] });
  const portalQuery = useQuery<StudentPortalResponse>({
    queryKey: ["/api/student-portal/overview"],
    enabled: session?.role === "student",
  });

  const loginMutation = useMutation({
    mutationFn: async () =>
      (
        await apiRequest("POST", "/api/student-portal/login", {
          classId,
          rollNo: Number(rollNo),
          studentName,
        })
      ).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
      toast({ title: "Student logged in", description: "Portal opened successfully." });
    },
    onError: (error) =>
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check the details and try again.",
        variant: "destructive",
      }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/logout")).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
      queryClient.removeQueries({ queryKey: ["/api/student-portal/overview"] });
    },
  });

  const classOptions = useMemo(() => catalogQuery.data?.classes ?? [], [catalogQuery.data?.classes]);

  if (session?.role === "teacher") {
    return (
      <div className="min-h-screen si-gradient">
        <SchoolNav />
        <div className="mx-auto max-w-3xl px-4 py-28">
          <Card className="si-card rounded-[28px] border bg-card/80 p-8 backdrop-blur">
            <p className="font-serif text-3xl font-semibold">Teacher session detected</p>
            <p className="mt-3 text-sm text-foreground/65">
              Student Portal is only for students. Open the teacher console for class work.
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

  if (session?.role === "principal") {
    return (
      <div className="min-h-screen si-gradient">
        <SchoolNav />
        <div className="mx-auto max-w-3xl px-4 py-28">
          <Card className="si-card rounded-[28px] border bg-card/80 p-8 backdrop-blur">
            <p className="font-serif text-3xl font-semibold">Principal session detected</p>
            <p className="mt-3 text-sm text-foreground/65">
              Student Portal is only for students. Open the principal console for account management.
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

  if (session?.role !== "student") {
    return (
      <div className="min-h-screen si-gradient">
        <SchoolNav />
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 pt-20">
          <motion.div initial="hidden" animate="show" variants={reveal}>
            <Card className="w-full rounded-[32px] border bg-card/80 p-8 shadow-[var(--shadow-2)] backdrop-blur">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">SIOS School Hub</p>
                <h1 className="mt-3 font-serif text-4xl font-semibold">Student Portal</h1>
                <p className="mt-3 text-sm text-foreground/65">
                  Students can check results, attendance, teacher notes, and school updates here.
                </p>
              </div>
              <form
                className="mt-6 grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  loginMutation.mutate();
                }}
              >
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="h-12 rounded-2xl">
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
                <Input value={rollNo} onChange={(event) => setRollNo(event.target.value)} placeholder="Roll number" />
                <Input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Full student name" />
                <Button type="submit" className="h-12 rounded-2xl">
                  {loginMutation.isPending ? "Opening..." : "Open Student Portal"}
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

  const data = portalQuery.data;

  if (!data) {
    return (
      <div className="min-h-screen si-gradient">
        <SchoolNav />
        <div className="mx-auto max-w-4xl px-4 py-28">
          <Card className="si-card rounded-[28px] border bg-card/80 p-8 backdrop-blur">
            <p className="font-serif text-3xl font-semibold">Loading student portal...</p>
          </Card>
        </div>
      </div>
    );
  }

  const scoreEntries = Object.entries(data.student.subjectScores);
  const davFeed = data.davFeed;

  return (
    <div className="min-h-screen si-gradient">
      <SchoolNav />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-32">
        <motion.header initial="hidden" animate="show" variants={reveal} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
                Welcome, {session.label}
              </Badge>
            </div>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight">Student Portal</h1>
            <p className="mt-2 text-sm text-foreground/65">
              View results, attendance, class progress, and the latest school notices.
            </p>
          </div>
          <Button variant="secondary" className="rounded-2xl" onClick={() => logoutMutation.mutate()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </motion.header>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div custom={0.08} initial="hidden" animate="show" variants={reveal}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Student profile</p>
                  <p className="mt-1 text-xs text-foreground/58">
                    {data.classroom.name} • Roll #{data.student.rollNo}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1.5">
                  {data.student.status || "No mark today"}
                </Badge>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                  <p className="text-xs text-foreground/58">Attendance</p>
                  <p className="mt-2 font-serif text-3xl font-semibold">{data.student.attendance}%</p>
                  <Progress value={data.student.attendance} className="mt-3 h-2" />
                </div>
                <div className="rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                  <p className="text-xs text-foreground/58">Overall</p>
                  <p className="mt-2 font-serif text-3xl font-semibold">{data.student.overall}%</p>
                  <Progress value={data.student.overall} className="mt-3 h-2" />
                </div>
              </div>
              <div className="mt-5 rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                <p className="text-sm font-semibold">Teacher note</p>
                <p className="mt-2 text-sm text-foreground/68">{data.student.note}</p>
                <p className="mt-3 text-xs text-foreground/55">
                  Last updated: {data.student.updatedAt ? new Date(data.student.updatedAt).toLocaleString() : "Not updated yet"}
                </p>
              </div>

              <div className="mt-5 rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                <p className="text-sm font-semibold">Recent attendance log</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.student.attendanceHistory.slice(-6).reverse().map((entry) => (
                    <span key={`${data.student.id}-${entry.dateKey}`} className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-xs">
                      {entry.dateKey} {entry.status}
                    </span>
                  ))}
                  {!data.student.attendanceHistory.length ? (
                    <span className="text-xs text-foreground/55">Attendance history will appear after teachers start marking days.</span>
                  ) : null}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div custom={0.14} initial="hidden" animate="show" variants={reveal}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Subject results</p>
                  <p className="mt-1 text-xs text-foreground/58">Latest score view across subjects</p>
                </div>
                <Trophy className="h-4 w-4 text-foreground/55" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {scoreEntries.map(([subject, score]) => (
                  <div key={subject} className="rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                    <p className="text-xs text-foreground/58">{subject}</p>
                    <p className="mt-2 font-serif text-3xl font-semibold">{score}%</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div custom={0.2} initial="hidden" animate="show" variants={reveal}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Support notes</p>
                  <p className="mt-1 text-xs text-foreground/58">Simple next steps based on your current progress</p>
                </div>
                <BookOpen className="h-4 w-4 text-foreground/55" />
              </div>
              <div className="mt-4 space-y-3">
                {data.recommendations.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-2 text-sm text-foreground/65">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div custom={0.26} initial="hidden" animate="show" variants={reveal}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">School updates</p>
                  <p className="mt-1 text-xs text-foreground/58">Latest notices and reminders</p>
                </div>
                <Bell className="h-4 w-4 text-foreground/55" />
              </div>
              <div className="mt-4 space-y-3">
                {data.updates.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.title}</p>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                        {item.tag}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-foreground/65">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </section>

        <motion.section
          custom={0.32}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          variants={reveal}
          className="mt-8 grid gap-4 lg:grid-cols-3"
        >
          {[
            {
              title: "Easy results view",
              detail: "Important academic numbers show first so students do not need to search around the page.",
            },
            {
              title: "Notices in one place",
              detail: "School updates sit beside progress so students and parents can read both together.",
            },
            {
              title: "Comfortable design",
              detail: "Soft motion and clear cards make the portal feel more alive without turning into a heavy app.",
            },
          ].map((item) => (
            <Card key={item.title} className="si-card rounded-[28px] border bg-card/75 p-5 backdrop-blur">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-foreground/67">{item.detail}</p>
            </Card>
          ))}
        </motion.section>

        <motion.section
          custom={0.38}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          variants={reveal}
          className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">DAV live board</p>
                <p className="mt-1 text-xs text-foreground/58">Public school notices pulled from the official website</p>
              </div>
              <Bell className="h-4 w-4 text-foreground/55" />
            </div>
            <div className="mt-4 space-y-3">
              {davFeed.notices.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-2 text-xs text-foreground/55">{item.publishedAt}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Campus birthdays and links</p>
                <p className="mt-1 text-xs text-foreground/58">A more connected student experience beyond marks alone</p>
              </div>
              <Trophy className="h-4 w-4 text-foreground/55" />
            </div>
            <div className="mt-4 space-y-3">
              {davFeed.birthdays.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-[22px] border border-foreground/10 bg-background/45 p-4">
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-foreground/65">{item.classLabel}</p>
                  <p className="mt-1 text-xs text-foreground/55">{item.date}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              {davFeed.quickLinks.slice(0, 3).map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="rounded-[18px] border border-foreground/10 bg-background/45 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]">
                  {item.title}
                </a>
              ))}
            </div>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}
