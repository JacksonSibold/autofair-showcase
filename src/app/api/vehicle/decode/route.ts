import { NextRequest, NextResponse } from "next/server";
import type { VehicleDecodeResult } from "@/types";
import { isValidVin, parseMakeName, parseModelYear } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get("vin");
  const make = searchParams.get("make");
  const model = searchParams.get("model");
  const year = searchParams.get("year");

  if (vin) {
    return decodeVin(vin.toUpperCase());
  }
  if (make && year) {
    const parsedMake = parseMakeName(make);
    const parsedYear = parseModelYear(year);
    if (!parsedMake || !parsedYear) {
      return NextResponse.json({ error: "Invalid make or year" }, { status: 400 });
    }
    return lookupMakeModel(parsedMake, model?.trim() || null, String(parsedYear));
  }

  return NextResponse.json({ error: "Provide either vin or make+year" }, { status: 400 });
}

async function decodeVin(vin: string): Promise<NextResponse> {
  if (!isValidVin(vin)) {
    return NextResponse.json({ error: "Invalid VIN format" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.error("[nhtsa] VIN decode failed with status", res.status);
      return NextResponse.json({ error: "VIN decoding service unavailable" }, { status: 502 });
    }
    const data = await res.json();
    const r = data.Results?.[0];
    if (!r) {
      return NextResponse.json({ error: "VIN not found" }, { status: 404 });
    }

    const result: VehicleDecodeResult = {
      vin,
      year: parseInt(r.ModelYear) || 0,
      make: r.Make || "",
      model: r.Model || "",
      trim: r.Trim || null,
      engine: r.DisplacementL ? `${r.DisplacementL}L ${r.FuelTypePrimary}` : null,
      transmission: r.TransmissionStyle || null,
      drivetrain: r.DriveType || null,
      body_style: r.BodyClass || null,
      exterior_color: null,
      interior_color: null,
      fuel_type: r.FuelTypePrimary || null,
      cylinders: parseInt(r.EngineCylinders) || null,
      displacement: r.DisplacementL ? `${r.DisplacementL}L` : null,
      plant_city: r.PlantCity || null,
      plant_country: r.PlantCountry || null,
      errors: r.ErrorText ? [r.ErrorText] : [],
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to decode VIN" }, { status: 500 });
  }
}

async function lookupMakeModel(
  make: string,
  model: string | null,
  year: string
): Promise<NextResponse> {
  try {
    const encodedMake = encodeURIComponent(make);
    const url = model
      ? `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodedMake}/modelyear/${year}?format=json`
      : `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodedMake}?format=json`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      console.error("[nhtsa] make/model lookup failed with status", res.status);
      return NextResponse.json({ error: "Vehicle lookup service unavailable" }, { status: 502 });
    }
    const data = await res.json();

    const models = (data.Results || []).map((r: Record<string, string>) => ({
      make: r.Make_Name,
      model: r.Model_Name,
      id: r.Model_ID,
    }));

    return NextResponse.json({ make, year, models });
  } catch {
    return NextResponse.json({ error: "Failed to lookup vehicle" }, { status: 500 });
  }
}
