import { NextRequest, NextResponse } from "next/server";
import { parseMakeName, parseModelYear } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const make = parseMakeName(searchParams.get("make"));
  const yearParam = searchParams.get("year");

  if (!make) {
    return NextResponse.json({ error: "A valid make is required" }, { status: 400 });
  }

  let year: string | null = null;
  if (yearParam) {
    const parsedYear = parseModelYear(yearParam);
    if (!parsedYear) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    year = String(parsedYear);
  }

  try {
    const encodedMake = encodeURIComponent(make);
    const url = year
      ? `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodedMake}/modelyear/${year}?format=json`
      : `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodedMake}?format=json`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      console.error("[nhtsa] model list failed with status", res.status);
      return NextResponse.json({ error: "Model list service unavailable" }, { status: 502 });
    }
    const data = await res.json();

    const models = [
      ...new Set(
        (data.Results || [])
          .map((r: Record<string, string>) => r.Model_Name)
          .filter(Boolean)
          .sort()
      ),
    ];

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
