import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calcColorRarity, calcStats, getPricing } from "./pricing-engine";
import type { ComparableListing } from "@/types";

function listing(color: string): ComparableListing {
  return {
    vin: "VIN",
    price: 20000,
    mileage: 1000,
    year: 2024,
    make: "Toyota",
    model: "RAV4",
    trim: "XLE",
    color,
  } as ComparableListing;
}

describe("calcStats", () => {
  it("returns zeros for an empty price list", () => {
    expect(calcStats([])).toEqual({ avg: 0, low: 0, high: 0, p10: 0 });
  });

  it("computes average, min, max and the 10th percentile from unsorted input", () => {
    const prices = [10000, 30000, 20000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];
    expect(calcStats(prices)).toEqual({
      avg: 55000,
      low: 10000,
      high: 100000,
      p10: 20000,
    });
  });

  it("does not mutate the input array", () => {
    const prices = [3, 1, 2];
    calcStats(prices);
    expect(prices).toEqual([3, 1, 2]);
  });
});

describe("calcColorRarity", () => {
  it("returns a neutral 0.5 when no color or no listings are available", () => {
    expect(calcColorRarity(undefined, [listing("Red")])).toBe(0.5);
    expect(calcColorRarity("Red", [])).toBe(0.5);
  });

  it("scores rarity as the share of listings that do not match the color", () => {
    const listings = [
      listing("Red"),
      listing("Red Pearl"),
      listing("Red"),
      listing("Blue"),
      listing("White"),
    ];
    // 3 of 5 match "red" -> availability 0.6 -> rarity 0.4
    expect(calcColorRarity("red", listings)).toBe(0.4);
  });

  it("matches color names case-insensitively", () => {
    expect(calcColorRarity("BLUE", [listing("blue"), listing("blue")])).toBe(0);
  });
});

describe("getPricing without a MarketCheck key", () => {
  const original = process.env.MARKETCHECK_API_KEY;

  beforeEach(() => {
    delete process.env.MARKETCHECK_API_KEY;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.MARKETCHECK_API_KEY;
    else process.env.MARKETCHECK_API_KEY = original;
  });

  it("falls back to heuristics with low confidence and no comparables", async () => {
    const result = await getPricing({
      make: "Toyota",
      model: "RAV4",
      year: 2024,
      condition: "used",
      mileage: 40000,
    });

    expect(result.confidence).toBe("low");
    expect(result.comparable_listings).toEqual([]);
    expect(result.incentives).toEqual([]);
    expect(result.msrp).toBeNull();
    expect(result.fair_price).toBeLessThan(result.retail_price);
    expect(result.great_deal_price).toBeLessThanOrEqual(result.fair_price);
    expect(result.price_range_low).toBeLessThanOrEqual(result.price_range_high);
  });

  it("reports an MSRP and invoice price for new vehicles", async () => {
    const result = await getPricing({
      make: "Toyota",
      model: "RAV4",
      year: 2024,
      condition: "new",
    });

    expect(result.msrp).toBeGreaterThan(0);
    expect(result.invoice_price).toBeLessThan(result.msrp!);
  });
});
