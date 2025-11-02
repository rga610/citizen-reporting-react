import { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";
import { exportScansCSV, exportParticipantsCSV } from "../utils/csv-export.js";

function guard(req: any, reply: any) {
  const token = (req.headers["x-admin-token"] || req.query.token || "").trim();
  const expectedToken = (process.env.ADMIN_TOKEN || "").trim();
  
  // Debug logging (remove after debugging)
  if (process.env.NODE_ENV !== "production" || process.env.DEBUG_ADMIN === "true") {
    console.log("[ADMIN] Token check:", {
      received: token ? `${token.substring(0, 2)}...` : "empty",
      expected: expectedToken ? `${expectedToken.substring(0, 2)}...` : "empty",
      envSet: !!process.env.ADMIN_TOKEN,
      envValue: process.env.ADMIN_TOKEN || "undefined"
    });
  }
  
  if (!expectedToken) {
    reply.code(500).send({ 
      error: "Admin token not configured on server",
      debug: process.env.NODE_ENV !== "production" ? {
        envVarExists: !!process.env.ADMIN_TOKEN,
        envVarValue: process.env.ADMIN_TOKEN || "undefined"
      } : undefined
    });
    return false;
  }
  
  if (!token || token !== expectedToken) {
    reply.code(401).send({ error: "unauthorized" });
    return false;
  }
  
  return true;
}

export default async function adminRoutes(app: FastifyInstance) {
  app.get("/api/admin/stats", async (req, reply) => {
    if (!guard(req, reply)) return;

    const slot = Number((req.query as any).slot || process.env.SESSION_SLOT || "1");
    const session = await prisma.session.findFirst({ where: { slot }, orderBy: { id: "desc" } });

    const byTreatment = await prisma.participant.groupBy({
      by: ["treatment"],
      _count: { _all: true },
      where: session ? { sessionId: session.id } : undefined
    });

    const byPeriod = session ? await prisma.scan.groupBy({
      by: ["periodId"],
      _count: { _all: true },
      where: { sessionId: session.id }
    }) : [];

    reply.send({ byTreatment, byPeriod });
  });

  app.get("/api/admin/export/:type", async (req, reply) => {
    if (!guard(req, reply)) return;

    const type = (req.params as any).type;
    const sessionId = (req.query as any).sessionId ? Number((req.query as any).sessionId) : undefined;

    if (type === "scans") {
      const csv = await exportScansCSV(sessionId);
      reply.header("Content-Type", "text/csv");
      reply.send(csv);
      return;
    }

    if (type === "participants") {
      const csv = await exportParticipantsCSV(sessionId);
      reply.header("Content-Type", "text/csv");
      reply.send(csv);
      return;
    }

    reply.code(400).send({ error: "unknown type" });
  });

  // Get all participants grouped by treatment
  app.get("/api/admin/participants", async (req, reply) => {
    if (!guard(req, reply)) return;

    const slot = Number((req.query as any).slot || process.env.SESSION_SLOT || "1");
    const session = await prisma.session.findFirst({ where: { slot }, orderBy: { id: "desc" } });
    
    if (!session) {
      return reply.send([]);
    }

    const participants = await prisma.participant.findMany({
      where: { sessionId: session.id },
      select: { 
        id: true, 
        publicCode: true, 
        treatment: true, 
        totalReports: true,
        isActive: true
      },
      orderBy: { createdAt: "asc" }
    });

    return reply.send(participants);
  });

  // Reset scores for entire treatment group
  app.post("/api/admin/reset-group", async (req, reply) => {
    if (!guard(req, reply)) return;

    const { treatment } = req.body as { treatment?: string };
    if (!treatment) {
      return reply.code(400).send({ error: "treatment is required" });
    }

    const slot = Number((req.query as any).slot || process.env.SESSION_SLOT || "1");
    const session = await prisma.session.findFirst({ where: { slot }, orderBy: { id: "desc" } });
    
    if (!session) {
      return reply.code(400).send({ error: "No active session found" });
    }

    const result = await prisma.participant.updateMany({
      where: {
        sessionId: session.id,
        treatment
      },
      data: {
        totalReports: 0
      }
    });

    return reply.send({ status: "ok", updated: result.count });
  });

  // Reset score for a specific user
  app.post("/api/admin/reset-user", async (req, reply) => {
    if (!guard(req, reply)) return;

    const { participantId } = req.body as { participantId?: string };
    if (!participantId) {
      return reply.code(400).send({ error: "participantId is required" });
    }

    const participant = await prisma.participant.update({
      where: { id: participantId },
      data: { totalReports: 0 },
      select: { id: true, publicCode: true, totalReports: true }
    });

    return reply.send({ status: "ok", participant });
  });

  // Set arbitrary score for a specific user
  app.post("/api/admin/set-score", async (req, reply) => {
    if (!guard(req, reply)) return;

    const { participantId, score } = req.body as { participantId?: string; score?: number };
    if (!participantId || score === undefined) {
      return reply.code(400).send({ error: "participantId and score are required" });
    }

    if (typeof score !== "number" || score < 0 || !Number.isInteger(score)) {
      return reply.code(400).send({ error: "score must be a non-negative integer" });
    }

    const participant = await prisma.participant.update({
      where: { id: participantId },
      data: { totalReports: score },
      select: { id: true, publicCode: true, totalReports: true }
    });

    return reply.send({ status: "ok", participant });
  });

  // Logout a specific user (admin only)
  app.post("/api/admin/logout-user", async (req, reply) => {
    if (!guard(req, reply)) return;

    const { participantId } = req.body as { participantId?: string };
    if (!participantId) {
      return reply.code(400).send({ error: "participantId is required" });
    }

    const participant = await prisma.participant.findUnique({ where: { id: participantId } });
    if (!participant) {
      return reply.code(404).send({ error: "Participant not found" });
    }

    await prisma.participant.update({
      where: { id: participantId },
      data: { isActive: false }
    });

    return reply.send({ status: "ok", participant: { id: participant.id, publicCode: participant.publicCode, isActive: false } });
  });
}