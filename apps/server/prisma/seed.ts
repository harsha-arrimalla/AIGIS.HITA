/**
 * Prisma Seed Script
 *
 * Seeds safety zones, fare benchmarks, scam alerts, emergency contacts,
 * and emotional scripts into the database from city JSON files.
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface CityJSON {
  city: string;
  emergencyNumbers: Record<string, string>;
  safetyZones: Array<{
    area: string;
    safetyScore: number;
    dayScore: number;
    nightScore: number;
    notes: string;
  }>;
  fareBenchmarks: Array<{
    from: string;
    to: string;
    mode: string;
    expectedFareMin: number;
    expectedFareMax: number;
    currency: string;
    notes?: string;
  }>;
  scamAlerts: Array<{
    type: string;
    area: string;
    description: string;
    severity: string;
  }>;
}

async function seedCity(filename: string) {
  const filePath = join(__dirname, "..", "src", "data", "cities", filename);
  const raw = readFileSync(filePath, "utf-8");
  const data: CityJSON = JSON.parse(raw);

  console.log(`Seeding ${data.city}...`);

  // Safety zones
  for (const zone of data.safetyZones) {
    await prisma.safetyZone.upsert({
      where: { city_area: { city: data.city, area: zone.area } },
      update: {
        safetyScore: zone.safetyScore,
        dayScore: zone.dayScore,
        nightScore: zone.nightScore,
        notes: zone.notes,
      },
      create: {
        city: data.city,
        area: zone.area,
        safetyScore: zone.safetyScore,
        dayScore: zone.dayScore,
        nightScore: zone.nightScore,
        notes: zone.notes,
      },
    });
  }
  console.log(`  ✓ ${data.safetyZones.length} safety zones`);

  // Fare benchmarks
  for (const fare of data.fareBenchmarks) {
    await prisma.fareBenchmark.create({
      data: {
        city: data.city,
        fromArea: fare.from,
        toArea: fare.to,
        mode: fare.mode,
        expectedFareMin: fare.expectedFareMin,
        expectedFareMax: fare.expectedFareMax,
        currency: fare.currency,
      },
    });
  }
  console.log(`  ✓ ${data.fareBenchmarks.length} fare benchmarks`);

  // Scam alerts
  for (const scam of data.scamAlerts) {
    await prisma.scamAlert.create({
      data: {
        city: data.city,
        type: scam.type,
        area: scam.area,
        description: scam.description,
        severity: scam.severity.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
      },
    });
  }
  console.log(`  ✓ ${data.scamAlerts.length} scam alerts`);

  // Emergency contacts
  for (const [service, number] of Object.entries(data.emergencyNumbers)) {
    await prisma.emergencyContact.create({
      data: {
        city: data.city,
        service: service.replace(/_/g, " "),
        number,
      },
    });
  }
  console.log(`  ✓ ${Object.keys(data.emergencyNumbers).length} emergency contacts`);
}

async function seedAffirmations() {
  console.log("Seeding affirmations...");

  const affirmations = [
    { category: "scared", text: "You are safe. Take a deep breath. You've handled tough situations before.", language: "en" },
    { category: "scared", text: "Fear is temporary. You have the strength to get through this moment.", language: "en" },
    { category: "anxious", text: "It's okay to feel overwhelmed. Take things one step at a time.", language: "en" },
    { category: "anxious", text: "This feeling will pass. Focus on what you can control right now.", language: "en" },
    { category: "lonely", text: "Being alone doesn't mean being unsafe. You have connections, even at a distance.", language: "en" },
    { category: "lonely", text: "Missing home is natural. It means you have people who matter to you.", language: "en" },
    { category: "frustrated", text: "It's okay to feel frustrated. Let's find a way to make this better.", language: "en" },
    { category: "general", text: "You're doing great navigating this new place. Give yourself credit.", language: "en" },
    { category: "general", text: "Every journey has bumps. What matters is you're moving forward.", language: "en" },
  ];

  for (const aff of affirmations) {
    await prisma.affirmation.create({ data: aff });
  }
  console.log(`  ✓ ${affirmations.length} affirmations`);
}

async function seedEmotionalScripts() {
  console.log("Seeding emotional scripts...");

  const scripts = [
    { trigger: "panic_attack", response: "Let's ground you right now. Tell me 5 things you can see around you.", category: "crisis", priority: 10 },
    { trigger: "feeling_unsafe", response: "Your safety is the priority. Let's find you a well-lit, busy place nearby.", category: "safety", priority: 9 },
    { trigger: "homesick", response: "Missing home is completely natural, especially when things feel unfamiliar. Want to talk about it, or would you like me to help you find something comforting nearby?", category: "comfort", priority: 5 },
    { trigger: "lost", response: "Don't worry — let's figure out where you are and get you oriented. Can you share your location or tell me what you see around you?", category: "navigation", priority: 8 },
    { trigger: "scammed", response: "I'm sorry that happened. Let's document what happened and figure out your next steps. Don't blame yourself — scammers are professionals.", category: "support", priority: 7 },
  ];

  for (const script of scripts) {
    await prisma.emotionalScript.create({ data: script });
  }
  console.log(`  ✓ ${scripts.length} emotional scripts`);
}

async function main() {
  console.log("🌱 Starting seed...\n");

  // Clear existing data (safe for dev, controlled for prod)
  await prisma.fareBenchmark.deleteMany();
  await prisma.scamAlert.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.affirmation.deleteMany();
  await prisma.emotionalScript.deleteMany();
  // Don't delete safety zones — upsert handles them

  // Seed cities
  await seedCity("hyderabad.json");
  await seedCity("delhi.json");
  await seedCity("bangalore.json");

  // Seed emotional support data
  await seedAffirmations();
  await seedEmotionalScripts();

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
