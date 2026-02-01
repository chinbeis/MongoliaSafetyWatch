import { db } from "@/db";
import { crimeStatistics } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const statsByRegion = await db
      .select({
        regionCode: crimeStatistics.regionCode,
        regionName: crimeStatistics.regionName,
        totalIncidents: sql<number>`cast(sum(${crimeStatistics.incidentCount}) as integer)`,
      })
      .from(crimeStatistics)
      .groupBy(crimeStatistics.regionCode, crimeStatistics.regionName)
      .orderBy(crimeStatistics.regionName);

    return NextResponse.json(statsByRegion);
  } catch (error) {
    console.error("Failed to fetch regional stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
