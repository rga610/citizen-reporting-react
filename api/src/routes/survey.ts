import { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";

export default async function surveyRoutes(app: FastifyInstance) {
  app.post("/api/survey", async (req, reply) => {
    // Placeholder: store raw JSON to a table if you add it to Prisma
    reply.send({ status: "ok" });
  });
}