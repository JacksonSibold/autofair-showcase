import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make");
  const year = searchParams.get("year");

  if (!make) {
    return NextResponse.json({ error: "make is required" }, { status: 400 });
  }

  try {
    const encodedMake = encodeURIComponent(make);
    const url = year
      ? `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodedMake}/modelyear/${year}?format=json`
      : `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodedMake}?format=json`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
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
