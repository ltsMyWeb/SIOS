import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { StudentDetailResponse } from "@shared/schema";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function StudentLive() {
  const [, params] = useRoute("/student/:studentId");
  const studentId = params?.studentId ?? "";
  const { data, isLoading, error } = useQuery<StudentDetailResponse>({
    queryKey: [`/api/students/${studentId}`],
    enabled: Boolean(studentId),
  });

  if (isLoading) return <div className="min-h-screen si-gradient p-8">Loading student...</div>;
  if (!data) return <div className="min-h-screen si-gradient p-8">{error instanceof Error ? error.message : "Student not found"}</div>;

  const student = data.student;

  return (
    <div className="min-h-screen si-gradient">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <Button asChild variant="secondary" className="rounded-2xl">
          <Link href={`/class/${student.classId}`}>
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to class
            </span>
          </Link>
        </Button>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/65">Student profile</p>
                  <h1 className="mt-2 font-serif text-4xl font-semibold">{student.name}</h1>
                  <p className="mt-2 text-sm text-foreground/60">
                    {student.classId.toUpperCase()} • Roll #{student.rollNo}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1.5">
                  {student.status || "No mark"}
                </Badge>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-foreground/55">Attendance</p>
                  <p className="mt-1 text-2xl font-semibold">{student.attendance}%</p>
                  <Progress value={student.attendance} className="mt-3 h-2" />
                </div>
                <div>
                  <p className="text-xs text-foreground/55">Overall</p>
                  <p className="mt-1 text-2xl font-semibold">{student.overall}%</p>
                  <Progress value={student.overall} className="mt-3 h-2" />
                </div>
                <div>
                  <p className="text-xs text-foreground/55">Math</p>
                  <p className="mt-1 text-xl font-semibold">{student.subjectScores.Math}%</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/55">Science</p>
                  <p className="mt-1 text-xl font-semibold">{student.subjectScores.Science}%</p>
                </div>
              </div>

              <div className="mt-6 rounded-[22px] border border-foreground/10 bg-background/40 p-4">
                <p className="text-xs text-foreground/55">Teacher note</p>
                <p className="mt-2 text-sm text-foreground/75">{student.note}</p>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card className="si-card rounded-[30px] border bg-card/80 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Support notes</p>
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
        </div>
      </div>
    </div>
  );
}
