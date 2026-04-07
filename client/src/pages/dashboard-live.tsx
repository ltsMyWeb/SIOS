import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Database,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import type { DashboardResponse } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function LoadingState() {
  return (
    <div className="min-h-screen si-gradient">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <Card className="si-card rounded-[28px] border bg-card/80 p-8 backdrop-blur">
          <p className="font-serif text-3xl font-semibold">Loading school dashboard...</p>
          <p className="mt-2 text-sm text-foreground/65">Pulling attendance, class performance, and school updates.</p>
        </Card>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen si-gradient">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <Card className="si-card rounded-[28px] border bg-card/80 p-8 backdrop-blur">
          <p className="font-serif text-3xl font-semibold">Dashboard unavailable</p>
          <p className="mt-2 text-sm text-foreground/65">{message}</p>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardLive() {
  const { data, isLoading, error } = useQuery<DashboardResponse>({ queryKey: ["/api/dashboard"] });

  if (isLoading) return <LoadingState />;
  if (!data) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;

  const topClasses = [...data.classes].sort((a, b) => b.attendance - a.attendance).slice(0, 5);
  const reviewStudents = data.students
    .filter((student) => student.attendance < 88 || student.overall < 70 || student.subjectScores.Math < 65)
    .slice(0, 4);

  return (
    <div className="min-h-screen si-gradient">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
        <header className="si-rise rounded-[32px] border border-white/55 bg-card/75 p-6 shadow-[var(--shadow-2)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs tracking-[0.16em] uppercase">
                SIOS School Hub
              </Badge>
              <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight md:text-5xl">Simple school management for daily use</h1>
              <p className="mt-3 text-sm text-foreground/68 md:text-base">
                Track attendance, class progress, staff access, and student updates from one clean school dashboard.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[420px]">
              <Button asChild className="h-12 rounded-2xl">
                <Link href="/teacher-console">
                  <span className="inline-flex items-center gap-2">
                    Teacher Console
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 rounded-2xl">
                <Link href="/principal-console">Principal Console</Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 rounded-2xl">
                <Link href="/student-portal">Student Portal</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Students tracked", value: data.kpis.totalStudents, note: "Current live school roster", icon: Users },
            { label: "Average attendance", value: `${data.kpis.averageAttendance}%`, note: "Whole-school attendance rate", icon: CheckCircle2 },
            { label: "Average overall", value: `${data.kpis.averageOverall}%`, note: "Academic average across students", icon: TrendingUp },
            { label: "Students to review", value: data.kpis.flaggedStudents, note: "Need attendance or score follow-up", icon: ShieldCheck },
          ].map((item) => (
            <Card key={item.label} className="si-card rounded-[28px] border bg-card/75 p-5 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground/64">{item.label}</p>
                <item.icon className="h-4 w-4 text-foreground/55" />
              </div>
              <p className="mt-4 font-serif text-4xl font-semibold">{item.value}</p>
              <p className="mt-2 text-xs text-foreground/55">{item.note}</p>
            </Card>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="si-card si-noise rounded-[30px] border bg-card/75 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Top class performance</p>
                <p className="mt-1 text-xs text-foreground/58">Only the best-performing sections are shown here</p>
              </div>
              <BookOpen className="h-4 w-4 text-foreground/55" />
            </div>
            <div className="mt-5 grid gap-3">
              {topClasses.length ? (
                topClasses.map((item) => (
                  <Link key={item.id} href={`/class/${item.id}`}>
                    <Card className="rounded-[22px] border bg-background/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-xs text-foreground/55">
                            {item.students} students • {item.atRisk} review cases • term {item.termDelta >= 0 ? "+" : ""}{item.termDelta}%
                          </p>
                        </div>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">{item.attendance}%</Badge>
                      </div>
                      <Progress value={item.attendance} className="mt-4 h-2" />
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="rounded-[22px] border border-foreground/10 bg-background/50 p-4 text-sm text-foreground/65">
                  Class ranking will show here once live data is available.
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-4">
            <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Backend status</p>
                  <p className="mt-1 text-xs text-foreground/58">Secure storage and login state</p>
                </div>
                <Database className="h-4 w-4 text-foreground/55" />
              </div>
              <div className="mt-4 rounded-[22px] border border-foreground/10 bg-background/50 p-4">
                <p className="font-medium">{data.backend.configured ? "Firebase connected" : "Backend still needs setup"}</p>
                <p className="mt-2 text-sm text-foreground/65">
                  {data.backend.configured
                    ? "Teacher accounts and student changes are saving to the live backend."
                    : data.backend.detail ?? "Add Firebase credentials in .env to enable live storage."}
                </p>
              </div>
            </Card>

            <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">School notes</p>
                  <p className="mt-1 text-xs text-foreground/58">Important updates and quick action points</p>
                </div>
                <Bell className="h-4 w-4 text-foreground/55" />
              </div>
              <div className="mt-4 space-y-3">
                {[...data.updates.slice(0, 2), ...data.insights.slice(0, 1)].map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-foreground/10 bg-background/50 p-4">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-2 text-sm text-foreground/65">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Students to review</p>
                  <p className="mt-1 text-xs text-foreground/58">Quick links for follow-up</p>
                </div>
                <GraduationCap className="h-4 w-4 text-foreground/55" />
              </div>
              <div className="mt-4 space-y-3">
                {reviewStudents.length ? (
                  reviewStudents.map((student) => (
                    <Link key={student.id} href={`/student/${student.id}`}>
                      <div className="rounded-[22px] border border-foreground/10 bg-background/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{student.name}</p>
                          <span className="text-xs text-foreground/55">Roll #{student.rollNo}</span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/55">
                          {student.classId.toUpperCase()} • Attendance {student.attendance}% • Overall {student.overall}%
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-foreground/10 bg-background/50 p-4 text-sm text-foreground/65">
                    No urgent student follow-up is showing right now.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Why this is easy to use</p>
                <p className="mt-1 text-xs text-foreground/58">Simple school-first workflow for daily operations</p>
              </div>
              <CalendarDays className="h-4 w-4 text-foreground/55" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "Principal creates staff accounts and assigns classes from a dropdown only.",
                "Teachers can only edit the students in their own classes.",
                "Students can check their own results and school notices in one portal.",
              ].map((line) => (
                <div key={line} className="rounded-[22px] border border-foreground/10 bg-background/50 p-4 text-sm text-foreground/68">
                  {line}
                </div>
              ))}
            </div>
          </Card>
          <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur">
            <p className="text-sm font-semibold">Quick access</p>
            <div className="mt-4 grid gap-3">
              <Button asChild className="h-12 justify-between rounded-[18px]">
                <Link href="/teacher-console">Teacher Console <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 justify-between rounded-[18px]">
                <Link href="/principal-console">Principal Console <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 justify-between rounded-[18px]">
                <Link href="/student-portal">Student Portal <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
