import type { Dealership } from "@/types";

interface DealerSearchParams {
  make: string;
  model: string;
  year: number;
  user_zip: string;
  radius_miles: number;
  willing_to_ship: boolean;
  vin?: string;
}

interface DealerWithInventory extends Dealership {
  has_target_in_stock: boolean;
  listed_price?: number;
  listing_url?: string;
  vin?: string;
}

async function searchMarketCheckDealers(
  params: DealerSearchParams
): Promise<DealerWithInventory[]> {
  const apiKey = process.env.MARKETCHECK_API_KEY;
  if (!apiKey || apiKey.startsWith("REPLACE")) {
    return getMockDealers(params);
  }

  const qp = new URLSearchParams({
    api_key: apiKey,
    ymm: `${params.year}|${params.make}|${params.model}`,
    car_type: "new",
    zip: params.user_zip,
    radius: String(params.radius_miles),
    rows: "30",
    fields: "dealer.name,dealer.city,dealer.state,dealer.zip,dealer.phone,dealer.website,dealer.latitude,dealer.longitude,price,vin,vdp_url,miles",
  });

  try {
    const res = await fetch(
      `https://mc-api.marketcheck.com/v2/search/car/active?${qp}`
    );
    const data = await res.json();

    const seen = new Set<string>();
    const dealers: DealerWithInventory[] = [];

    for (const listing of data.listings ?? []) {
      const d = listing.dealer;
      const key = d?.name + d?.zip;
      if (!d?.name || seen.has(key)) continue;
      seen.add(key);

      dealers.push({
        id: crypto.randomUUID(),
        name: d.name,
        address: d.street ?? null,
        city: d.city ?? null,
        state: d.state ?? null,
        zip: d.zip ?? null,
        phone: d.phone ?? null,
        email: d.email ?? null,
        website: d.website ?? null,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
        distance_from_user_miles: listing.distance ?? null,
        created_at: new Date().toISOString(),
        has_target_in_stock: true,
        listed_price: listing.price,
        listing_url: listing.vdp_url,
        vin: listing.vin,
      });
    }

    // Sort: in-stock + in-radius first
    return dealers.sort((a, b) => {
      if (a.has_target_in_stock && !b.has_target_in_stock) return -1;
      if (!a.has_target_in_stock && b.has_target_in_stock) return 1;
      return (a.distance_from_user_miles ?? 999) - (b.distance_from_user_miles ?? 999);
    });
  } catch {
    return getMockDealers(params);
  }
}

function getMockDealers(params: DealerSearchParams): DealerWithInventory[] {
  // Return placeholder dealers when no API key — will be replaced by real data
  return [
    {
      id: crypto.randomUUID(),
      name: `${params.make} of Downtown`,
      address: "1234 Auto Row",
      city: "Dallas",
      state: "TX",
      zip: params.user_zip,
      phone: "555-0101",
      email: null,
      website: null,
      latitude: null,
      longitude: null,
      distance_from_user_miles: 12,
      created_at: new Date().toISOString(),
      has_target_in_stock: true,
      listed_price: undefined,
    },
    {
      id: crypto.randomUUID(),
      name: `Metro ${params.make}`,
      address: "5678 Dealer Blvd",
      city: "Fort Worth",
      state: "TX",
      zip: "76101",
      phone: "555-0202",
      email: null,
      website: null,
      latitude: null,
      longitude: null,
      distance_from_user_miles: 28,
      created_at: new Date().toISOString(),
      has_target_in_stock: true,
      listed_price: undefined,
    },
  ];
}

export async function findDealers(
  params: DealerSearchParams
): Promise<DealerWithInventory[]> {
  const local = await searchMarketCheckDealers(params);

  if (params.willing_to_ship && local.length < 10) {
    // Also search nationwide
    const nationwide = await searchMarketCheckDealers({
      ...params,
      radius_miles: 1500,
    });
    const localIds = new Set(local.map((d) => d.name + d.zip));
    const extra = nationwide
      .filter((d) => !localIds.has(d.name + d.zip))
      .slice(0, 10);
    return [...local, ...extra];
  }

  return local.slice(0, 20);
}
