import { prisma } from "../db/client.js";

export async function exportScansCSV(sessionId?: number) {
  const rows = await prisma.scan.findMany({
    where: sessionId ? { sessionId } : undefined,
    orderBy: { ts: "asc" }
  });
  const header = "id,participant_id,treatment,issue_id,session_id,period_id,lat,lon,accuracy,ts";
  const lines = rows.map(r => [
    r.id, r.participantId, r.treatment, r.issueId, r.sessionId, r.periodId,
    r.lat ?? "", r.lon ?? "", r.accuracy ?? "", r.ts.toISOString()
  ].join(","));
  return [header, ...lines].join("\n");
}

export async function exportParticipantsCSV(sessionId?: number) {
  const rows = await prisma.participant.findMany({
    where: sessionId ? { sessionId } : undefined,
    orderBy: { createdAt: "asc" }
  });
  const header = "id,public_code,treatment,session_id,total_reports,created_at";
  const lines = rows.map(r => [
    r.id, r.publicCode, r.treatment, r.sessionId, r.totalReports, r.createdAt.toISOString()
  ].join(","));
  return [header, ...lines].join("\n");
}