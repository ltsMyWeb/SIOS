import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Command,
  Plus,
  Save,
  Search,
  User,
  Keyboard,
  History,
  Lock,
  UserPlus,
  Check,
  Terminal,
  Activity,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type StudentRecord = {
  id: string;
  name: string;
  rollNo: number;
  class: string;
  section: string;
  status: "P" | "A" | "L" | "";
  note: string;
};

type LogEntry = {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "SYS";
  message: string;
};

const INITIAL_STUDENTS: StudentRecord[] = [
  { id: "1", name: "Aarav Mehta", rollNo: 1, class: "8", section: "B", status: "", note: "" },
  { id: "2", name: "Ananya Sharma", rollNo: 2, class: "8", section: "B", status: "", note: "" },
  { id: "3", name: "Ishaan Roy", rollNo: 3, class: "8", section: "B", status: "", note: "" },
  { id: "4", name: "Meera Nair", rollNo: 4, class: "8", section: "B", status: "", note: "" },
];

const CLASSES = ["Pre-Primary", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function TeacherCRM() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [search, setSearch] = useState("");
  const [activeRow, setActiveRow] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // System Dashboard State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Add Student State
  const [newName, setNewName] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Auto-generate logs
  useEffect(() => {
    if (!isLoggedIn) return;
    const messages = [
      "SIOS_NODE_STABLE :: Memory 12% usage",
      "REGISTRY_SYNC_ACTIVE :: Waiting for commit",
      "KEYBOARD_LISTENER_INIT :: Latency 2ms",
      "AUTH_TOKEN_VERIFIED :: TTL 3600s",
      "DASHBOARD_HEARTBEAT :: 200 OK",
    ];
    
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: Math.random() > 0.8 ? "SYS" : "INFO",
        message: messages[Math.floor(Math.random() * messages.length)],
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.rollNo.toString().includes(search)
    );
  }, [students, search]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsLoggedIn(true);
      toast({ title: "Access Granted", description: "Logged into Secure Portal." });
    } else {
      toast({ title: "Access Denied", description: "Invalid passcode.", variant: "destructive" });
    }
  };

  const updateStatus = (id: string, status: StudentRecord["status"]) => {
    setStudents(prev => {
      const newStudents = prev.map(s => s.id === id ? { ...s, status } : s);
      const student = prev.find(s => s.id === id);
      if (student) {
        addLog(`STATUS_UPDATE :: ${student.name} -> ${status || 'NULL'}`);
      }
      return newStudents;
    });
  };

  const addLog = (message: string, level: LogEntry["level"] = "INFO") => {
    const newLog: LogEntry = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleNoteChange = (id: string, note: string) => {
    const lowerNote = note.toLowerCase();
    let autoStatus: StudentRecord["status"] = "";
    
    if (lowerNote.includes("present") || lowerNote === "p") {
      autoStatus = "P";
    } else if (lowerNote.includes("absent") || lowerNote === "a") {
      autoStatus = "A";
    } else if (lowerNote.includes("late") || lowerNote === "l") {
      autoStatus = "L";
    }

    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const newS = { ...s, note };
        if (autoStatus) newS.status = autoStatus;
        return newS;
      }
      return s;
    }));
    
    if (autoStatus) {
      addLog(`REACTIVE_LOGIC :: Keyword detection triggered [${autoStatus}]`, "SYS");
    }
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

  const handleAddStudent = () => {
    if (!newName || !newRoll || !newClass || !newSection) {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    const newStudent: StudentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      rollNo: parseInt(newRoll),
      class: newClass,
      section: newSection,
      status: "",
      note: "",
    };
    setStudents(prev => [...prev, newStudent]);
    setIsAddOpen(false);
    setNewName("");
    setNewRoll("");
    setNewClass("");
    setNewSection("");
    addLog(`ENROLLMENT_SUCCESS :: ${newStudent.name} [Class ${newStudent.class}${newStudent.section}]`, "SYS");
    toast({ title: "Success", description: "Student added to registry." });
  };

  const getSections = (grade: string) => {
    if (!grade) return [];
    if (grade === "Pre-Primary" || parseInt(grade) <= 8) return ["A", "B"];
    return ["A", "B", "C"];
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-mono">
        <Card className="w-full max-w-sm bg-slate-900 border-slate-800 rounded-none p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-full">
              <Lock className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-xl font-black text-white uppercase tracking-tighter">Secure Access</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">SIOS Terminal Node_01</p>
            </div>
            <form onSubmit={handleLogin} className="w-full space-y-4">
              <Input
                type="password"
                placeholder="ENTER_PASSCODE..."
                className="bg-slate-950 border-slate-800 rounded-none text-white font-black text-center placeholder:text-slate-700 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-none h-12 font-black uppercase tracking-widest text-xs">
                Initialize_Session
              </Button>
            </form>
            <p className="text-[10px] text-slate-600 font-bold uppercase">Hint: admin123</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-mono text-sm leading-tight flex flex-col h-screen">
      <div className="border-b bg-slate-50 px-4 py-2 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span>SIOS_v1.0</span>
          </Link>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider">Registry_Active</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 border-slate-300 rounded-none px-3 font-bold uppercase text-[10px]">
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Enroll_Student
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none font-mono border-slate-900">
              <DialogHeader>
                <DialogTitle className="uppercase font-black tracking-tighter">Student_Enrollment_Form</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Full_Name</label>
                  <Input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="NAME..." 
                    className="rounded-none font-bold uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Roll_Number</label>
                    <Input 
                      type="number"
                      value={newRoll} 
                      onChange={(e) => setNewRoll(e.target.value)} 
                      placeholder="00" 
                      className="rounded-none font-bold"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Grade_Class</label>
                    <Select onValueChange={(val) => { setNewClass(val); setNewSection(""); }}>
                      <SelectTrigger className="rounded-none font-bold">
                        <SelectValue placeholder="GRADE" />
                      </SelectTrigger>
                      <SelectContent className="font-mono rounded-none">
                        {CLASSES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Section_ID</label>
                  <Select value={newSection} onValueChange={setNewSection} disabled={!newClass}>
                    <SelectTrigger className="rounded-none font-bold">
                      <SelectValue placeholder="SELECT_SECTION" />
                    </SelectTrigger>
                    <SelectContent className="font-mono rounded-none">
                      {getSections(newClass).map(s => (
                        <SelectItem key={s} value={s}>Section {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddStudent} className="w-full bg-blue-600 hover:bg-blue-700 rounded-none uppercase font-black tracking-widest text-xs h-11">
                  Commit_Enrollment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button size="sm" className="h-7 bg-blue-600 hover:bg-blue-700 rounded-none px-4 font-bold uppercase tracking-tight text-xs" onClick={() => addLog("MANUAL_SYNC_INIT :: Handshake...", "SYS")}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Sync_Server
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Nav + Dashboard */}
        <div className="w-64 border-r bg-slate-50 flex flex-col overflow-hidden hidden md:flex">
          <div className="p-3 space-y-4 flex flex-col h-full">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-widest">Navigation</div>
              <Button variant="ghost" size="sm" className="w-full justify-start rounded-none h-8 font-bold bg-white border border-slate-200 shadow-sm">
                <Command className="h-3.5 w-3.5 mr-2 text-blue-600" />
                REGISTRY
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start rounded-none h-8 font-bold text-slate-500">
                <History className="h-3.5 w-3.5 mr-2" />
                AUDIT_LOG
              </Button>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-widest">System_Dash</div>
              <Card className="flex-1 border-slate-200 bg-slate-900 text-emerald-400 rounded-none overflow-hidden flex flex-col shadow-inner">
                <div className="p-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase">Live_Audit_Log</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
                <ScrollArea className="flex-1 p-2 font-mono text-[9px] leading-tight">
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-2">
                        <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                        <span className={cn(
                          "font-bold shrink-0",
                          log.level === "SYS" ? "text-blue-400" : "text-emerald-400"
                        )}>{log.level}</span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-slate-600">IDLE :: Waiting for system hooks...</p>}
                  </div>
                </ScrollArea>
              </Card>
              
              <div className="p-2 bg-blue-50 border border-blue-100 text-[10px] leading-relaxed shrink-0">
                <div className="flex items-center gap-2 mb-1 font-bold text-blue-900 uppercase">
                  <Cpu className="h-3 w-3" />
                  Session Data
                </div>
                <div className="flex justify-between"><span>Registry_Size:</span> <span className="font-bold">{students.length}</span></div>
                <div className="flex justify-between"><span>Term_Status:</span> <span className="font-bold text-blue-600">LIVE</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Entry Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="border-b px-4 py-2 flex items-center bg-white shrink-0">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              placeholder="QUICK_FILTER_REGISTRY..." 
              className="flex-1 bg-transparent border-none outline-none font-bold placeholder:text-slate-300 uppercase"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <Table className="border-collapse table-fixed w-full">
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-12 border-r text-[10px] font-bold uppercase text-slate-500 text-center">RL</TableHead>
                  <TableHead className="w-48 border-r text-[10px] font-bold uppercase text-slate-500 px-4">Student_Identity</TableHead>
                  <TableHead className="w-16 border-r text-[10px] font-bold uppercase text-slate-500 text-center">Gr</TableHead>
                  <TableHead className="w-16 border-r text-[10px] font-bold uppercase text-slate-500 text-center">Se</TableHead>
                  <TableHead className="w-20 border-r text-[10px] font-bold uppercase text-slate-500 text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4">Reactive_Log / Observations</TableHead>
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
                    <TableCell className="border-r px-4 font-bold uppercase tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-slate-300 shrink-0" />
                        {student.name}
                      </div>
                    </TableCell>
                    <TableCell className="border-r text-center font-bold text-slate-500">
                      {student.class}
                    </TableCell>
                    <TableCell className="border-r text-center font-bold text-slate-500">
                      {student.section}
                    </TableCell>
                    <TableCell className="border-r p-0 text-center">
                      <input
                        ref={(el) => {
                          if (inputRefs.current) {
                            inputRefs.current[index] = el;
                          }
                        }}
                        className={cn(
                          "w-full h-10 text-center outline-none font-black text-lg transition-all",
                          student.status === "P" && "bg-emerald-100 text-emerald-700",
                          student.status === "A" && "bg-rose-100 text-rose-700",
                          student.status === "L" && "bg-amber-100 text-amber-700",
                          student.status === "" && "bg-transparent text-slate-300"
                        )}
                        value={student.status}
                        onChange={() => {}} 
                        onKeyDown={(e) => handleKeyDown(e, index, student.id)}
                        onFocus={() => setActiveRow(index)}
                        placeholder="."
                      />
                    </TableCell>
                    <TableCell className="px-4 p-0">
                      <input 
                        className="w-full h-10 bg-transparent outline-none px-2 text-slate-600 italic border-none focus:bg-white transition-colors"
                        placeholder="TYPE 'P', 'A', OR 'L' TO UPDATE STATUS..."
                        value={student.note}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      <div className="h-6 bg-slate-900 text-white flex items-center px-4 justify-between text-[9px] font-bold tracking-widest uppercase shrink-0">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-emerald-400" />
            <span>SYS_READY</span>
          </div>
          <span className="text-emerald-400">SESSION_AUTH_OK</span>
          <span>REACTIVE_LOGIC_ON</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>IDLE_DAEMON_LISTENING</span>
          </div>
          <span>{new Date().toLocaleTimeString()} :: ADMIN_SESSION</span>
        </div>
      </div>
    </div>
  );
}
