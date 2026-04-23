import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  BookCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  Landmark,
  LineChart,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { DashboardResponse } from "@shared/schema";
import SchoolNav from "@/components/school-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function RevealSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={[
        className,
        "transition-all duration-500 ease-out motion-reduce:transform-none motion-reduce:opacity-100",
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen si-gradient">
      <SchoolNav />
      <div className="mx-auto max-w-7xl px-4 py-28 md:px-8">
        <Card className="si-panel rounded-[32px] p-8 backdrop-blur-xl">
          <p className="font-serif text-3xl font-semibold">Loading academic dashboard...</p>
          <p className="mt-2 text-sm text-foreground/65">Pulling attendance, class performance, and school notices.</p>
        </Card>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen si-gradient">
      <SchoolNav />
      <div className="mx-auto max-w-7xl px-4 py-28 md:px-8">
        <Card className="si-panel rounded-[32px] p-8 backdrop-blur-xl">
          <p className="font-serif text-3xl font-semibold">Dashboard unavailable</p>
          <p className="mt-2 text-sm text-foreground/65">{message}</p>
        </Card>
      </div>
    </div>
  );
}

function getClassTone(attendance: number, delta: number) {
  if (attendance >= 93 && delta >= 0) {
    return {
      card: "border-emerald-200 bg-[linear-gradient(180deg,rgba(240,253,250,0.95),rgba(255,255,255,0.98))]",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
      fill: "from-emerald-400 to-teal-500",
    };
  }

  if (attendance < 88 || delta < 0) {
    return {
      card: "border-orange-200 bg-[linear-gradient(180deg,rgba(255,247,237,0.95),rgba(255,255,255,0.98))]",
      badge: "border-orange-200 bg-orange-50 text-orange-800",
      fill: "from-orange-300 to-amber-500",
    };
  }

  return {
    card: "border-primary/15 bg-[linear-gradient(180deg,rgba(242,250,250,0.95),rgba(255,255,255,0.98))]",
    badge: "border-primary/15 bg-cyan-50 text-cyan-800",
    fill: "from-cyan-400 to-indigo-500",
  };
}

function TrendStrip({ values, fill }: { values: number[]; fill: string }) {
  return (
    <div className="flex items-end gap-2">
      {values.map((value, index) => (
        <div key={`${index}-${value}`} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-16 w-full items-end rounded-[14px] border border-foreground/8 bg-background/85 p-1.5">
            <div
              className={`w-full rounded-[10px] bg-gradient-to-t ${fill}`}
              style={{ height: `${Math.max(18, value * 0.6)}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-foreground/45">{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

function studentFlagReason(student: DashboardResponse["students"][number]) {
  if (student.attendance < 88) return `Attendance ${student.attendance}% requires follow-up`;
  if (student.overall < 70) return `Overall performance is ${student.overall}%`;
  return `Math performance is ${student.subjectScores.Math}%`;
}

export default function DashboardLive() {
  const { data, isLoading, error } = useQuery<DashboardResponse>({ queryKey: ["/api/dashboard"] });

  if (isLoading) return <LoadingState />;
  if (!data) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;

  const topClasses = [...data.classes].sort((a, b) => b.attendance - a.attendance).slice(0, 5);
  const reviewStudents = data.students
    .filter((student) => student.attendance < 88 || student.overall < 70 || student.subjectScores.Math < 65)
    .slice(0, 5);
  const davFeed = data.davFeed;

  return (
    <div className="min-h-screen si-gradient">
      <SchoolNav />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-8 md:pt-32">
        <header className="si-panel si-orbit si-grid rounded-[40px] p-6 backdrop-blur-xl md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <div>
              <Badge variant="secondary" className="rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em]">
                Academic command center
              </Badge>
              <h1 className="mt-5 max-w-4xl font-serif text-4xl font-semibold tracking-tight md:text-6xl">
                One disciplined view of attendance, class progress, and school operations
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground/68 md:text-base">
                Built for DAV Public School, East of Loni Road, Shahdara, Delhi, this dashboard keeps teaching staff, leadership, and students inside one coherent academic system.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-12 rounded-2xl">
                <Link href="/teacher-console">
                  <span className="inline-flex items-center gap-2">
                    Staff workspace
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 rounded-2xl">
                <Link href="/principal-console">Leadership console</Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 rounded-2xl sm:col-span-2">
                <Link href="/student-portal">Student portal</Link>
              </Button>
            </div>
          </div>
        </header>

        <RevealSection className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Students tracked", value: data.kpis.totalStudents, note: "Current active student records", icon: Users },
            { label: "Average attendance", value: `${data.kpis.averageAttendance}%`, note: "Whole-school daily attendance", icon: CheckCircle2 },
            { label: "Average overall", value: `${data.kpis.averageOverall}%`, note: "Academic average across records", icon: LineChart },
            { label: "Review queue", value: data.kpis.flaggedStudents, note: "Students below operational target", icon: TriangleAlert },
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
        </RevealSection>

        <RevealSection className="mt-8 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
            <div className="si-divider pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Class performance board</p>
                  <p className="mt-1 text-xs text-foreground/58">Attendance-led ranking across all visible sections.</p>
                </div>
                <BookOpen className="h-4 w-4 text-foreground/45" />
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              {topClasses.length ? (
                topClasses.map((item) => (
                  <Link key={item.id} href={`/class/${item.id}`}>
                    <div
                      className={`rounded-[24px] border p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)] ${getClassTone(item.attendance, item.termDelta).card}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">{item.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-foreground/42">
                            {item.students} students | {item.atRisk} review cases
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getClassTone(item.attendance, item.termDelta).badge}`}>
                          Attendance {item.attendance}%
                        </span>
                      </div>
                      <div className="mt-4">
                        <TrendStrip values={item.trend} fill={getClassTone(item.attendance, item.termDelta).fill} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/58">
                        <span className="rounded-full border border-foreground/10 bg-card/90 px-3 py-1">
                          Term delta {item.termDelta >= 0 ? `+${item.termDelta}` : item.termDelta}%
                        </span>
                        <span className="rounded-full border border-foreground/10 bg-card/90 px-3 py-1">
                          Grade {item.grade} section {item.section}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-foreground/15 bg-background/55 p-6 text-sm text-foreground/58">
                  Class ranking will appear once academic data is available.
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
              <div className="si-divider pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">System readiness</p>
                    <p className="mt-1 text-xs text-foreground/58">Storage and protected workflows status.</p>
                  </div>
                  <Database className="h-4 w-4 text-foreground/45" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-[24px] border border-foreground/10 bg-background/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {data.backend.configured ? "Live academic data is connected" : "Live data setup is still incomplete"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground/68">
                        {data.backend.configured
                          ? "Attendance, staff access, and student records are currently backed by the live system."
                          : data.backend.detail ?? "The dashboard is running with limited fallback data."}
                      </p>
                    </div>
                    <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                  </div>
                </div>

                {data.insights.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-[20px] border border-foreground/10 bg-background/60 p-4">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-foreground/68">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
              <div className="si-divider pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Students needing review</p>
                    <p className="mt-1 text-xs text-foreground/58">Priority queue generated from attendance and marks.</p>
                  </div>
                  <Clock3 className="h-4 w-4 text-foreground/45" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {reviewStudents.length ? (
                  reviewStudents.map((student) => (
                    <Link key={student.id} href={`/student/${student.id}`}>
                      <div className="rounded-[22px] border border-foreground/10 bg-background/60 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-foreground/42">
                              {student.classId.toUpperCase()} | Roll #{student.rollNo}
                            </p>
                          </div>
                          <span className="rounded-full border border-foreground/10 bg-card px-3 py-1 text-xs font-semibold">
                            {student.overall}%
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-foreground/68">{studentFlagReason(student)}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-foreground/15 bg-background/55 p-5 text-sm text-foreground/58">
                    No urgent review cases are showing right now.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </RevealSection>

        <RevealSection className="mt-8 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
            <div className="si-divider pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">School operations brief</p>
                  <p className="mt-1 text-xs text-foreground/58">Current academic and attendance notices for internal review.</p>
                </div>
                <Bell className="h-4 w-4 text-foreground/45" />
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {data.updates.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-foreground/10 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{item.title}</p>
                    <span className="rounded-full border border-foreground/10 bg-card px-3 py-1 text-xs font-semibold">
                      {item.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">{item.detail}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-foreground/42">{item.publishedAt}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="si-panel rounded-[32px] p-5 backdrop-blur-xl">
            <div className="si-divider pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Official school notices</p>
                  <p className="mt-1 text-xs text-foreground/58">Public notices and direct access links from the school site.</p>
                </div>
                <Landmark className="h-4 w-4 text-foreground/45" />
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {davFeed.notices.slice(0, 4).map((item) => (
                <a
                  key={item.id}
                  href={item.url ?? davFeed.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[22px] border border-foreground/10 bg-background/60 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{item.title}</p>
                    <span className="text-xs text-foreground/55">{item.publishedAt}</span>
                  </div>
                </a>
              ))}
              <div className="grid gap-3 md:grid-cols-3">
                {davFeed.quickLinks.slice(0, 3).map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[18px] border border-foreground/10 bg-card px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]"
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
          </Card>
        </RevealSection>

        <RevealSection className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="si-panel rounded-[32px] p-6 backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="secondary" className="rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em]">
                  School profile
                </Badge>
                <h2 className="mt-4 font-serif text-3xl font-semibold">DAV Public School, East of Loni Road, Shahdara, Delhi</h2>
              </div>
              <MapPin className="mt-2 h-5 w-5 text-foreground/45" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-foreground/10 bg-background/60 p-5">
                <p className="text-sm font-semibold">Academic focus</p>
                <p className="mt-3 text-sm leading-7 text-foreground/68">
                  The dashboard is organized to support attendance review, class-level performance checks, student follow-up, and staff access in one sequence.
                </p>
              </div>
              <div className="rounded-[24px] border border-foreground/10 bg-background/60 p-5">
                <p className="text-sm font-semibold">Operational clarity</p>
                <p className="mt-3 text-sm leading-7 text-foreground/68">
                  Staff and leadership routes are separated cleanly so teachers work inside assigned sections while the wider school view remains available to leadership.
                </p>
              </div>
            </div>
          </Card>

          <Card className="si-panel rounded-[32px] p-6 backdrop-blur-xl">
            <div className="si-divider pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Quick access</p>
                  <p className="mt-1 text-xs text-foreground/58">Primary routes for school users.</p>
                </div>
                <BookCheck className="h-4 w-4 text-foreground/45" />
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <Button asChild className="h-12 justify-between rounded-[18px]">
                <Link href="/teacher-console">
                  <span className="inline-flex items-center gap-2">
                    Teacher workspace
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 justify-between rounded-[18px]">
                <Link href="/principal-console">
                  <span className="inline-flex items-center gap-2">
                    Leadership console
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 justify-between rounded-[18px]">
                <Link href="/student-portal">
                  <span className="inline-flex items-center gap-2">
                    Student portal
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </div>
          </Card>
        </RevealSection>
      </div>
    </div>
  );
}
