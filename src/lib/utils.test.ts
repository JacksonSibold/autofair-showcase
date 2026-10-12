import { describe, it, expect } from "vitest";
import {
  calcPercentDiff,
  formatCurrency,
  formatMileage,
  formatNumber,
  slugify,
} from "./utils";

describe("formatCurrency", () => {
  it("formats whole dollars without cents", () => {
    expect(formatCurrency(24999)).toBe("$24,999");
  });

  it("rounds to the nearest dollar", () => {
    expect(formatCurrency(1234.56)).toBe("$1,235");
  });
});

describe("formatNumber and formatMileage", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("appends the mi suffix to mileage", () => {
    expect(formatMileage(45000)).toBe("45,000 mi");
  });
});

describe("calcPercentDiff", () => {
  it("returns the percentage difference relative to the second value", () => {
    expect(calcPercentDiff(110, 100)).toBeCloseTo(10);
    expect(calcPercentDiff(90, 100)).toBeCloseTo(-10);
  });

  it("returns zero when the values are equal", () => {
    expect(calcPercentDiff(50, 50)).toBe(0);
  });
});

describe("slugify", () => {
  it("lowercases, hyphenates whitespace, and strips punctuation", () => {
    expect(slugify("Toyota RAV4 XLE!")).toBe("toyota-rav4-xle");
  });

  it("keeps existing hyphens and digits", () => {
    expect(slugify("Mercedes-Benz 2024")).toBe("mercedes-benz-2024");
  });
});
