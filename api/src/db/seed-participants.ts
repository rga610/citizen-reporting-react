import { prisma } from "./client.js";
import crypto from "node:crypto";

async function main() {
  const sessionSlot = Number(process.env.SESSION_SLOT || "1");
  
  // Get or create session
  let session = await prisma.session.findFirst({ 
    where: { slot: sessionSlot }, 
    orderBy: { id: "desc" } 
  });
  
  if (!session) {
    session = await prisma.session.create({ 
      data: { slot: sessionSlot, startTs: new Date() } 
    });
  }

  // List of nicknames (ensuring skinny_deer is included)
  const nicknames = [
    "skinny_deer",
    "quick_fox",
    "brave_lion",
    "wise_owl",
    "swift_hawk",
    "calm_bear",
    "bright_star",
    "wild_wolf",
    "gentle_dove",
    "strong_eagle",
    "silent_tiger",
    "curious_cat",
    "happy_dolphin",
    "proud_peacock",
    "graceful_swan",
    "bold_falcon",
    "peaceful_panda",
    "energetic_rabbit",
    "mysterious_raven",
    "clever_squirrel",
    "noble_stag",
    "playful_otter",
    "majestic_whale",
    "colorful_parrot",
    "determined_ant",
    "free_spirit",
    "bright_moon",
    "wandering_soul",
    "morning_light",
    "evening_breeze",
    "mountain_peak",
    "ocean_wave",
    "forest_path",
    "desert_wind",
    "river_flow",
    "cloud_dreamer",
    "sunset_watcher",
    "star_gazer",
    "night_owl",
    "dawn_breaker"
  ];

  const treatments = ["control", "competitive", "cooperative", "individual"];
  const participants: Array<{ id: string; username: string; treatment: string; sessionId: number }> = [];
  
  let nicknameIndex = 0;

  // Create 10 participants per treatment group
  for (const treatment of treatments) {
    for (let i = 0; i < 10; i++) {
      const id = crypto.randomUUID();
      const username = nicknames[nicknameIndex % nicknames.length];
      nicknameIndex++;
      
      participants.push({
        id,
        username,
        treatment,
        sessionId: session.id
      });
    }
  }

  // Create all participants (using createMany for efficiency)
  // Note: If participants already exist, you may want to delete them first or handle duplicates
  try {
    await prisma.participant.createMany({
      data: participants.map(p => ({
        id: p.id,
        username: p.username,
        treatment: p.treatment,
        sessionId: p.sessionId,
        totalReports: 0
      })),
      skipDuplicates: true // Skip if participant with same ID already exists
    });
  } catch (error) {
    console.error("Error creating participants:", error);
    throw error;
  }

  // Verify skinny_deer was created
  const skinnyDeer = await prisma.participant.findFirst({
    where: { username: "skinny_deer" }
  });

  console.log(`Seeded ${participants.length} participants (10 per treatment group) for session slot ${sessionSlot}`);
  console.log(`Treatments: ${treatments.join(", ")}`);
  if (skinnyDeer) {
    console.log(`✓ Verified: skinny_deer created with treatment: ${skinnyDeer.treatment}`);
  } else {
    console.warn(`⚠ Warning: skinny_deer not found after seeding`);
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});

