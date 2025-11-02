import { prisma } from "./client.js";

async function main() {
  const sessionSlot = Number(process.env.SESSION_SLOT || "1");
  const issues: Array<{ id: string; sessionSlot: number }> = [];

  // Generate ISSUE_A01 to ISSUE_A15, ISSUE_B01 to ISSUE_B15, ISSUE_C01 to ISSUE_C15
  for (const letter of ['A', 'B', 'C']) {
    for (let i = 1; i <= 15; i++) {
      const id = `ISSUE_${letter}${String(i).padStart(2, '0')}`;
      issues.push({ id, sessionSlot });
    }
  }

  // Upsert all issues
  for (const issue of issues) {
    await prisma.issue.upsert({
      where: { id: issue.id },
      update: { sessionSlot: issue.sessionSlot },
      create: { id: issue.id, sessionSlot: issue.sessionSlot }
    });
  }
  
  console.log(`Seeded ${issues.length} issues (ISSUE_A01-ISSUE_A15, ISSUE_B01-ISSUE_B15, ISSUE_C01-ISSUE_C15) for session slot ${sessionSlot}`);
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
