import { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";

export default async function sseRoutes(app: FastifyInstance) {
  app.get("/api/sse/slot/:slot", async (req, reply) => {
    const slot = Number((req.params as any).slot);

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    const timer = setInterval(async () => {
      const session = await prisma.session.findFirst({ where: { slot }, orderBy: { id: "desc" } });
      if (!session) return;

      const distinct = await prisma.scan.findMany({ where: { sessionId: session.id }, select: { issueId: true }, distinct: ["issueId"] });
      const found = distinct.length;
      const total = await prisma.issue.count({ where: { sessionSlot: slot } });

      const top = await prisma.participant.findMany({
        where: { sessionId: session.id },
        select: { publicCode: true, totalReports: true },
        orderBy: { totalReports: "desc" },
        take: 5
      });

      const period = Math.floor((Date.now() - session.startTs.getTime()) / 1000 / 900);

      reply.raw.write(`data: ${JSON.stringify({ type: "coop", found, total })}\n\n`);
      reply.raw.write(`data: ${JSON.stringify({ type: "comp", top })}\n\n`);
      reply.raw.write(`data: ${JSON.stringify({ type: "period", id: period })}\n\n`);
    }, 1000);

    req.raw.on("close", () => clearInterval(timer));
  });
}