import { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";

export default async function sseRoutes(app: FastifyInstance) {
  app.get("/api/sse/slot/:slot", async (req, reply) => {
    const slot = Number((req.params as any).slot);
    const pid = req.cookies?.["pid"];
    // Allow treatment to be passed as query param as fallback (useful if cookies aren't sent)
    const treatmentParam = (req.query as any)?.treatment;

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
      // Priority: 1) From participant lookup via cookie, 2) From query param fallback
      let treatment: string | undefined;
      if (pid) {
        const participant = await prisma.participant.findUnique({ where: { id: pid }, select: { treatment: true } });
        treatment = participant?.treatment;
        
        // Warn if query param treatment doesn't match cookie-based treatment (debugging aid)
        if (treatment && treatmentParam && treatment !== treatmentParam) {
          console.warn(`[SSE] Treatment mismatch: cookie=${treatment}, query=${treatmentParam} for pid=${pid}`);
        }
      }
      
      // Fallback: use treatment from query param if participant lookup failed
      if (!treatment && treatmentParam) {
        treatment = treatmentParam;
        console.log(`[SSE] Using treatment from query param: ${treatment} (cookie lookup failed)`);
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
      // CRITICAL: Only send competitive leaderboard if we have a valid treatment
      // If treatment is undefined, send empty array to prevent showing all participants
      let top: Array<{ publicCode: string; totalReports: number }> = [];
      let totalParticipantsInGroup = 0;
      let userRank: number | undefined;
      let userScore: number | undefined;

      if (treatment) {
        // Get ALL participants in the treatment group (not just top 5) so users can see their position
        const allParticipantsInGroup = await prisma.participant.findMany({
          where: {
            sessionId: session.id,
            treatment
          },
          select: { id: true, publicCode: true, totalReports: true },
          orderBy: { totalReports: "desc" }
        });

        // Use all participants for the leaderboard
        top = allParticipantsInGroup.map(p => ({
          publicCode: p.publicCode,
          totalReports: p.totalReports
        }));

        // Get total participants in the user's treatment group
        totalParticipantsInGroup = allParticipantsInGroup.length;

        // Get user's rank and score
        if (pid) {
          const userIndex = allParticipantsInGroup.findIndex(p => p.id === pid);
          if (userIndex !== -1) {
            userRank = userIndex + 1;
            userScore = allParticipantsInGroup[userIndex].totalReports;
          }
        }
      } else {
        // No treatment found - this shouldn't happen for logged-in users
        // But we'll log it and send empty data to prevent showing wrong group
        if (pid) {
          console.warn(`[SSE] No treatment found for participant ${pid}`);
        }
      }

      const period = Math.floor((Date.now() - session.startTs.getTime()) / 1000 / 900);

      // Send cooperative progress - only counts cooperative group's reports
      reply.raw.write(`data: ${JSON.stringify({ type: "coop", found: cooperativeFound, total })}\n\n`);
      reply.raw.write(`data: ${JSON.stringify({ type: "comp", top, totalParticipantsInGroup, userRank, userScore })}\n\n`);
      
      // Send individual score update if we have a participant ID
      if (pid) {
        const individualParticipant = await prisma.participant.findUnique({ 
          where: { id: pid }, 
          select: { totalReports: true, treatment: true } 
        });
        if (individualParticipant) {
          reply.raw.write(`data: ${JSON.stringify({ type: "individual", myCount: individualParticipant.totalReports })}\n\n`);
        }
      }
      
      reply.raw.write(`data: ${JSON.stringify({ type: "period", id: period })}\n\n`);
    }, 250); // Reduced from 1000ms to 250ms for faster real-time updates

    req.raw.on("close", () => clearInterval(timer));
  });
}