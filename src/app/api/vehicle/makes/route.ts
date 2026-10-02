import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json",
      { next: { revalidate: 604800 } } // cache 1 week
    );
    const data = await res.json();
    const makes = (data.Results || [])
      .map((r: Record<string, string>) => r.MakeName)
      .filter(Boolean)
      .sort();

    return NextResponse.json({ makes });
  } catch {
    return NextResponse.json({ error: "Failed to fetch makes" }, { status: 500 });
  }
}
