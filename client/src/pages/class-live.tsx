import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { ClassDetailResponse } from "@shared/schema";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ClassLive() {
  const [, params] = useRoute("/class/:classId");
  const classId = params?.classId ?? "";
  const { data, isLoading, error } = useQuery<ClassDetailResponse>({
    queryKey: [`/api/classes/${classId}`],
    enabled: Boolean(classId),
  });

  if (isLoading) return <div className="min-h-screen si-gradient p-8">Loading class...</div>;
  if (!data) return <div className="min-h-screen si-gradient p-8">{error instanceof Error ? error.message : "Class not found"}</div>;

  return (
    <div className="min-h-screen si-gradient">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <Button asChild variant="secondary" className="rounded-2xl">
          <Link href="/dashboard">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </span>
          </Link>
        </Button>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/65">Class overview</p>
                  <h1 className="mt-2 font-serif text-4xl font-semibold">{data.classroom.name}</h1>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1.5">
                  {data.classroom.students} students
                </Badge>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-foreground/55">Attendance</p>
                  <p className="mt-1 text-2xl font-semibold">{data.classroom.attendance}%</p>
                  <Progress value={data.classroom.attendance} className="mt-3 h-2" />
                </div>
                <div>
                  <p className="text-xs text-foreground/55">Math average</p>
                  <p className="mt-1 text-2xl font-semibold">{data.classroom.mathAverage}%</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/55">Students to review</p>
                  <p className="mt-1 text-2xl font-semibold">{data.classroom.atRisk}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/55">Term delta</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {data.classroom.termDelta >= 0 ? "+" : ""}
                    {data.classroom.termDelta}%
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Students in this class</p>
                <Users className="h-4 w-4 text-foreground/55" />
              </div>
              <div className="mt-4 space-y-3">
                {data.students.map((student) => (
                  <Link key={student.id} href={`/student/${student.id}`}>
                    <div className="rounded-[22px] border border-foreground/10 bg-background/45 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{student.name}</p>
                        <Badge variant="secondary" className="rounded-full px-3 py-1.5">
                          {student.status || "-"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-foreground/55">
                        Roll #{student.rollNo} • Attendance {student.attendance}% • Overall {student.overall}%
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
