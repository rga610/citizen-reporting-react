import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import crypto from "node:crypto";
import { prisma } from "./db/client.js";
import { assignTreatment } from "./services/treatment.js";
import reportRoutes from "./routes/report.js";
import sseRoutes from "./routes/sse.js";
import adminRoutes from "./routes/admin.js";
import surveyRoutes from "./routes/survey.js";

const app = Fastify({ logger: true });

app.register(helmet);
app.register(cors, { origin: true, credentials: true });

// Validate required environment variables
if (!process.env.COOKIE_SECRET) {
  app.log.error("COOKIE_SECRET environment variable is required!");
  process.exit(1);
}

app.register(cookie, { secret: process.env.COOKIE_SECRET });

app.addHook("onRequest", async (req, reply) => {
  reply.header("Permissions-Policy", "camera=(self)");
});

app.get("/api/health", async () => ({ 
  ok: true,
  envCheck: {
    adminTokenSet: !!process.env.ADMIN_TOKEN,
    nodeEnv: process.env.NODE_ENV,
    // Don't expose the actual token value in production
    adminTokenPreview: process.env.ADMIN_TOKEN ? `${process.env.ADMIN_TOKEN.substring(0, 2)}...` : "not set"
  }
}));

// Login endpoint - authenticate with username
app.post("/api/login", async (req, reply) => {
  const { username, forceLogout } = req.body as { username?: string; forceLogout?: boolean };
  if (!username || typeof username !== "string" || username.trim().length === 0) {
    return reply.code(400).send({ error: "Username is required" });
  }

  const slot = Number(process.env.SESSION_SLOT || "1");
  const session = await prisma.session.findFirst({ where: { slot }, orderBy: { id: "desc" } });
  
  if (!session) {
    return reply.code(400).send({ error: "No active session found" });
  }

  // Find participant by username (publicCode) in current session
  const participant = await prisma.participant.findFirst({
    where: {
      publicCode: username.trim(),
      sessionId: session.id
    }
  });

  if (!participant) {
    return reply.code(404).send({ error: "Username not found" });
  }

  // Check if username is already active in this session
  if (participant.isActive) {
    if (forceLogout) {
      // Force logout: deactivate the existing session and proceed with login
      await prisma.participant.update({
        where: { id: participant.id },
        data: { isActive: false }
      });
      // Continue to login below
    } else {
      return reply.code(409).send({ 
        error: "This username is already logged in.",
        alreadyActive: true
      });
    }
  }

  // Mark as active and set cookie
  await prisma.participant.update({
    where: { id: participant.id },
    data: { isActive: true }
  });

  reply.setCookie("pid", participant.id, { 
    httpOnly: true, 
    sameSite: "none",  // Changed to "none" for cross-origin cookie support
    path: "/",
    secure: true  // Always true in production, required for sameSite: "none"
  });
  return reply.send({
    status: "ok",
    publicCode: participant.publicCode,
    treatment: participant.treatment,
    totalReports: participant.totalReports
  });
});

// Logout endpoint - mark user as inactive
app.post("/api/logout", async (req, reply) => {
  const pid = req.cookies["pid"];
  if (!pid) {
    return reply.code(400).send({ error: "Not logged in" });
  }

  try {
    // Find and update participant
    const participant = await prisma.participant.findUnique({ where: { id: pid } });
    if (!participant) {
      // Participant not found, but clear cookie anyway
      reply.clearCookie("pid", { 
        path: "/",
        httpOnly: true,
        sameSite: "none",
        secure: true
      });
      return reply.send({ status: "ok", message: "Session cleared" });
    }

    // Mark as inactive
    await prisma.participant.update({
      where: { id: pid },
      data: { isActive: false }
    });

    // Clear cookie with same options as when setting it
    reply.clearCookie("pid", { 
      path: "/",
      httpOnly: true,
      sameSite: "none",
      secure: true
    });
    return reply.send({ status: "ok", message: "Logged out successfully" });
  } catch (err) {
    // Log error but still try to clear cookie
    app.log.error({ err }, "Logout error");
    reply.clearCookie("pid", { 
      path: "/",
      httpOnly: true,
      sameSite: "none",
      secure: true
    });
    return reply.code(500).send({ error: "Failed to logout", message: "Session cleared but logout failed" });
  }
});

// Dev-only endpoints for testing (only in development)
if (process.env.NODE_ENV !== "production") {
  // List all participants with their treatments
  app.get("/api/dev/participants", async (req, reply) => {
    const slot = Number((req.query as any).slot || process.env.SESSION_SLOT || "1");
    const session = await prisma.session.findFirst({ where: { slot }, orderBy: { id: "desc" } });
    const participants = await prisma.participant.findMany({
      where: session ? { sessionId: session.id } : undefined,
      select: { id: true, publicCode: true, treatment: true, totalReports: true },
      orderBy: { createdAt: "desc" },
    });
    return reply.send(participants);
  });

  // Switch current user to a different participant
  app.post("/api/dev/switch-user", async (req, reply) => {
    const { participantId } = req.body as { participantId: string };
    if (!participantId) {
      return reply.code(400).send({ error: "participantId required" });
    }
    const participant = await prisma.participant.findUnique({ where: { id: participantId } });
    if (!participant) {
      return reply.code(404).send({ error: "Participant not found" });
    }
    
    // Mark old user as inactive
    const oldPid = req.cookies["pid"];
    if (oldPid && oldPid !== participantId) {
      await prisma.participant.update({
        where: { id: oldPid },
        data: { isActive: false }
      }).catch(() => {
        // Ignore errors
      });
    }
    
    // Mark new user as active
    await prisma.participant.update({
      where: { id: participantId },
      data: { isActive: true }
    });
    
    reply.setCookie("pid", participantId, { 
      httpOnly: true, 
      sameSite: "none", 
      path: "/",
      secure: true
    });
    return reply.send({ 
      status: "switched", 
      publicCode: participant.publicCode, 
      treatment: participant.treatment,
      totalReports: participant.totalReports
    });
  });
}

// Participant info endpoint - requires login
app.get("/api/join", async (req, reply) => {
  const pid = req.cookies["pid"];
  if (!pid) {
    return reply.code(401).send({ error: "Not logged in. Please log in first." });
  }
  
  // Existing participant - return their info
  const participant = await prisma.participant.findUnique({ where: { id: pid }, select: { id: true, publicCode: true, treatment: true, totalReports: true, isActive: true } });
  if (participant) {
    // Check if participant is still active (they logged in)
    if (!participant.isActive) {
      reply.clearCookie("pid", { 
        path: "/",
        httpOnly: true,
        sameSite: "none",
        secure: true
      });
      return reply.code(401).send({ error: "Session expired. Please log in again." });
    }
    const response: any = { 
      status: "ok", 
      publicCode: participant.publicCode, 
      treatment: participant.treatment, 
      totalReports: participant.totalReports,
      participantId: participant.id  // Always include for dev panel to work
    };
    return reply.send(response);
  }
  
  // Cookie exists but participant not found - clear cookie and require login
  reply.clearCookie("pid", { path: "/" });
  return reply.code(401).send({ error: "Session invalid. Please log in again." });
});

app.register(reportRoutes);
app.register(sseRoutes);
app.register(adminRoutes);
app.register(surveyRoutes);

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: "0.0.0.0" }).catch(err => {
  app.log.error(err);
  process.exit(1);
});
