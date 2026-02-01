import { db } from "@/db";
import { crimeStatistics, dataSources } from "@/db/schema";

async function seed() {
  console.log("Seeding data...");

  // Seed Data Sources
  await db.insert(dataSources).values([
    {
      name: "National Police Agency of Mongolia",
      url: "https://police.gov.mn",
      description: "Aggregated annual crime statistics and regional safety reports.",
      lastUpdated: "2026-01-15",
    },
    {
      name: "National Statistics Office (NSO)",
      url: "https://1212.mn",
      description: "Official socio-economic data including judicial and crime indicators.",
      lastUpdated: "2025-12-01",
    },
  ]);

  // Seed Crime Statistics (Aggregated)
  const regions = [
    { code: "UB", name: "Ulaanbaatar", lat: 47.9188, lng: 106.9173 },
    { code: "DA", name: "Darkhan-Uul", lat: 49.4674, lng: 105.9568 },
    { code: "OR", name: "Orkhon", lat: 49.0306, lng: 104.0436 },
    { code: "SE", name: "Selenge", lat: 49.4658, lng: 106.2162 },
    { code: "DO", name: "Dornod", lat: 48.0645, lng: 114.5367 },
  ];

  const categories: ("theft" | "violence" | "child_related" | "other")[] = [
    "theft",
    "violence",
    "child_related",
    "other",
  ];

  const stats = [];
  for (const region of regions) {
    for (const year of [2022, 2023, 2024]) {
      for (const category of categories) {
        // Create 3 grid points per region to show heatmap distribution
        for (let i = 0; i < 3; i++) {
          stats.push({
            regionCode: region.code,
            regionName: region.name,
            year: year,
            crimeCategory: category,
            incidentCount: Math.floor(Math.random() * 200) + 10,
            latitude: region.lat + (Math.random() - 0.5) * 0.1,
            longitude: region.lng + (Math.random() - 0.5) * 0.1,
            source: "National Police Agency",
          });
        }
      }
    }
  }

  await db.insert(crimeStatistics).values(stats);

  console.log("Seeding completed successfully.");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
