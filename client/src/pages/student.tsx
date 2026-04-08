import { useMemo } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  CalendarCheck,
  ChevronRight,
  LineChart,
  NotebookPen,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

  return { students };
}

function scoreTone(score: number) {
  if (score >= 80) return "good" as const;
  if (score >= 65) return "info" as const;
  return "warn" as const;
}

function toneClasses(tone: "good" | "warn" | "info") {
  if (tone === "good") return "border-[hsl(var(--accent))]/25 bg-[hsl(var(--accent))]/8";
  if (tone === "warn") return "border-[hsl(30_95%_58%)]/25 bg-[hsl(30_95%_58%)]/8";
  return "border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/8";
}

function HeatCell({ label, value }: { label: string; value: number }) {
  const tone = scoreTone(value);
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]",
        toneClasses(tone),
      )}
      data-testid={`cell-subject-${label.toLowerCase()}`}
    >
      <p className="text-xs font-medium text-foreground/65" data-testid={`text-subject-${label.toLowerCase()}`}>{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold" data-testid={`text-score-${label.toLowerCase()}`}>{value}%</p>
      <div className="mt-3">
        <Progress value={value} className="h-2" />
      </div>
      <p className="mt-2 text-xs text-foreground/60" data-testid={`text-note-${label.toLowerCase()}`}>
        {tone === "good" ? "Strong" : tone === "info" ? "Stable" : "Needs support"}
      </p>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 220;
  const h = 56;
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

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block" aria-hidden>
      <defs>
        <linearGradient id="g-st" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
          <stop offset="1" stopColor="hsl(var(--accent))" stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke="url(#g-st)"
        strokeWidth={2.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StudentView() {
  const reduce = useReducedMotion();
  const [, params] = useRoute("/student/:studentId");
  const [, setLocation] = useLocation();
  const studentId = params?.studentId ?? "st-018";

  const { students } = useMemo(() => generateMock(), []);
  const s = students.find((x) => x.id === studentId) ?? students[0];

  const suggestions = useMemo(() => {
    const recs: { id: string; title: string; detail: string; tone: "info" | "warn" | "good" }[] = [];

    if (s.attendance < 88) {
      recs.push({
        id: "attn",
        title: "Attendance intervention recommended",
        detail: "Set a 10-day check-in cadence + notify guardians for consecutive absences.",
        tone: "warn",
      });
    } else {
      recs.push({
        id: "attn",
        title: "Attendance is stable",
        detail: "Keep reinforcement: monthly recognition + consistent reminders.",
        tone: "good",
      });
    }

    if (s.subjectScores.Math < 65) {
      recs.push({
        id: "math",
        title: "Math micro-remedial plan",
        detail: "3 sessions/week for 2 weeks. Focus: fractions + word problems. Use 10-min exit quizzes.",
        tone: "warn",
      });
    } else {
      recs.push({
        id: "math",
        title: "Math is on track",
        detail: "Introduce stretch problems to keep momentum.",
        tone: "good",
      });
    }

    recs.push({
      id: "feedback",
      title: "Student feedback loop",
      detail: "Use a weekly 2-minute reflection: confidence, effort, and blockers.",
      tone: "info",
    });

    return recs;
  }, [s.attendance, s.subjectScores.Math]);

  const classRoute = `/class/${s.classId}`;

  return (
    <div className="min-h-screen si-gradient">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                className="rounded-xl"
                data-testid="button-back-class"
                asChild
              >
                <Link href={classRoute}>
                  <span className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to {s.classId.toUpperCase()}
                  </span>
                </Link>
              </Button>

              <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur" data-testid="badge-student-view">
                <Sparkles className="h-3.5 w-3.5" />
                Student profile
              </div>
            </div>

            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight" data-testid="text-student-title">
              {s.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground/65">
              <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs font-medium" data-testid="badge-student-meta">
                Roll #{s.rollNo}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs font-medium transition-all hover:bg-background/80"
                onClick={() => setLocation(classRoute)}
                data-testid="button-open-class"
              >
                Class {s.classId.toUpperCase()}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button className="rounded-xl" data-testid="button-assign-plan">
              <span className="inline-flex items-center gap-2">
                <Target className="h-4 w-4" />
                Assign support plan
              </span>
            </Button>
            <Button variant="secondary" className="rounded-xl" data-testid="button-add-note">
              <span className="inline-flex items-center gap-2">
                <NotebookPen className="h-4 w-4" />
                Add note
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
                  <p className="text-sm font-semibold" data-testid="text-student-overview-title">Overview</p>
                  <p className="mt-1 text-xs text-foreground/60" data-testid="text-student-overview-sub">Attendance + performance, animated storytelling</p>
                </div>
                <Badge variant="secondary" className="rounded-full" data-testid="badge-student-overall">
                  Overall {s.overall}%
                </Badge>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-2">
                <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="panel-student-attendance">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground/60">Attendance</p>
                    <CalendarCheck className="h-4 w-4 text-foreground/60" />
                  </div>
                  <p className="mt-2 font-serif text-3xl font-semibold" data-testid="text-student-attendance">{s.attendance}%</p>
                  <div className="mt-3">
                    <Progress value={s.attendance} className="h-2" />
                  </div>
                  <p className="mt-2 text-xs text-foreground/60">
                    Signal: {s.attendance < 88 ? "attendance risk" : "stable"}
                  </p>
                </div>

                <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="panel-student-trend">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground/60">Last 7 assessments</p>
                    <LineChart className="h-4 w-4 text-foreground/60" />
                  </div>
                  <div className="mt-2">
                    <Sparkline values={s.last7} />
                  </div>
                  <p className="mt-2 text-xs text-foreground/60">Trend: {s.last7[0]} → {s.last7[s.last7.length - 1]}</p>
                </div>
              </div>

              <div className="border-t border-foreground/10 p-5">
                <p className="text-sm font-semibold" data-testid="text-heatmap-title">Subject Heatmap</p>
                <p className="mt-1 text-xs text-foreground/60" data-testid="text-heatmap-sub">Minimal text, maximum clarity</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {SUBJECTS.map((subj) => (
                    <HeatCell key={subj} label={subj} value={s.subjectScores[subj]} />
                  ))}
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
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5 text-foreground/80 ring-1 ring-foreground/10">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" data-testid="text-ai-title">AI Recommendations</p>
                    <p className="text-xs text-foreground/60" data-testid="text-ai-sub">Simulated, but decision-ready</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5">
                {suggestions.map((rec) => (
                  <div
                    key={rec.id}
                    className={cn("rounded-2xl border p-4", toneClasses(rec.tone))}
                    data-testid={`card-recommendation-${rec.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold" data-testid={`text-recommendation-title-${rec.id}`}>{rec.title}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/70">
                        Action
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/70" data-testid={`text-recommendation-detail-${rec.id}`}>{rec.detail}</p>
                  </div>
                ))}

                <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4" data-testid="panel-next-step">
                  <p className="text-sm font-semibold">Next best step</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    {s.attendance < 88 || s.subjectScores.Math < 65
                      ? "Schedule support plan + guardian touchpoint within 72 hours."
                      : "Maintain momentum with stretch goals + monthly review."}
                  </p>
                </div>

                <Button variant="secondary" className="w-full rounded-xl" data-testid="button-back-dashboard" asChild>
                  <Link href="/dashboard">
                    <span className="inline-flex items-center gap-2">
                      Back to dashboard
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
