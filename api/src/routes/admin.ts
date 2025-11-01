import { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";
import { exportScansCSV, exportParticipantsCSV } from "../utils/csv-export.js";

function guard(req: any, reply: any) {
  const token = req.headers["x-admin-token"] || req.query.token;
  if (token !== process.env.ADMIN_TOKEN) {
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
}