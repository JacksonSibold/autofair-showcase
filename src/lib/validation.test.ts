import { describe, it, expect } from "vitest";
import {
  isUuid,
  isValidVin,
  isValidZip,
  parseMakeName,
  parseModelYear,
  readJsonBody,
} from "./validation";

describe("isUuid", () => {
  it("accepts canonical UUIDs in either case", () => {
    expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isUuid("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
  });

  it("rejects non-strings and malformed values", () => {
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid(42)).toBe(false);
    expect(isUuid("123e4567-e89b-12d3-a456-42661417400")).toBe(false);
    expect(isUuid("'; drop table negotiations; --")).toBe(false);
  });
});

describe("isValidVin", () => {
  it("accepts a 17-character VIN without I, O or Q", () => {
    expect(isValidVin("1HGBH41JXMN109186")).toBe(true);
  });

  it("rejects wrong length and forbidden characters", () => {
    expect(isValidVin("1HGBH41JXMN10918")).toBe(false);
    expect(isValidVin("1HGBH41JXMN10918O")).toBe(false);
    expect(isValidVin("1HGBH41JXMN109186/")).toBe(false);
  });
});

describe("isValidZip", () => {
  it("accepts exactly five digits", () => {
    expect(isValidZip("75001")).toBe(true);
    expect(isValidZip("7500")).toBe(false);
    expect(isValidZip("75001-1234")).toBe(false);
  });
});

describe("parseModelYear", () => {
  const now = new Date("2026-10-12T00:00:00Z");

  it("accepts years from 1950 through next model year", () => {
    expect(parseModelYear("2024", now)).toBe(2024);
    expect(parseModelYear(" 2027 ", now)).toBe(2027);
    expect(parseModelYear("1950", now)).toBe(1950);
  });

  it("rejects out-of-range, non-numeric and path-like values", () => {
    expect(parseModelYear("2028", now)).toBeNull();
    expect(parseModelYear("1949", now)).toBeNull();
    expect(parseModelYear("20x4", now)).toBeNull();
    expect(parseModelYear("2024/../x", now)).toBeNull();
    expect(parseModelYear(null, now)).toBeNull();
  });
});

describe("parseMakeName", () => {
  it("accepts typical make names", () => {
    expect(parseMakeName("Toyota")).toBe("Toyota");
    expect(parseMakeName("  Mercedes-Benz ")).toBe("Mercedes-Benz");
    expect(parseMakeName("Land Rover")).toBe("Land Rover");
  });

  it("rejects path separators, query characters and oversized input", () => {
    expect(parseMakeName("Toyota/../admin")).toBeNull();
    expect(parseMakeName("Toyota?x=1")).toBeNull();
    expect(parseMakeName("")).toBeNull();
    expect(parseMakeName("A".repeat(41))).toBeNull();
    expect(parseMakeName(["Toyota"])).toBeNull();
  });
});

describe("readJsonBody", () => {
  function req(body: string): Request {
    return new Request("http://localhost/test", { method: "POST", body });
  }

  it("returns the parsed object", async () => {
    expect(await readJsonBody(req('{"a":1}'))).toEqual({ a: 1 });
  });

  it("returns null for malformed JSON, arrays and primitives", async () => {
    expect(await readJsonBody(req("{not json"))).toBeNull();
    expect(await readJsonBody(req("[1,2]"))).toBeNull();
    expect(await readJsonBody(req("null"))).toBeNull();
    expect(await readJsonBody(req("42"))).toBeNull();
  });
});
