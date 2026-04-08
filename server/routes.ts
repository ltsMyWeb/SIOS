import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import {
  appSessionSchema,
  createStudentSchema,
  createTeacherSchema,
  principalAuthSchema,
  studentAuthSchema,
  teacherAuthSchema,
  updatePrincipalCodeSchema,
  updateStudentSchema,
  updateTeacherSchema,
} from "@shared/schema";
import { probeFirestore } from "./firebase";
import { verifyPrincipalCode } from "./principal-auth";
import { storage } from "./storage";

declare module "express-session" {
  interface SessionData {
    authenticatedRole?: "teacher" | "principal" | "student";
    label?: string;
    teacherId?: string | null;
    studentId?: string | null;
    classIds?: string[];
  }
}

const requireTeacherSession: RequestHandler = (req, res, next) => {
  if (req.session.authenticatedRole !== "teacher") {
    return res.status(401).json({ message: "Teacher authentication required" });
  }
  next();
};

const requirePrincipalSession: RequestHandler = (req, res, next) => {
  if (req.session.authenticatedRole !== "principal") {
    return res.status(401).json({ message: "Principal authentication required" });
  }
  next();
};

const requireStudentSession: RequestHandler = (req, res, next) => {
  if (req.session.authenticatedRole !== "student") {
    return res.status(401).json({ message: "Student authentication required" });
  }
  next();
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildSessionResponse(req: Parameters<RequestHandler>[0]) {
  return appSessionSchema.parse({
    authenticated: Boolean(req.session.authenticatedRole),
    role: req.session.authenticatedRole ?? null,
    label: req.session.label ?? null,
    teacherId: req.session.teacherId ?? null,
    studentId: req.session.studentId ?? null,
    classIds: req.session.classIds ?? [],
  });
}

function clearSession(req: Parameters<RequestHandler>[0]) {
  req.session.authenticatedRole = undefined;
  req.session.label = undefined;
  req.session.teacherId = null;
  req.session.studentId = null;
  req.session.classIds = [];
}

function regenerateSession(req: Parameters<RequestHandler>[0]) {
  return new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/health", async (_req, res) => {
    const backend = await probeFirestore();
    res.json({ ok: true, timestamp: new Date().toISOString(), backend });
  });

  app.get("/api/catalog", async (_req, res, next) => {
    try {
      res.json(await storage.getSchoolCatalog());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard", async (_req, res, next) => {
    try {
      res.json(await storage.getDashboardData());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/classes/:classId", async (req, res, next) => {
    try {
      const classId = getSingleParam(req.params.classId);
      if (!classId) return res.status(400).json({ message: "Class id is required" });
      const detail = await storage.getClassDetail(classId);
      if (!detail) return res.status(404).json({ message: "Class not found" });
      res.json(detail);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/students/:studentId", async (req, res, next) => {
    try {
      const studentId = getSingleParam(req.params.studentId);
      if (!studentId) return res.status(400).json({ message: "Student id is required" });
      const detail = await storage.getStudentDetail(studentId);
      if (!detail) return res.status(404).json({ message: "Student not found" });
      res.json(detail);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/session", (req, res) => {
    res.json(buildSessionResponse(req));
  });

  const teacherLoginHandler: RequestHandler = async (req, res, next) => {
    try {
      const parsed = teacherAuthSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid teacher credentials" });
      const match = await storage.authenticateTeacher(parsed.data.loginId, parsed.data.password);
      if (!match) return res.status(401).json({ message: "Invalid login ID or password" });

      await regenerateSession(req);
      req.session.authenticatedRole = "teacher";
      req.session.teacherId = match.id;
      req.session.classIds = match.classIds;
      req.session.label = match.label;
      res.json(buildSessionResponse(req));
    } catch (error) {
      next(error);
    }
  };

  app.post("/api/teacher-console/login", teacherLoginHandler);
  app.post("/api/teacher-crm/login", teacherLoginHandler);

  app.post("/api/principal/login", (req, res, next) => {
    (async () => {
      const parsed = principalAuthSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid principal code payload" });
      if (!verifyPrincipalCode(parsed.data.principalCode)) return res.status(401).json({ message: "Invalid principal code" });

      await regenerateSession(req);
      req.session.authenticatedRole = "principal";
      req.session.label = "Principal";
      res.json(buildSessionResponse(req));
    })().catch((error) => {
      next(error);
    });
  });

  app.post("/api/student-portal/login", async (req, res, next) => {
    try {
      const parsed = studentAuthSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid student login details" });
      const match = await storage.authenticateStudent(parsed.data.classId, parsed.data.rollNo, parsed.data.studentName);
      if (!match) return res.status(401).json({ message: "Student record not found for the details entered" });

      await regenerateSession(req);
      req.session.authenticatedRole = "student";
      req.session.studentId = match.id;
      req.session.classIds = match.classIds;
      req.session.label = match.label;
      res.json(buildSessionResponse(req));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("sios.sid");
      res.json(
        appSessionSchema.parse({
          authenticated: false,
          role: null,
          label: null,
          teacherId: null,
          studentId: null,
          classIds: [],
        }),
      );
    });
  });

  const teacherOverviewHandler: RequestHandler = async (req, res, next) => {
    try {
      res.json(await storage.getTeacherOverview(req.session.classIds ?? []));
    } catch (error) {
      next(error);
    }
  };

  app.get("/api/teacher-console/overview", requireTeacherSession, teacherOverviewHandler);
  app.get("/api/teacher-crm/overview", requireTeacherSession, teacherOverviewHandler);

  app.get("/api/student-portal/overview", requireStudentSession, async (req, res, next) => {
    try {
      const studentId = req.session.studentId;
      if (!studentId) return res.status(401).json({ message: "Student authentication required" });
      const detail = await storage.getStudentPortal(studentId);
      if (!detail) return res.status(404).json({ message: "Student not found" });
      res.json(detail);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/principal/overview", requirePrincipalSession, async (_req, res, next) => {
    try {
      res.json(await storage.getPrincipalOverview());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/principal/teachers", requirePrincipalSession, async (req, res, next) => {
    try {
      const parsed = createTeacherSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid teacher payload" });
      const teacher = await storage.createTeacher(parsed.data);
      res.status(201).json(teacher);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/principal/teachers/:teacherId", requirePrincipalSession, async (req, res, next) => {
    try {
      const teacherId = getSingleParam(req.params.teacherId);
      if (!teacherId) return res.status(400).json({ message: "Teacher id is required" });
      const parsed = updateTeacherSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid teacher update payload" });
      const teacher = await storage.updateTeacher(teacherId, parsed.data);
      if (!teacher) return res.status(404).json({ message: "Teacher not found" });
      res.json(teacher);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/principal/code", requirePrincipalSession, async (req, res, next) => {
    try {
      const parsed = updatePrincipalCodeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid principal code payload" });
      res.json(await storage.updatePrincipalCode(parsed.data));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/students", requireTeacherSession, async (req, res, next) => {
    try {
      const parsed = createStudentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid student payload" });
      const canAccess = await storage.canTeacherAccessClass(req.session.classIds ?? [], parsed.data.classId);
      if (!canAccess) return res.status(403).json({ message: "Teacher cannot modify this class" });
      const student = await storage.createStudent(parsed.data);
      res.status(201).json(student);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/students/:studentId", requireTeacherSession, async (req, res, next) => {
    try {
      const studentId = getSingleParam(req.params.studentId);
      if (!studentId) return res.status(400).json({ message: "Student id is required" });
      const canAccess = await storage.canTeacherAccessStudent(req.session.classIds ?? [], studentId);
      if (!canAccess) return res.status(403).json({ message: "Teacher cannot modify this student" });
      const parsed = updateStudentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid update payload" });
      const student = await storage.updateStudent(studentId, parsed.data);
      if (!student) return res.status(404).json({ message: "Student not found" });
      res.json(student);
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
