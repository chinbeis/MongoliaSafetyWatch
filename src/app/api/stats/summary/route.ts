import { db } from "@/db";
import { crimeStatistics } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const summary = await db
      .select({
        totalIncidents: sql<number>`cast(sum(${crimeStatistics.incidentCount}) as integer)`,
        year: crimeStatistics.year,
      })
      .from(crimeStatistics)
      .groupBy(crimeStatistics.year)
      .orderBy(sql`${crimeStatistics.year} desc`)
      .limit(1);

    return NextResponse.json(summary[0] || { totalIncidents: 0, year: new Date().getFullYear() });
  } catch (error) {
    console.error("Failed to fetch summary:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
