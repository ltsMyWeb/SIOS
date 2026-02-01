import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarCheck,
  ChevronRight,
  GraduationCap,
  Layers,
  LineChart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ClassSummary = {
  id: string;
  name: string;
  students: number;
  attendance: number;
  termDelta: number;
  atRisk: number;
  trend: number[];
};

type Student = {
  id: string;
  name: string;
  classId: string;
  rollNo: number;
  attendance: number;
  overall: number;
  subjectScores: Record<string, number>;
  last7: number[];
};

const SUBJECTS = ["Math", "Science", "English", "Social", "Computer"];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatPct(v: number) {
  return `${Math.round(v)}%`;
}

function useCountUp(value: number, durationMs = 900) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = display;

    const tick = (t: number) => {
      const p = clamp((t - start) / durationMs, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs, reduce]);

  return display;
}

function generateMock() {
  const classes: ClassSummary[] = [
    {
      id: "8b",
      name: "Class 8B",
      students: 42,
      attendance: 94,
      termDelta: -3,
      atRisk: 6,
      trend: [97, 96, 95, 94, 92, 93, 94],
    },
    {
      id: "7c",
      name: "Class 7C",
      students: 39,
      attendance: 88,
      termDelta: -2,
      atRisk: 9,
      trend: [92, 91, 89, 88, 87, 88, 88],
    },
    {
      id: "10a",
      name: "Class 10A",
      students: 36,
      attendance: 96,
      termDelta: +4,
      atRisk: 2,
      trend: [91, 93, 95, 96, 96, 97, 96],
    },
    {
      id: "9d",
      name: "Class 9D",
      students: 40,
      attendance: 91,
      termDelta: +1,
      atRisk: 5,
      trend: [89, 90, 91, 90, 91, 92, 91],
    },
  ];

  const students: Student[] = [
    {
      id: "st-018",
      name: "Aarav Mehta",
      classId: "8b",
      rollNo: 18,
      attendance: 86,
      overall: 71,
      subjectScores: { Math: 58, Science: 66, English: 76, Social: 70, Computer: 83 },
      last7: [76, 74, 73, 72, 71, 71, 71],
    },
    {
      id: "st-007",
      name: "Zara Khan",
      classId: "7c",
      rollNo: 7,
      attendance: 82,
      overall: 68,
      subjectScores: { Math: 61, Science: 64, English: 73, Social: 66, Computer: 76 },
      last7: [74, 72, 71, 70, 69, 68, 68],
    },
    {
      id: "st-011",
      name: "Ishaan Roy",
      classId: "10a",
      rollNo: 11,
      attendance: 97,
      overall: 88,
      subjectScores: { Math: 91, Science: 86, English: 84, Social: 87, Computer: 92 },
      last7: [82, 83, 84, 85, 86, 87, 88],
    },
    {
      id: "st-024",
      name: "Meera Nair",
      classId: "9d",
      rollNo: 24,
      attendance: 90,
      overall: 79,
      subjectScores: { Math: 74, Science: 80, English: 83, Social: 76, Computer: 82 },
      last7: [77, 77, 78, 78, 79, 79, 79],
    },
  ];

  return { classes, students };
}

function insightsFromData(classes: ClassSummary[], students: Student[]) {
  const insights: { id: string; title: string; detail: string; tone: "info" | "warn" | "good" }[] = [];

  const eightB = classes.find((c) => c.id === "8b");
  if (eightB && eightB.trend[0] - eightB.trend[eightB.trend.length - 1] >= 3) {
    insights.push({
      id: "ins-8b-attn",
      title: "Class 8B attendance softened after mid-terms",
      detail: `7-day trend moved ${eightB.trend[0]}% → ${eightB.trend[eightB.trend.length - 1]}%. Consider a quick parent check-in + morning reminders for 2 weeks.`,
      tone: "warn",
    });
  }

  const decline = students.find((s) => s.subjectScores.Math <= 60 && s.attendance <= 88);
  if (decline) {
    insights.push({
      id: "ins-math-decline",
      title: `${decline.name} shows a consistent decline in Math`,
      detail: `Math is ${decline.subjectScores.Math}%. Pair with a 3-session micro-remedial plan and weekly 10-min exit quizzes.`,
      tone: "warn",
    });
  }

  const avgTermDelta =
    classes.reduce((acc, c) => acc + c.termDelta, 0) / Math.max(1, classes.length);
  if (avgTermDelta >= 2) {
    insights.push({
      id: "ins-overall-up",
      title: "Overall performance improved this term",
      detail: `Across tracked classes the term delta is ~${Math.round(avgTermDelta)}%. Keep what works: formative quizzes + targeted practice sets.`,
      tone: "good",
    });
  } else {
    insights.push({
      id: "ins-overall-flat",
      title: "Performance is stable, with pockets of risk",
      detail: "Focus on two levers: attendance interventions and subject-specific micro-remedials in lower quartile classes.",
      tone: "info",
    });
  }

  insights.push({
    id: "ins-admin",
    title: "Data quality looks strong",
    detail: "No missing attendance days detected in the last 7 days. Keep the rhythm: daily sync by 2:30pm.",
    tone: "good",
  });

  return insights.slice(0, 4);
}

function Sparkline({ values, tone }: { values: number[]; tone: "good" | "warn" | "info" }) {
  const w = 120;
  const h = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const color =
    tone === "good" ? "hsl(var(--accent))" : tone === "warn" ? "hsl(30 95% 58%)" : "hsl(var(--primary))";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block" aria-hidden>
      <defs>
        <linearGradient id={`g-${tone}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity={0.35} />
          <stop offset="1" stopColor={color} stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={`url(#g-${tone})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({
  title,
  value,
  suffix,
  icon,
  tone,
  sub,
  pulse,
  spark,
  onClick,
  testId,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  tone: "good" | "warn" | "info";
  sub: string;
  pulse?: boolean;
  spark?: number[];
  onClick?: () => void;
  testId: string;
}) {
  const reduce = useReducedMotion();
  const v = useCountUp(value);
  const ring =
    tone === "good"
      ? "ring-[hsl(var(--accent))]/35"
      : tone === "warn"
        ? "ring-[hsl(30_95%_58%)]/35"
        : "ring-[hsl(var(--primary))]/35";

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 10 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Card
        className={cn(
          "si-card si-noise group relative overflow-hidden rounded-2xl border bg-card/70 backdrop-blur",
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]",
          "ring-1",
          ring,
          onClick && "cursor-pointer",
        )}
        onClick={onClick}
        data-testid={testId}
      >
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[hsl(var(--primary))]/20 blur-2xl" />
          <div className="absolute -bottom-16 right-0 h-44 w-44 rounded-full bg-[hsl(var(--accent))]/15 blur-2xl" />
        </div>

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5 text-foreground/80 ring-1 ring-foreground/10">
                  {icon}
                </div>
                <p className="text-sm font-medium text-foreground/75">{title}</p>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <p className="font-serif text-4xl font-semibold tracking-tight">
                  {formatPct(v)}
                  {suffix}
                </p>
                {!reduce && pulse ? (
                  <motion.span
                    className="mb-2 inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(30_95%_58%)]"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    aria-hidden
                  />
                ) : null}
              </div>

              <p className="mt-2 text-sm text-foreground/60">{sub}</p>
            </div>

            {spark ? (
              <div className="mt-1 rounded-xl border border-foreground/10 bg-background/40 p-2">
                <Sparkline values={spark} tone={tone} />
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <Progress value={value} className="h-2" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { classes, students } = useMemo(() => generateMock(), []);

  const schoolAttendance =
    classes.reduce((acc, c) => acc + c.attendance * c.students, 0) /
    classes.reduce((acc, c) => acc + c.students, 0);

  const overallAtRisk = classes.reduce((acc, c) => acc + c.atRisk, 0);
  const avgPerformance =
    students.reduce((acc, s) => acc + s.overall, 0) / Math.max(1, students.length);

  const insights = useMemo(() => insightsFromData(classes, students), [classes, students]);

  const featured = students[0];

  return (
    <div className="min-h-screen si-gradient">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur" data-testid="badge-mode">
              <Sparkles className="h-3.5 w-3.5" />
              Demo Mode · Live insights · No cloud AI
            </div>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight md:text-5xl" data-testid="text-title">
              School Intelligence OS
              <span className="ml-2 align-top text-base font-semibold text-foreground/60">(S.I.O.S)</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base text-foreground/65" data-testid="text-subtitle">
              From data entry → to understanding → to action. A decision intelligence layer built for principals, teachers, and admins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="rounded-xl"
              data-testid="button-open-featured"
              asChild
            >
              <Link href={`/student/${featured.id}`}>
                <span className="inline-flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Open featured student
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </Button>
            <Button
              className="rounded-xl"
              data-testid="button-view-classes"
              asChild
            >
              <Link href={`/class/${classes[0].id}`}>
                <span className="inline-flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  View classes
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="School Attendance"
            value={Math.round(schoolAttendance)}
            icon={<CalendarCheck className="h-4 w-4" />}
            tone={schoolAttendance >= 92 ? "good" : "warn"}
            sub="Weighted across tracked classes"
            spark={[92, 93, 94, 94, 93, 94, Math.round(schoolAttendance)]}
            testId="card-attendance"
          />
          <MetricCard
            title="Avg Performance"
            value={Math.round(avgPerformance)}
            icon={<LineChart className="h-4 w-4" />}
            tone={avgPerformance >= 78 ? "good" : "info"}
            sub="Term-to-date overall score"
            spark={[72, 74, 75, 76, 77, 78, Math.round(avgPerformance)]}
            testId="card-performance"
          />
          <MetricCard
            title="Risk Students"
            value={overallAtRisk}
            suffix=""
            icon={<AlertTriangle className="h-4 w-4" />}
            tone={overallAtRisk > 12 ? "warn" : "info"}
            sub="Attendance/score signals"
            pulse={overallAtRisk > 10}
            spark={[10, 11, 11, 12, 12, 13, overallAtRisk]}
            testId="card-risk"
          />
          <MetricCard
            title="Data Health"
            value={96}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="good"
            sub="Completeness + freshness"
            spark={[90, 92, 93, 95, 95, 96, 96]}
            testId="card-data-health"
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="si-card si-noise overflow-hidden rounded-2xl border bg-card/70 backdrop-blur lg:col-span-2">
            <div className="flex items-center justify-between gap-3 border-b border-foreground/10 p-5">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5 text-foreground/80 ring-1 ring-foreground/10">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold" data-testid="text-insights-title">AI Insight Engine</p>
                  <p className="text-xs text-foreground/60" data-testid="text-insights-sub">Rule-based, trend-aware, demo-convincing</p>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full" data-testid="badge-insights">
                4 insights
              </Badge>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-2">
              {insights.map((ins) => {
                const toneCls =
                  ins.tone === "good"
                    ? "border-[hsl(var(--accent))]/25 bg-[hsl(var(--accent))]/8"
                    : ins.tone === "warn"
                      ? "border-[hsl(30_95%_58%)]/25 bg-[hsl(30_95%_58%)]/8"
                      : "border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/8";

                return (
                  <motion.div
                    key={ins.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <div
                      className={cn(
                        "group relative rounded-2xl border p-4 transition-all",
                        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]",
                        toneCls,
                      )}
                      data-testid={`card-insight-${ins.id}`}
                    >
                      <p className="text-sm font-semibold" data-testid={`text-insight-title-${ins.id}`}>{ins.title}</p>
                      <p className="mt-2 text-sm text-foreground/70" data-testid={`text-insight-detail-${ins.id}`}>{ins.detail}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/60">
                          <BookOpen className="h-3.5 w-3.5" />
                          Suggested next step
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/70">
                          View
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          <Card className="si-card si-noise overflow-hidden rounded-2xl border bg-card/70 backdrop-blur">
            <div className="border-b border-foreground/10 p-5">
              <p className="text-sm font-semibold" data-testid="text-actions-title">Decision Suggestions</p>
              <p className="mt-1 text-xs text-foreground/60" data-testid="text-actions-sub">AI-style recommendation cards</p>
            </div>

            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="card-suggestion-1">
                <p className="text-sm font-semibold">Increase remedial sessions for Class 7C</p>
                <p className="mt-1 text-sm text-foreground/70">Target Math + Science, 3 weeks, 2 sessions/week.</p>
              </div>
              <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="card-suggestion-2">
                <p className="text-sm font-semibold">Attendance intervention required for 3 students</p>
                <p className="mt-1 text-sm text-foreground/70">Auto-flagged: consecutive 4+ absences this month.</p>
              </div>
              <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="card-suggestion-3">
                <p className="text-sm font-semibold">Math department performance declining</p>
                <p className="mt-1 text-sm text-foreground/70">Recommend question-bank refresh + peer observation.</p>
              </div>

              <Button variant="secondary" className="w-full rounded-xl" data-testid="button-open-suggestions">
                Review all recommendations
              </Button>
            </div>
          </Card>
        </section>

        <section className="mt-6">
          <Tabs defaultValue="classes" className="w-full">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold" data-testid="text-explore-title">Explore</p>
                <p className="text-xs text-foreground/60" data-testid="text-explore-sub">Tap into classes, then drill down to students</p>
              </div>
              <TabsList className="rounded-xl bg-background/60" data-testid="tabs-explore">
                <TabsTrigger value="classes" className="rounded-lg" data-testid="tab-classes">
                  <Users className="mr-2 h-4 w-4" />
                  Classes
                </TabsTrigger>
                <TabsTrigger value="students" className="rounded-lg" data-testid="tab-students">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Students
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="classes" className="mt-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {classes.map((c) => (
                  <Link key={c.id} href={`/class/${c.id}`} data-testid={`link-class-${c.id}`}>
                    <a className="block">
                      <Card className="si-card si-noise group overflow-hidden rounded-2xl border bg-card/70 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold" data-testid={`text-class-name-${c.id}`}>{c.name}</p>
                            <p className="mt-1 text-xs text-foreground/60" data-testid={`text-class-students-${c.id}`}>{c.students} students</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "rounded-full",
                              c.termDelta >= 0 ? "bg-[hsl(var(--accent))]/12 text-foreground" : "bg-[hsl(30_95%_58%)]/12 text-foreground",
                            )}
                            data-testid={`badge-class-delta-${c.id}`}
                          >
                            {c.termDelta >= 0 ? `+${c.termDelta}%` : `${c.termDelta}%`}
                          </Badge>
                        </div>

                        <div className="mt-4 rounded-xl border border-foreground/10 bg-background/40 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-foreground/60">Attendance</p>
                            <p className="text-xs font-semibold" data-testid={`text-class-attendance-${c.id}`}>{c.attendance}%</p>
                          </div>
                          <div className="mt-2">
                            <Progress value={c.attendance} className="h-2" />
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs font-medium text-foreground/60">At-risk</p>
                            <p className="text-xs font-semibold" data-testid={`text-class-risk-${c.id}`}>{c.atRisk}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-foreground/60">
                          <span className="inline-flex items-center gap-1">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            Last 7 days
                          </span>
                          <Sparkline values={c.trend} tone={c.attendance >= 92 ? "good" : "warn"} />
                        </div>
                      </Card>
                    </a>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="students" className="mt-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {students.map((s) => (
                  <Link key={s.id} href={`/student/${s.id}`} data-testid={`link-student-${s.id}`}>
                    <a className="block">
                      <Card className="si-card si-noise group overflow-hidden rounded-2xl border bg-card/70 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold" data-testid={`text-student-name-${s.id}`}>{s.name}</p>
                          <Badge variant="secondary" className="rounded-full" data-testid={`badge-student-class-${s.id}`}>
                            {s.classId.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-foreground/60" data-testid={`text-student-roll-${s.id}`}>Roll #{s.rollNo}</p>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-foreground/10 bg-background/40 p-3">
                            <p className="text-[11px] font-medium text-foreground/60">Attendance</p>
                            <p className="mt-1 font-serif text-2xl font-semibold" data-testid={`text-student-attendance-${s.id}`}>{s.attendance}%</p>
                          </div>
                          <div className="rounded-xl border border-foreground/10 bg-background/40 p-3">
                            <p className="text-[11px] font-medium text-foreground/60">Overall</p>
                            <p className="mt-1 font-serif text-2xl font-semibold" data-testid={`text-student-overall-${s.id}`}>{s.overall}%</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-foreground/60">
                          <span className="inline-flex items-center gap-1">
                            <LineChart className="h-3.5 w-3.5" />
                            Trend
                          </span>
                          <Sparkline values={s.last7} tone={s.overall >= 78 ? "good" : "warn"} />
                        </div>
                      </Card>
                    </a>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <footer className="mt-10 flex flex-col gap-2 border-t border-foreground/10 pt-6 text-sm text-foreground/60 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-2" data-testid="text-footer-left">
            <span className="font-semibold">S.I.O.S</span>
            <span>·</span>
            <span>Decision intelligence for schools</span>
          </div>
          <div className="inline-flex items-center gap-2" data-testid="text-footer-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs font-medium">
              <Users className="h-3.5 w-3.5" />
              Tablet-friendly
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs font-medium">
              <Brain className="h-3.5 w-3.5" />
              Simulated AI
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
