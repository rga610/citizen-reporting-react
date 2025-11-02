import { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";

export default async function sseRoutes(app: FastifyInstance) {
  app.get("/api/sse/slot/:slot", async (req, reply) => {
    const slot = Number((req.params as any).slot);
    const pid = req.cookies?.["pid"];

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": req.headers.origin || "*",
      "Access-Control-Allow-Credentials": "true"
    });

    const timer = setInterval(async () => {
      const session = await prisma.session.findFirst({ where: { slot }, orderBy: { id: "desc" } });
      if (!session) return;

      // Get participant's treatment to filter data by group
      let treatment: string | undefined;
      if (pid) {
        const participant = await prisma.participant.findUnique({ where: { id: pid }, select: { treatment: true } });
        treatment = participant?.treatment;
      }

      // Calculate cooperative group progress - ONLY count scans from cooperative participants
      // This is critical for experiment integrity: each group must see only their own progress
      const cooperativeParticipants = await prisma.participant.findMany({
        where: {
          sessionId: session.id,
          treatment: "cooperative"
        },
        select: { id: true }
      });
      const cooperativeParticipantIds = cooperativeParticipants.map(p => p.id);

      // Count distinct issues found ONLY by cooperative group members
      // If no cooperative participants exist yet, found count is 0
      let cooperativeFound = 0;
      if (cooperativeParticipantIds.length > 0) {
        const cooperativeDistinctScans = await prisma.scan.findMany({
          where: {
            sessionId: session.id,
            participantId: { in: cooperativeParticipantIds }
          },
          select: { issueId: true },
          distinct: ["issueId"]
        });
        cooperativeFound = cooperativeDistinctScans.length;
      }

      // Total issues is global (all issues available for the session)
      const total = await prisma.issue.count({ where: { sessionSlot: slot } });

      // Filter leaderboard by treatment group (users only see their own group)
      const top = await prisma.participant.findMany({
        where: { 
          sessionId: session.id,
          ...(treatment ? { treatment } : {})
        },
        select: { publicCode: true, totalReports: true },
        orderBy: { totalReports: "desc" },
        take: 5
      });

      // Get total participants in the user's treatment group
      const totalParticipantsInGroup = await prisma.participant.count({
        where: {
          sessionId: session.id,
          ...(treatment ? { treatment } : {})
        }
      });

      // Get user's rank and score if they're not in top 5
      let userRank: number | undefined;
      let userScore: number | undefined;
      if (pid && treatment) {
        const allParticipantsInGroup = await prisma.participant.findMany({
          where: {
            sessionId: session.id,
            treatment
          },
          select: { id: true, publicCode: true, totalReports: true },
          orderBy: { totalReports: "desc" }
        });
        const userIndex = allParticipantsInGroup.findIndex(p => p.id === pid);
        if (userIndex !== -1) {
          userRank = userIndex + 1;
          userScore = allParticipantsInGroup[userIndex].totalReports;
        }
      }

      const period = Math.floor((Date.now() - session.startTs.getTime()) / 1000 / 900);

      // Send cooperative progress - only counts cooperative group's reports
      reply.raw.write(`data: ${JSON.stringify({ type: "coop", found: cooperativeFound, total })}\n\n`);
      reply.raw.write(`data: ${JSON.stringify({ type: "comp", top, totalParticipantsInGroup, userRank, userScore })}\n\n`);
      reply.raw.write(`data: ${JSON.stringify({ type: "period", id: period })}\n\n`);
    }, 1000);

    req.raw.on("close", () => clearInterval(timer));
  });
}