import { useMemo } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarCheck,
  ChevronRight,
  LineChart,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

function Sparkline({ values, tone }: { values: number[]; tone: "good" | "warn" | "info" }) {
  const w = 140;
  const h = 44;
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
        <linearGradient id={`g2-${tone}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity={0.25} />
          <stop offset="1" stopColor={color} stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={`url(#g2-${tone})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ClassView() {
  const reduce = useReducedMotion();
  const [, params] = useRoute("/class/:classId");
  const [, setLocation] = useLocation();
  const classId = params?.classId ?? "8b";

  const { classes, students } = useMemo(() => generateMock(), []);
  const cls = classes.find((c) => c.id === classId) ?? classes[0];
  const classStudents = students.filter((s) => s.classId === cls.id);

  const best = [...classStudents].sort((a, b) => b.overall - a.overall)[0];
  const worst = [...classStudents].sort((a, b) => a.overall - b.overall)[0];

  const deptMathAvg =
    classStudents.reduce((acc, s) => acc + s.subjectScores.Math, 0) / Math.max(1, classStudents.length);

  const highlightTone = cls.attendance >= 92 ? "good" : cls.attendance <= 88 ? "warn" : "info";

  return (
    <div className="min-h-screen si-gradient">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                className="rounded-xl"
                data-testid="button-back-dashboard"
                asChild
              >
                <Link href="/dashboard">
                  <span className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Dashboard
                  </span>
                </Link>
              </Button>

              <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur" data-testid="badge-class-view">
                <Users className="h-3.5 w-3.5" />
                Class view
              </div>
            </div>

            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight" data-testid="text-class-title">
              {cls.name}
            </h1>
            <p className="mt-2 text-sm text-foreground/65" data-testid="text-class-sub">
              Side-by-side insights and auto-highlights for best & worst performers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="rounded-xl"
              data-testid="button-open-best"
              onClick={() => best && setLocation(`/student/${best.id}`)}
            >
              <span className="inline-flex items-center gap-2">
                <Award className="h-4 w-4" />
                Open best performer
                <ChevronRight className="h-4 w-4" />
              </span>
            </Button>
            <Button
              variant="secondary"
              className="rounded-xl"
              data-testid="button-open-risk"
              onClick={() => worst && setLocation(`/student/${worst.id}`)}
            >
              <span className="inline-flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Open most at-risk
                <ChevronRight className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 10 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="lg:col-span-2"
          >
            <Card className="si-card si-noise overflow-hidden rounded-2xl border bg-card/70 backdrop-blur">
              <div className="flex items-center justify-between gap-3 border-b border-foreground/10 p-5">
                <div>
                  <p className="text-sm font-semibold" data-testid="text-class-overview-title">Overview</p>
                  <p className="mt-1 text-xs text-foreground/60" data-testid="text-class-overview-sub">Attendance, risk, and trend signals</p>
                </div>
                <Badge variant="secondary" className="rounded-full" data-testid="badge-class-students">
                  {cls.students} students
                </Badge>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-3">
                <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="panel-class-attendance">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground/60">Attendance</p>
                    <CalendarCheck className="h-4 w-4 text-foreground/60" />
                  </div>
                  <p className="mt-2 font-serif text-3xl font-semibold" data-testid="text-class-attendance">{cls.attendance}%</p>
                  <div className="mt-3">
                    <Progress value={cls.attendance} className="h-2" />
                  </div>
                  <p className="mt-2 text-xs text-foreground/60">7-day stability score: {cls.attendance >= 92 ? "High" : "Medium"}</p>
                </div>

                <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="panel-class-risk">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground/60">At-risk</p>
                    <ShieldAlert className="h-4 w-4 text-foreground/60" />
                  </div>
                  <p className="mt-2 font-serif text-3xl font-semibold" data-testid="text-class-risk">{cls.atRisk}</p>
                  <p className="mt-2 text-xs text-foreground/60">Signals: attendance dips + subject declines</p>
                  <div className="mt-3 rounded-xl border border-foreground/10 bg-background/30 p-3 text-xs text-foreground/70">
                    Suggested: parent outreach + micro-remedials
                  </div>
                </div>

                <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="panel-class-trend">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground/60">Trend</p>
                    <LineChart className="h-4 w-4 text-foreground/60" />
                  </div>
                  <div className="mt-2">
                    <Sparkline values={cls.trend} tone={highlightTone} />
                  </div>
                  <p className="mt-2 text-xs text-foreground/60">Term delta: {cls.termDelta >= 0 ? `+${cls.termDelta}%` : `${cls.termDelta}%`}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 10 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Card className="si-card si-noise overflow-hidden rounded-2xl border bg-card/70 backdrop-blur">
              <div className="border-b border-foreground/10 p-5">
                <p className="text-sm font-semibold" data-testid="text-class-compare-title">Auto Highlights</p>
                <p className="mt-1 text-xs text-foreground/60" data-testid="text-class-compare-sub">
                  Best & worst performers detected automatically
                </p>
              </div>

              <div className="space-y-3 p-5">
                {[best, worst].map((s, idx) => {
                  const isBest = idx === 0;
                  const tone = isBest ? "good" : "warn";

                  const toneCls =
                    tone === "good"
                      ? "border-[hsl(var(--accent))]/25 bg-[hsl(var(--accent))]/8"
                      : "border-[hsl(30_95%_58%)]/25 bg-[hsl(30_95%_58%)]/8";

                  return (
                    <button
                      key={s?.id ?? idx}
                      type="button"
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left transition-all",
                        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]",
                        toneCls,
                      )}
                      onClick={() => s && setLocation(`/student/${s.id}`)}
                      data-testid={isBest ? "button-open-best-card" : "button-open-worst-card"}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" data-testid={isBest ? "text-best-name" : "text-worst-name"}>
                          {isBest ? "Best performer" : "Most at-risk"}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/70">
                          Open
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <p className="mt-2 text-base font-semibold" data-testid={isBest ? "text-best-student" : "text-worst-student"}>
                        {s?.name}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-foreground/70">
                        <div className="rounded-xl border border-foreground/10 bg-background/30 p-2">
                          Attendance: <span className="font-semibold">{s?.attendance}%</span>
                        </div>
                        <div className="rounded-xl border border-foreground/10 bg-background/30 p-2">
                          Overall: <span className="font-semibold">{s?.overall}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="panel-dept-math">
                  <p className="text-sm font-semibold">Math checkpoint</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    Class avg: <span className="font-semibold">{Math.round(deptMathAvg)}%</span>
                    <span className="ml-2 text-xs text-foreground/60">(focus on lower quartile)</span>
                  </p>
                </div>

                <Button variant="secondary" className="w-full rounded-xl" data-testid="button-back-explore" asChild>
                  <Link href="/dashboard">
                    <span className="inline-flex items-center gap-2">
                      Explore more
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </section>

        <section className="mt-6">
          <Card className="si-card si-noise overflow-hidden rounded-2xl border bg-card/70 backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-foreground/10 p-5">
              <div>
                <p className="text-sm font-semibold" data-testid="text-students-title">Students</p>
                <p className="mt-1 text-xs text-foreground/60" data-testid="text-students-sub">Tap a student to open their profile</p>
              </div>
              <Badge variant="secondary" className="rounded-full" data-testid="badge-students-count">
                {classStudents.length} listed
              </Badge>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-4">
              {classStudents.map((s) => (
                <Link key={s.id} href={`/student/${s.id}`} data-testid={`link-student-${s.id}`}>
                  <a className="block">
                    <Card className="si-card si-noise group overflow-hidden rounded-2xl border bg-card/70 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" data-testid={`text-student-name-${s.id}`}>{s.name}</p>
                        <Badge variant="secondary" className="rounded-full" data-testid={`badge-student-roll-${s.id}`}>
                          #{s.rollNo}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-foreground/60" data-testid={`text-student-class-${s.id}`}>{s.classId.toUpperCase()}</p>

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

                      <div className="mt-3 rounded-xl border border-foreground/10 bg-background/40 p-3">
                        <p className="text-xs font-medium text-foreground/60">Quick signal</p>
                        <p className="mt-1 text-xs text-foreground/70">
                          {s.attendance < 85 ? "Attendance risk detected" : "Attendance stable"} · {s.subjectScores.Math < 65 ? "Math support" : "Math healthy"}
                        </p>
                      </div>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
