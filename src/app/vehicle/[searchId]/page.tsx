import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPricing } from "@/lib/vehicle-data/pricing-engine";
import { calcTaxAndFees } from "@/lib/pricing/tax-calculator";
import PricingResultsClient from "./PricingResultsClient";
import type { VehicleSearch } from "@/types";

interface Props {
  params: Promise<{ searchId: string }>;
  searchParams: Promise<{ zip?: string }>;
}

export default async function VehicleResultsPage({ params, searchParams }: Props) {
  const { searchId } = await params;
  const { zip } = await searchParams;

  const supabase = await createClient();
  const { data: search } = await supabase
    .from("vehicle_searches")
    .select("*")
    .eq("id", searchId)
    .single();

  if (!search) notFound();

  const vehicleSearch = search as VehicleSearch;

  // If pricing already computed, use it; otherwise compute now
  let pricing;
  if (vehicleSearch.estimated_fair_price) {
    pricing = {
      fair_price: vehicleSearch.estimated_fair_price,
      great_deal_price: vehicleSearch.price_range_low ?? vehicleSearch.estimated_fair_price * 0.95,
      msrp: vehicleSearch.retail_price,
      invoice_price: null,
      retail_price: vehicleSearch.retail_price ?? vehicleSearch.estimated_fair_price * 1.05,
      trade_in_value: vehicleSearch.trade_in_value ?? vehicleSearch.estimated_fair_price * 0.82,
      auction_price: vehicleSearch.auction_price ?? vehicleSearch.estimated_fair_price * 0.78,
      regional_avg: vehicleSearch.regional_avg_price ?? vehicleSearch.estimated_fair_price,
      nationwide_avg: vehicleSearch.nationwide_avg_price ?? vehicleSearch.estimated_fair_price,
      price_range_low: vehicleSearch.price_range_low ?? vehicleSearch.estimated_fair_price * 0.91,
      price_range_high: vehicleSearch.price_range_high ?? vehicleSearch.estimated_fair_price * 1.05,
      total_available_nationwide: vehicleSearch.total_available_nationwide ?? 0,
      total_available_regional: vehicleSearch.total_available_regional ?? 0,
      color_rarity_score: vehicleSearch.color_rarity_score ?? 0.5,
      days_on_market_avg: 30,
      comparable_listings: (vehicleSearch.comparable_listings as import("@/types").ComparableListing[]) ?? [],
      incentives: [],
      confidence: "medium" as const,
    };
  } else {
    pricing = await getPricing({
      make: vehicleSearch.make!,
      model: vehicleSearch.model!,
      year: vehicleSearch.year!,
      trim: vehicleSearch.trim ?? undefined,
      condition: vehicleSearch.condition ?? "used",
      mileage: vehicleSearch.mileage ?? undefined,
      zip: zip ?? undefined,
      vin: vehicleSearch.vin ?? undefined,
      color: vehicleSearch.exterior_color ?? undefined,
    });

    // Save pricing back to DB
    await supabase
      .from("vehicle_searches")
      .update({
        estimated_fair_price: pricing.fair_price,
        retail_price: pricing.retail_price,
        trade_in_value: pricing.trade_in_value,
        auction_price: pricing.auction_price,
        regional_avg_price: pricing.regional_avg,
        nationwide_avg_price: pricing.nationwide_avg,
        price_range_low: pricing.price_range_low,
        price_range_high: pricing.price_range_high,
        total_available_nationwide: pricing.total_available_nationwide,
        total_available_regional: pricing.total_available_regional,
        color_rarity_score: pricing.color_rarity_score,
        comparable_listings: pricing.comparable_listings,
        raw_pricing_data: { incentives: pricing.incentives },
      })
      .eq("id", searchId);
  }

  const taxEstimate = calcTaxAndFees({
    vehicle_price: pricing.fair_price,
    make: vehicleSearch.make ?? "",
    condition: vehicleSearch.condition ?? "used",
    buyer_zip: zip ?? "75001",
  });

  return (
    <PricingResultsClient
      search={vehicleSearch}
      pricing={pricing}
      taxEstimate={taxEstimate}
    />
  );
}
