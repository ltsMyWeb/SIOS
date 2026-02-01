import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Command,
  Plus,
  Save,
  Search,
  User,
  X,
  Keyboard,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  status: "P" | "A" | "L" | "";
  note: string;
};

const INITIAL_STUDENTS: StudentRecord[] = [
  { id: "1", name: "Aarav Mehta", rollNo: 1, status: "", note: "" },
  { id: "2", name: "Ananya Sharma", rollNo: 2, status: "", note: "" },
  { id: "3", name: "Ishaan Roy", rollNo: 3, status: "", note: "" },
  { id: "4", name: "Meera Nair", rollNo: 4, status: "", note: "" },
  { id: "5", name: "Rohan Gupta", rollNo: 5, status: "", note: "" },
  { id: "6", name: "Sara Khan", rollNo: 6, status: "", note: "" },
  { id: "7", name: "Vihaan Singh", rollNo: 7, status: "", note: "" },
  { id: "8", name: "Zara Patel", rollNo: 8, status: "", note: "" },
  { id: "9", name: "Aditya Verma", rollNo: 9, status: "", note: "" },
  { id: "10", name: "Kavya Iyer", rollNo: 10, status: "", note: "" },
];

export default function TeacherCRM() {
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [search, setSearch] = useState("");
  const [activeRow, setActiveRow] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.rollNo.toString().includes(search)
    );
  }, [students, search]);

  const updateStatus = (id: string, status: StudentRecord["status"]) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, id: string) => {
    if (e.key === "p" || e.key === "P") {
      updateStatus(id, "P");
      focusNext(index);
    } else if (e.key === "a" || e.key === "A") {
      updateStatus(id, "A");
      focusNext(index);
    } else if (e.key === "l" || e.key === "L") {
      updateStatus(id, "L");
      focusNext(index);
    } else if (e.key === "ArrowDown") {
      focusNext(index);
    } else if (e.key === "ArrowUp") {
      focusPrev(index);
    }
  };

  const focusNext = (index: number) => {
    if (index < filteredStudents.length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveRow(index + 1);
    }
  };

  const focusPrev = (index: number) => {
    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveRow(index - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-mono text-sm leading-tight">
      {/* Super Compact Header */}
      <div className="border-b bg-slate-50 sticky top-0 z-10 px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span>SIOS_v1.0</span>
          </Link>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider">Class_8B</span>
            <Badge variant="outline" className="rounded-none border-slate-300 bg-white text-[10px] py-0">
              FEB_01_2026
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold">
            <Keyboard className="h-3 w-3" />
            <span>[P]resent [A]bsent [L]ate [Arrows]Nav</span>
          </div>
          <Button size="sm" className="h-7 bg-blue-600 hover:bg-blue-700 rounded-none px-4 font-bold uppercase tracking-tight text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Commit_Record
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-41px)]">
        {/* Sidebar Nav */}
        <div className="w-48 border-r bg-slate-50 flex flex-col p-2 gap-1 overflow-y-auto hidden md:flex">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-widest">Navigation</div>
          <Button variant="ghost" size="sm" className="justify-start rounded-none h-8 font-bold bg-white border border-slate-200 shadow-sm">
            <Command className="h-3.5 w-3.5 mr-2 text-blue-600" />
            ATTENDANCE
          </Button>
          <Button variant="ghost" size="sm" className="justify-start rounded-none h-8 font-bold text-slate-500">
            <History className="h-3.5 w-3.5 mr-2" />
            LOG_HISTORY
          </Button>
          <Button variant="ghost" size="sm" className="justify-start rounded-none h-8 font-bold text-slate-500">
            <Plus className="h-3.5 w-3.5 mr-2" />
            NEW_BATCH
          </Button>
          <div className="mt-auto p-2 bg-blue-50 border border-blue-100 text-[10px] leading-relaxed">
            <p className="font-bold text-blue-900 uppercase mb-1">Status Summary</p>
            <div className="flex justify-between"><span>P_Present:</span> <span className="font-bold">{students.filter(s => s.status === "P").length}</span></div>
            <div className="flex justify-between"><span>A_Absent:</span> <span className="font-bold">{students.filter(s => s.status === "A").length}</span></div>
            <div className="flex justify-between"><span>Pending:</span> <span className="font-bold text-blue-600">{students.filter(s => s.status === "").length}</span></div>
          </div>
        </div>

        {/* Entry Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-4 py-2 flex items-center bg-white">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              placeholder="SEARCH_BY_ID_OR_NAME..." 
              className="flex-1 bg-transparent border-none outline-none font-bold placeholder:text-slate-300 uppercase"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <Table className="border-collapse">
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-12 border-r text-[10px] font-bold uppercase text-slate-500 text-center">ID</TableHead>
                  <TableHead className="w-64 border-r text-[10px] font-bold uppercase text-slate-500 px-4">Student_Identity</TableHead>
                  <TableHead className="w-32 border-r text-[10px] font-bold uppercase text-slate-500 text-center">Status_Flag</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4">Observation_Log</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow 
                    key={student.id} 
                    className={cn(
                      "h-10 border-b transition-colors",
                      activeRow === index ? "bg-blue-50/50" : "hover:bg-slate-50/50"
                    )}
                  >
                    <TableCell className="border-r font-bold text-slate-400 text-center">
                      {student.rollNo.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="border-r px-4 font-bold uppercase tracking-tight">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-slate-300" />
                        {student.name}
                      </div>
                    </TableCell>
                    <TableCell className="border-r p-0 text-center">
                      <input
                        ref={el => inputRefs.current[index] = el}
                        className={cn(
                          "w-full h-10 text-center outline-none font-black text-lg transition-all",
                          student.status === "P" && "bg-emerald-100 text-emerald-700",
                          student.status === "A" && "bg-rose-100 text-rose-700",
                          student.status === "L" && "bg-amber-100 text-amber-700",
                          student.status === "" && "bg-transparent text-slate-300"
                        )}
                        value={student.status}
                        onChange={() => {}} // Controlled by onKeyDown
                        onKeyDown={(e) => handleKeyDown(e, index, student.id)}
                        onFocus={() => setActiveRow(index)}
                        placeholder="."
                      />
                    </TableCell>
                    <TableCell className="px-4 p-0">
                      <input 
                        className="w-full h-10 bg-transparent outline-none px-1 text-slate-600 italic border-none focus:bg-white transition-colors"
                        placeholder="[NULL_ENTRY]"
                        defaultValue={student.note}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Visual Feedback Footer */}
      <div className="h-6 bg-slate-900 text-white flex items-center px-4 justify-between text-[9px] font-bold tracking-widest uppercase">
        <div className="flex gap-4">
          <span>SYS_READY</span>
          <span className="text-emerald-400">CONNECT_STABLE</span>
          <span>BUFFER_0%</span>
        </div>
        <div>
          AUTOSAVE_ACTIVE :: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
