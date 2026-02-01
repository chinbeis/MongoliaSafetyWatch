import { db } from "@/db";
import { crimeStatistics } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const statsByYear = await db
      .select({
        year: crimeStatistics.year,
        totalIncidents: sql<number>`cast(sum(${crimeStatistics.incidentCount}) as integer)`,
      })
      .from(crimeStatistics)
      .groupBy(crimeStatistics.year)
      .orderBy(crimeStatistics.year);

    return NextResponse.json(statsByYear);
  } catch (error) {
    console.error("Failed to fetch yearly stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
