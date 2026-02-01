import { db } from "@/db";
import { dataSources } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sources = await db
      .select()
      .from(dataSources)
      .orderBy(dataSources.name);

    return NextResponse.json(sources);
  } catch (error) {
    console.error("Failed to fetch data sources:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
