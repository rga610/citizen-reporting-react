import { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";
import { reportSchema } from "../utils/validation.js";

export default async function reportRoutes(app: FastifyInstance) {
  app.post("/api/report", async (req, reply) => {
    // participant identification via cookie
    const pid = req.cookies["pid"];
    if (!pid) return reply.code(401).send({ error: "no participant" });

    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "bad payload" });

    const { issue_id, lat, lon, accuracy } = parsed.data;
    const envSlot = Number(process.env.SESSION_SLOT || "1");

    const issue = await prisma.issue.findUnique({ where: { id: issue_id } });
    if (!issue || issue.sessionSlot !== envSlot) {
      return reply.send({ status: "invalid", message: "Unknown issue" });
    }

    const part = await prisma.participant.findUnique({ where: { id: pid } });
    if (!part) return reply.code(401).send({ error: "no participant" });

    const dup = await prisma.scan.findFirst({
      where: { participantId: pid, issueId: issue_id }
    });
    if (dup) return reply.send({ status: "duplicate", message: "Already reported" });

    // session start
    let session = await prisma.session.findFirst({ where: { slot: envSlot }, orderBy: { id: "desc" } });
    if (!session) {
      session = await prisma.session.create({ data: { slot: envSlot, startTs: new Date() } });
    }

    const period = Math.floor((Date.now() - session.startTs.getTime()) / 1000 / 900);

    await prisma.scan.create({
      data: {
        participantId: pid,
        treatment: part.treatment,
        issueId: issue_id,
        sessionId: session.id,
        periodId: period,
        lat, lon, accuracy
      }
    });

    // increment participant
    const updated = await prisma.participant.update({
      where: { id: pid },
      data: { totalReports: { increment: 1 } }
    });

    // treatment feedback
    if (part.treatment === "control") {
      return reply.send({ status: "ok", treatment: part.treatment, feedback: { message: "Report received", period_id: period } });
    }

    if (part.treatment === "individual") {
      return reply.send({ status: "ok", treatment: part.treatment, feedback: { myCount: updated.totalReports, period_id: period } });
    }

    if (part.treatment === "cooperative") {
      // CRITICAL: Only count scans from cooperative group members
      // This ensures experiment integrity - each group sees only their own progress
      const cooperativeParticipants = await prisma.participant.findMany({
        where: {
          sessionId: session.id,
          treatment: "cooperative"
        },
        select: { id: true }
      });
      const cooperativeParticipantIds = cooperativeParticipants.map((p: { id: string }) => p.id);

      // Count distinct issues found ONLY by cooperative group members
      // If no cooperative participants exist yet, found count is 0
      let found = 0;
      if (cooperativeParticipantIds.length > 0) {
        const cooperativeDistinctScans = await prisma.scan.findMany({
          where: {
            sessionId: session.id,
            participantId: { in: cooperativeParticipantIds }
          },
          select: { issueId: true },
          distinct: ["issueId"]
        });
        found = cooperativeDistinctScans.length;
      }
      const total = await prisma.issue.count({ where: { sessionSlot: envSlot } });
      return reply.send({ status: "ok", treatment: part.treatment, feedback: { found, total, period_id: period } });
    }

    if (part.treatment === "competitive") {
      const top = await prisma.participant.findMany({
        where: { 
          sessionId: session.id,
          treatment: part.treatment // Filter by treatment group
        },
        select: { publicCode: true, totalReports: true },
        orderBy: { totalReports: "desc" },
        take: 5
      });
      return reply.send({ status: "ok", treatment: part.treatment, feedback: { leaderboard: top, period_id: period } });
    }

    return reply.send({ status: "ok", treatment: part.treatment });
  });
}