import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Crown,
  Database,
  GraduationCap,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { DashboardResponse } from "@shared/schema";
import SchoolNav from "@/components/school-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
      <div className="mx-auto max-w-6xl px-4 py-28 md:px-8">
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
      <SchoolNav />
      <div className="mx-auto max-w-6xl px-4 py-28 md:px-8">
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
  const davFeed = data.davFeed;

  return (
    <div className="min-h-screen si-gradient">
      <SchoolNav />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-32">
        <header className="si-rise rounded-[34px] border border-white/55 bg-card/75 p-6 shadow-[var(--shadow-2)] backdrop-blur-sm md:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs tracking-[0.16em] uppercase">
                SIOS School Hub
              </Badge>
              <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight md:text-6xl">
                A school dashboard that feels alive as you move through it
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-foreground/68 md:text-base">
                Built for DAV Public School, East of Loni Road, Shahdara, Delhi, this space brings staff control,
                student progress, and school updates into one calm and premium workflow.
              </p>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2 xl:max-w-[360px] xl:justify-self-end">
              <Button asChild className="h-12 rounded-2xl">
                <Link href="/teacher-console">
                  <span className="inline-flex items-center gap-2">
                    Staff Access
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 rounded-2xl">
                <Link href="/principal-console">Leadership Access</Link>
              </Button>
              <Button asChild variant="secondary" className="h-12 rounded-2xl sm:col-span-2">
                <Link href="/student-portal">Student Portal</Link>
              </Button>
            </div>
          </div>
        </header>

        <RevealSection className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Students tracked", value: data.kpis.totalStudents, note: "Current live school roster", icon: Users },
            { label: "Average attendance", value: `${data.kpis.averageAttendance}%`, note: "Whole-school attendance rate", icon: CheckCircle2 },
            { label: "Average overall", value: `${data.kpis.averageOverall}%`, note: "Academic average across students", icon: TrendingUp },
            { label: "Students to review", value: data.kpis.flaggedStudents, note: "Need attendance or score follow-up", icon: ShieldCheck },
          ].map((item) => (
            <Card key={item.label} className="si-card rounded-[28px] border bg-card/75 p-5 backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground/64">{item.label}</p>
                <item.icon className="h-4 w-4 text-foreground/55" />
              </div>
              <p className="mt-4 font-serif text-4xl font-semibold">{item.value}</p>
              <p className="mt-2 text-xs text-foreground/55">{item.note}</p>
            </Card>
          ))}
        </RevealSection>

        <RevealSection className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Top class performance</p>
                <p className="mt-1 text-xs text-foreground/58">The strongest sections surface first as you scroll</p>
              </div>
              <BookOpen className="h-4 w-4 text-foreground/55" />
            </div>
            <div className="mt-5 grid gap-3">
              {topClasses.length ? topClasses.map((item) => (
                <Link key={item.id} href={`/class/${item.id}`}>
                  <Card className="rounded-[22px] border bg-background/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="mt-1 text-xs text-foreground/55">
                          {item.students} students • {item.atRisk} review cases • term {item.termDelta >= 0 ? "+" : ""}
                          {item.termDelta}%
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">{item.attendance}%</Badge>
                    </div>
                    <Progress value={item.attendance} className="mt-4 h-2" />
                  </Card>
                </Link>
              )) : <div className="rounded-[22px] border border-foreground/10 bg-background/50 p-4 text-sm text-foreground/65">Class ranking will show here once live data is available.</div>}
            </div>
          </Card>

          <div className="grid gap-4">
            <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">System status</p>
                  <p className="mt-1 text-xs text-foreground/58">Daily school operations and protected access</p>
                </div>
                <Database className="h-4 w-4 text-foreground/55" />
              </div>
              <div className="mt-4 rounded-[22px] border border-foreground/10 bg-background/50 p-4">
                <p className="font-medium">{data.backend.configured ? "School system is protected and online" : "School system setup is still finishing"}</p>
                <p className="mt-2 text-sm text-foreground/65">
                  {data.backend.configured
                    ? "Attendance, staff accounts, and student records are saving safely in the live system."
                    : "Some protected features may still be unavailable until setup is complete."}
                </p>
              </div>
            </Card>

            <Card className="si-card rounded-[30px] border bg-card/75 p-5 backdrop-blur-sm">
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
          </div>
        </RevealSection>

        <RevealSection className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="si-card rounded-[30px] border bg-card/75 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Live from DAV campus</p>
                <p className="mt-1 text-xs text-foreground/58">Public notices and updates pulled from the official school website</p>
              </div>
              <CalendarDays className="h-4 w-4 text-foreground/55" />
            </div>
            <div className="mt-4 space-y-3">
              {davFeed.notices.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-[22px] border border-foreground/10 bg-background/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.title}</p>
                    <span className="text-xs text-foreground/55">{item.publishedAt}</span>
                  </div>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-primary underline-offset-4 hover:underline">
                      Open notice
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="si-card rounded-[30px] border bg-card/75 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Birthdays and quick access</p>
                <p className="mt-1 text-xs text-foreground/58">A lighter public-school layer that most admin sites do not show well</p>
              </div>
              <Sparkles className="h-4 w-4 text-foreground/55" />
            </div>
            <div className="mt-4 space-y-3">
              {davFeed.birthdays.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-[22px] border border-foreground/10 bg-background/50 p-4">
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-foreground/65">{item.classLabel}</p>
                  <p className="mt-1 text-xs text-foreground/55">{item.date}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              {davFeed.quickLinks.slice(0, 3).map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="rounded-[18px] border border-foreground/10 bg-background/50 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]">
                  {item.title}
                </a>
              ))}
            </div>
          </Card>
        </RevealSection>

        <RevealSection className="mt-8 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="si-card rounded-[30px] border bg-card/75 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Why the school stands out</p>
                <p className="mt-1 text-xs text-foreground/58">A scroll section made to feel more premium and human</p>
              </div>
              <Sparkles className="h-4 w-4 text-foreground/55" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { title: "Calm daily flow", detail: "The dashboards are arranged for assembly time, attendance time, review time, and parent follow-up time." },
                { title: "Strict class control", detail: "Teachers only touch the classes assigned to them, which keeps data cleaner and safer." },
                { title: "Student-facing clarity", detail: "The portal lets students and families see marks, notices, and attendance without confusion." },
              ].map((item) => (
                <div key={item.title} className="rounded-[22px] border border-foreground/10 bg-background/50 p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-2 text-sm text-foreground/65">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="si-card rounded-[30px] border bg-card/75 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Students to review</p>
                <p className="mt-1 text-xs text-foreground/58">Quick links for follow-up</p>
              </div>
              <GraduationCap className="h-4 w-4 text-foreground/55" />
            </div>
            <div className="mt-4 space-y-3">
              {reviewStudents.length ? reviewStudents.map((student) => (
                <Link key={student.id} href={`/student/${student.id}`}>
                  <div className="rounded-[22px] border border-foreground/10 bg-background/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{student.name}</p>
                      <span className="text-xs text-foreground/55">Roll #{student.rollNo}</span>
                    </div>
                    <p className="mt-1 text-xs text-foreground/55">{student.classId.toUpperCase()} • Attendance {student.attendance}% • Overall {student.overall}%</p>
                  </div>
                </Link>
              )) : <div className="rounded-[22px] border border-foreground/10 bg-background/50 p-4 text-sm text-foreground/65">No urgent student follow-up is showing right now.</div>}
            </div>
          </Card>
        </RevealSection>

        <RevealSection className="mt-8 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="si-card rounded-[32px] border bg-card/75 p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.16em]">School spotlight</Badge>
                <h2 className="mt-4 font-serif text-3xl font-semibold">DAV Public School, East of Loni Road, Shahdara, Delhi</h2>
                <p className="mt-3 max-w-2xl text-sm text-foreground/67">This section promotes the school itself so the website feels like an identity piece too, not just an admin panel.</p>
              </div>
              <div className="rounded-full border border-primary/15 bg-primary/10 p-4 text-primary">
                <Landmark className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-foreground/10 bg-background/45 p-5">
                <p className="text-sm font-semibold">School promise</p>
                <p className="mt-3 text-sm leading-6 text-foreground/68">Strong discipline, clear communication, caring staff support, and one place where academic progress is easy to understand.</p>
              </div>
              <div className="rounded-[24px] border border-foreground/10 bg-background/45 p-5">
                <p className="text-sm font-semibold">Presentation value</p>
                <p className="mt-3 text-sm leading-6 text-foreground/68">A sticky navigation bar, reveal-on-scroll sections, and a deeper landing page make the project feel more dynamic and memorable.</p>
              </div>
            </div>
          </Card>

          <Card className="si-card rounded-[32px] border bg-card/75 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-foreground/55" />
              <p className="text-sm font-semibold">School address and access</p>
            </div>
            <div className="mt-4 rounded-[24px] border border-foreground/10 bg-background/45 p-5">
              <p className="font-medium">DAV Public School</p>
              <p className="mt-2 text-sm text-foreground/68">East of Loni Road, Shahdara, Delhi</p>
              <p className="mt-4 text-sm text-foreground/68">Designed to guide teachers, students, and school leadership from one calm and organized dashboard.</p>
            </div>
            <div className="mt-4 grid gap-3">
              <Button asChild className="h-12 justify-between rounded-[18px]"><Link href="/teacher-console">Staff Access <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="secondary" className="h-12 justify-between rounded-[18px]"><Link href="/principal-console">Leadership Access <Crown className="h-4 w-4" /></Link></Button>
              <Button asChild variant="secondary" className="h-12 justify-between rounded-[18px]"><Link href="/student-portal">Student Portal <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
          </Card>
        </RevealSection>

        <RevealSection className="mt-10 rounded-[32px] border border-white/45 bg-card/70 p-6 backdrop-blur-sm">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">School-first digital system</p>
              <h3 className="mt-3 font-serif text-3xl font-semibold">Built to make staff, students, and visitors say “wow” without making the app heavy</h3>
            </div>
            <p className="text-sm leading-6 text-foreground/67">The top navigation stays visible while you scroll, the bottom action area remains for quick access, and the larger page length gives the website a more complete public presence.</p>
          </div>
        </RevealSection>
      </div>
    </div>
  );
}
