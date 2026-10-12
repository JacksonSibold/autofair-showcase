import type { PricingResult, ComparableListing, OEMIncentive } from "@/types";

interface PricingParams {
  make: string;
  model: string;
  year: number;
  trim?: string;
  condition: "new" | "used" | "certified";
  mileage?: number;
  zip?: string;
  vin?: string;
  color?: string;
}

// MarketCheck API integration
async function fetchMarketCheckListings(params: PricingParams): Promise<{
  listings: ComparableListing[];
  nationwide_count: number;
  regional_count: number;
}> {
  const apiKey = process.env.MARKETCHECK_API_KEY;
  if (!apiKey || apiKey.startsWith("REPLACE")) {
    return { listings: [], nationwide_count: 0, regional_count: 0 };
  }

  const base = "https://mc-api.marketcheck.com/v2";
  const queryParams = new URLSearchParams({
    api_key: apiKey,
    year: String(params.year),
    make: params.make,
    model: params.model,
    car_type: params.condition === "new" ? "new" : "used",
    rows: "50",
    start: "0",
  });

  if (params.zip) {
    queryParams.set("zip", params.zip);
    queryParams.set("radius", "200");
  }
  if (params.trim) queryParams.set("trim", params.trim);

  try {
    const res = await fetch(`${base}/search/car/active?${queryParams}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[MarketCheck] listing search failed with status", res.status);
      return { listings: [], nationwide_count: 0, regional_count: 0 };
    }
    const data = await res.json();
    console.log("[MarketCheck] status:", res.status, "num_found:", data.num_found, "listings:", data.listings?.length ?? 0);

    const listings: ComparableListing[] = (data.listings || []).map(
      (l: Record<string, unknown>) => ({
        vin: l.vin as string,
        price: l.price as number,
        mileage: l.miles as number,
        year: params.year,
        make: params.make,
        model: params.model,
        trim: l.trim as string,
        color: l.exterior_color as string,
        dealer_name: (l.dealer as Record<string, string>)?.name,
        dealer_city: (l.dealer as Record<string, string>)?.city,
        dealer_state: (l.dealer as Record<string, string>)?.state,
        distance_miles: l.distance as number,
        days_on_market: l.dom as number,
      })
    );

    return {
      listings,
      nationwide_count: data.totalCount || listings.length,
      regional_count: listings.filter(
        (l) => (l.distance_miles ?? 999) <= 100
      ).length,
    };
  } catch {
    return { listings: [], nationwide_count: 0, regional_count: 0 };
  }
}

// Fallback: estimate pricing from NHTSA + heuristics when no API key
function estimatePricingFromHeuristics(params: PricingParams): Partial<PricingResult> {
  // Base MSRP estimates by segment — rough heuristics
  const segmentMSRP: Record<string, number> = {
    // Compact SUVs
    rav4: 30000, "cr-v": 31000, "escape": 28000, tucson: 27000, rogue: 29000,
    // Full-size trucks
    "f-150": 38000, silverado: 38000, ram: 39000, tundra: 40000,
    // Sedans
    camry: 27000, accord: 29000, altima: 25000, sonata: 26000,
    // EVs
    "model 3": 42000, "model y": 48000, "bolt ev": 28000,
    // Default
    default: 32000,
  };

  const modelKey = params.model.toLowerCase();
  const baseMSRP =
    segmentMSRP[modelKey] ||
    Object.entries(segmentMSRP).find(([k]) => modelKey.includes(k))?.[1] ||
    segmentMSRP.default;

  // Adjust for year
  const currentYear = new Date().getFullYear();
  const yearAdj = (params.year - currentYear) * 500;
  const msrp = baseMSRP + yearAdj;

  // Used car depreciation
  const ageFactor = params.condition === "new" ? 1 : 0.82;
  const mileageFactor =
    params.mileage && params.mileage > 0
      ? Math.max(0.6, 1 - params.mileage / 200000)
      : 0.85;

  const retail = Math.round(msrp * ageFactor * mileageFactor);
  const fair = Math.round(retail * 0.96);
  const great = Math.round(retail * 0.91);
  const trade = Math.round(retail * 0.82);
  const auction = Math.round(retail * 0.78);

  return {
    msrp: params.condition === "new" ? msrp : null,
    invoice_price: params.condition === "new" ? Math.round(msrp * 0.94) : null,
    retail_price: retail,
    fair_price: fair,
    great_deal_price: great,
    trade_in_value: trade,
    auction_price: auction,
    regional_avg: Math.round(fair * 1.02),
    nationwide_avg: Math.round(fair * 1.01),
    price_range_low: great,
    price_range_high: Math.round(retail * 1.03),
  };
}

export function calcColorRarity(color: string | undefined, listings: ComparableListing[]): number {
  if (!color || listings.length === 0) return 0.5;
  const norm = color.toLowerCase();
  const matching = listings.filter((l) =>
    l.color?.toLowerCase().includes(norm)
  ).length;
  const ratio = matching / listings.length;
  // Invert: lower availability = higher rarity score
  return Math.round((1 - ratio) * 100) / 100;
}

export function calcStats(prices: number[]): {
  avg: number;
  low: number;
  high: number;
  p10: number;
} {
  if (prices.length === 0) return { avg: 0, low: 0, high: 0, p10: 0 };
  const sorted = [...prices].sort((a, b) => a - b);
  const avg = Math.round(sorted.reduce((s, p) => s + p, 0) / sorted.length);
  return {
    avg,
    low: sorted[0],
    high: sorted[sorted.length - 1],
    p10: sorted[Math.floor(sorted.length * 0.1)] ?? sorted[0],
  };
}

async function fetchOEMIncentives(
  make: string,
  model: string,
  year: number,
  zip?: string
): Promise<OEMIncentive[]> {
  // MarketCheck incentives endpoint (if key available)
  const apiKey = process.env.MARKETCHECK_API_KEY;
  if (!apiKey || apiKey.startsWith("REPLACE")) return [];

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      make,
      model,
      year: String(year),
    });
    if (zip) params.set("zip", zip);
    const res = await fetch(
      `https://mc-api.marketcheck.com/v2/incentives?${params}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      console.error("[MarketCheck] incentives lookup failed with status", res.status);
      return [];
    }
    const data = await res.json();
    return (data.incentives || []).map((inc: Record<string, unknown>) => ({
      name: inc.name as string,
      amount: inc.amount as number,
      expiry: inc.end_date as string,
      type: (inc.type as string)?.includes("lease")
        ? "lease"
        : (inc.type as string)?.includes("finance")
        ? "financing"
        : "rebate",
    }));
  } catch {
    return [];
  }
}

export async function getPricing(params: PricingParams): Promise<PricingResult> {
  const [marketData, incentives] = await Promise.all([
    fetchMarketCheckListings(params),
    params.condition === "new"
      ? fetchOEMIncentives(params.make, params.model, params.year, params.zip)
      : Promise.resolve([]),
  ]);

  const heuristics = estimatePricingFromHeuristics(params);

  let fair_price = heuristics.fair_price!;
  let great_deal_price = heuristics.great_deal_price!;
  let retail_price = heuristics.retail_price!;
  let regional_avg = heuristics.regional_avg!;
  let nationwide_avg = heuristics.nationwide_avg!;
  let price_range_low = heuristics.price_range_low!;
  let price_range_high = heuristics.price_range_high!;

  if (marketData.listings.length >= 5) {
    const prices = marketData.listings.map((l) => l.price).filter((p) => p > 0);
    const stats = calcStats(prices);

    nationwide_avg = stats.avg;
    fair_price = Math.round(stats.avg * 0.97);
    great_deal_price = stats.p10;
    retail_price = heuristics.retail_price ?? stats.avg;
    price_range_low = stats.low;
    price_range_high = stats.high;

    const regional = marketData.listings.filter(
      (l) => (l.distance_miles ?? 999) <= 100
    );
    regional_avg =
      regional.length >= 3
        ? Math.round(
            regional.reduce((s, l) => s + l.price, 0) / regional.length
          )
        : nationwide_avg;
  }

  const totalRebates = incentives
    .filter((i) => i.type === "rebate")
    .reduce((s, i) => s + i.amount, 0);

  const colorRarity = calcColorRarity(params.color, marketData.listings);
  const daysOnMarketAvg =
    marketData.listings.length > 0
      ? Math.round(
          marketData.listings
            .filter((l) => l.days_on_market)
            .reduce((s, l) => s + (l.days_on_market ?? 0), 0) /
            Math.max(
              1,
              marketData.listings.filter((l) => l.days_on_market).length
            )
        )
      : 30;

  const confidence: "high" | "medium" | "low" =
    marketData.listings.length >= 20
      ? "high"
      : marketData.listings.length >= 5
      ? "medium"
      : "low";

  return {
    fair_price: fair_price - totalRebates,
    great_deal_price: great_deal_price - totalRebates,
    msrp: heuristics.msrp ?? null,
    invoice_price: heuristics.invoice_price ?? null,
    retail_price,
    trade_in_value: heuristics.trade_in_value!,
    auction_price: heuristics.auction_price!,
    regional_avg,
    nationwide_avg,
    price_range_low,
    price_range_high,
    total_available_nationwide: marketData.nationwide_count,
    total_available_regional: marketData.regional_count,
    color_rarity_score: colorRarity,
    days_on_market_avg: daysOnMarketAvg,
    comparable_listings: marketData.listings.slice(0, 20),
    incentives,
    confidence,
  };
}
