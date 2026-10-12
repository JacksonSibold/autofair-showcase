import { describe, it, expect } from "vitest";
import { calcTaxAndFees } from "./tax-calculator";

describe("calcTaxAndFees", () => {
  it("computes state + county tax and fees for a used car in Texas", () => {
    const result = calcTaxAndFees({
      vehicle_price: 20000,
      make: "Toyota",
      condition: "used",
      buyer_zip: "75001",
    });

    expect(result.state_tax_rate).toBe(0.0625);
    expect(result.county_tax_rate).toBe(0.01);
    expect(result.total_tax_rate).toBeCloseTo(0.0725);
    expect(result.tax_amount).toBe(1450);
    expect(result.title_fee).toBe(200);
    expect(result.registration_fee).toBe(120);
    expect(result.doc_fee_estimate).toBe(150);
    expect(result.destination_charge).toBe(0);
    expect(result.shipping_cost).toBe(0);
    expect(result.total_out_the_door).toBe(20000 + 1450 + 200 + 150);
  });

  it("adds the brand destination charge only for new vehicles", () => {
    const newCar = calcTaxAndFees({
      vehicle_price: 30000,
      make: "Toyota",
      condition: "new",
      buyer_zip: "90210",
    });
    const usedCar = calcTaxAndFees({
      vehicle_price: 30000,
      make: "Toyota",
      condition: "used",
      buyer_zip: "90210",
    });

    expect(newCar.destination_charge).toBe(1095);
    expect(usedCar.destination_charge).toBe(0);
    expect(newCar.total_out_the_door - usedCar.total_out_the_door).toBe(1095);
  });

  it("uses the default destination charge for unknown makes and zero for Tesla", () => {
    const unknown = calcTaxAndFees({
      vehicle_price: 40000,
      make: "Rivian",
      condition: "new",
      buyer_zip: "75001",
    });
    const tesla = calcTaxAndFees({
      vehicle_price: 40000,
      make: "Tesla",
      condition: "new",
      buyer_zip: "75001",
    });

    expect(unknown.destination_charge).toBe(1200);
    expect(tesla.destination_charge).toBe(0);
  });

  it("matches make names case-insensitively", () => {
    const result = calcTaxAndFees({
      vehicle_price: 25000,
      make: "FORD",
      condition: "new",
      buyer_zip: "75001",
    });
    expect(result.destination_charge).toBe(1595);
  });

  it("prices open-transport shipping at $0.65 per mile", () => {
    const result = calcTaxAndFees({
      vehicle_price: 20000,
      make: "Honda",
      condition: "used",
      buyer_zip: "75001",
      shipping_miles: 1000,
    });
    expect(result.shipping_cost).toBe(650);
  });

  it("uses a state with no sales tax (Oregon) at county rate only", () => {
    const result = calcTaxAndFees({
      vehicle_price: 10000,
      make: "Honda",
      condition: "used",
      buyer_zip: "97201",
    });
    expect(result.state_tax_rate).toBe(0);
    expect(result.tax_amount).toBe(100);
  });

  it("falls back to a generic rate when the ZIP is not numeric", () => {
    const result = calcTaxAndFees({
      vehicle_price: 10000,
      make: "Honda",
      condition: "used",
      buyer_zip: "abcde",
    });
    expect(result.state_tax_rate).toBe(0.06);
    expect(result.title_fee).toBe(200);
    expect(result.doc_fee_estimate).toBe(299);
  });

  it("falls back to Texas for ZIP codes outside every known range", () => {
    const result = calcTaxAndFees({
      vehicle_price: 10000,
      make: "Honda",
      condition: "used",
      buyer_zip: "00000",
    });
    expect(result.state_tax_rate).toBe(0.0625);
    expect(result.doc_fee_estimate).toBe(150);
  });
});
