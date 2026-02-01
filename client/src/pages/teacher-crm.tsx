import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  MessageSquare,
  Plus,
  Save,
  Search,
  UserCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type StudentRecord = {
  id: string;
  name: string;
  rollNo: number;
  status: "present" | "absent" | "late" | "unset";
  note: string;
};

const INITIAL_STUDENTS: StudentRecord[] = [
  { id: "1", name: "Aarav Mehta", rollNo: 1, status: "unset", note: "" },
  { id: "2", name: "Ananya Sharma", rollNo: 2, status: "unset", note: "" },
  { id: "3", name: "Ishaan Roy", rollNo: 3, status: "unset", note: "" },
  { id: "4", name: "Meera Nair", rollNo: 4, status: "unset", note: "" },
  { id: "5", name: "Rohan Gupta", rollNo: 5, status: "unset", note: "" },
  { id: "6", name: "Sara Khan", rollNo: 6, status: "unset", note: "" },
  { id: "7", name: "Vihaan Singh", rollNo: 7, status: "unset", note: "" },
  { id: "8", name: "Zara Patel", rollNo: 8, status: "unset", note: "" },
];

export default function TeacherCRM() {
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("8B");

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.rollNo.toString().includes(search)
    );
  }, [students, search]);

  const stats = useMemo(() => {
    const present = students.filter(s => s.status === "present").length;
    const absent = students.filter(s => s.status === "absent").length;
    const late = students.filter(s => s.status === "late").length;
    const pending = students.filter(s => s.status === "unset").length;
    return { present, absent, late, pending };
  }, [students]);

  const updateStatus = (id: string, status: StudentRecord["status"]) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: "present" })));
    toast({ title: "Marked all present", description: "Class 8B attendance updated." });
  };

  const saveAttendance = () => {
    toast({ 
      title: "Attendance Saved", 
      description: `Successfully logged attendance for ${students.length} students.`,
      variant: "default" 
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <span className="text-sm font-medium">Teacher Portal</span>
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Attendance CRM</h1>
            <p className="text-muted-foreground">Manage daily records for Class {selectedClass}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex bg-card border rounded-xl p-1 shadow-sm">
              {["8B", "7C", "10A"].map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                    selectedClass === c ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <Button onClick={saveAttendance} className="rounded-xl shadow-lg shadow-primary/20">
              <Save className="h-4 w-4 mr-2" />
              Save Record
            </Button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Present", value: stats.present, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20", icon: CheckCircle2 },
            { label: "Absent", value: stats.absent, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20", icon: XCircle },
            { label: "Late", value: stats.late, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20", icon: Calendar },
            { label: "Pending", value: stats.pending, color: "text-slate-600 bg-slate-100 dark:bg-slate-800/50", icon: ClipboardList },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 border-none shadow-sm flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-serif font-bold">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Interface */}
        <Card className="border-none shadow-xl overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm">
          <div className="p-4 border-b bg-card/80 flex flex-col sm:row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                className="pl-10 rounded-xl bg-background/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="rounded-lg flex-1 sm:flex-none" onClick={markAllPresent}>
                Mark All Present
              </Button>
              <Button variant="ghost" size="icon" className="rounded-lg">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">Roll</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Notes / Communications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredStudents.map((student) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={student.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-mono text-muted-foreground">
                        {student.rollNo.toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 ring-2 ring-background">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => updateStatus(student.id, "present")}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              student.status === "present" 
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                                : "bg-muted text-muted-foreground hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
                            )}
                            title="Present"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(student.id, "absent")}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              student.status === "absent" 
                                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                                : "bg-muted text-muted-foreground hover:bg-rose-100 dark:hover:bg-rose-950/30"
                            )}
                            title="Absent"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(student.id, "late")}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              student.status === "late" 
                                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" 
                                : "bg-muted text-muted-foreground hover:bg-amber-100 dark:hover:bg-amber-950/30"
                            )}
                            title="Late"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 group/note">
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                          <Input 
                            placeholder="Add behavioral note..." 
                            className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-muted hover:bg-muted/50 transition-all rounded-md"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          Profile
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
