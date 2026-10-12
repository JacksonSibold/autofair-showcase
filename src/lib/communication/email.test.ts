import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildNegotiationEmailSubject,
  extractEmailAddress,
  generateAliasEmail,
  sendEmail,
} from "./email";

describe("extractEmailAddress", () => {
  it("returns the address from a display-name form", () => {
    expect(extractEmailAddress('"Dealer Sales" <buyer-1a2b@autofair.com>')).toBe("buyer-1a2b@autofair.com");
    expect(extractEmailAddress("Sales <sales@dealer.com>")).toBe("sales@dealer.com");
  });

  it("passes through a bare address and trims whitespace", () => {
    expect(extractEmailAddress("  buyer@autofair.com ")).toBe("buyer@autofair.com");
  });
});

describe("generateAliasEmail", () => {
  it("is deterministic for the same negotiation and dealership", () => {
    const a = generateAliasEmail("neg-1", "dealer-9");
    const b = generateAliasEmail("neg-1", "dealer-9");
    expect(a).toBe(b);
  });

  it("differs between dealerships", () => {
    expect(generateAliasEmail("neg-1", "dealer-9")).not.toBe(generateAliasEmail("neg-1", "dealer-10"));
  });

  it("uses the domain of the configured sender address", () => {
    expect(generateAliasEmail("neg-1", "d")).toMatch(/^buyer-[0-9a-f]{10}@autofair\.com$/);
  });
});

describe("buildNegotiationEmailSubject", () => {
  it("uses the inquiry subject for the first message", () => {
    expect(buildNegotiationEmailSubject("Toyota", "RAV4", 2024, 0)).toBe(
      "Inquiry: 2024 Toyota RAV4 — Pricing Request"
    );
  });

  it("clamps later rounds to the final subject line", () => {
    const last = buildNegotiationEmailSubject("Toyota", "RAV4", 2024, 3);
    expect(buildNegotiationEmailSubject("Toyota", "RAV4", 2024, 99)).toBe(last);
  });
});

// SENDGRID_API_KEY is read at module load, so this suite assumes it is unset
// (the default for local development and CI).
describe("sendEmail without SendGrid credentials", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a mock send and reports success instead of calling the API", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await sendEmail({
      to: "sales@dealer.com",
      from_alias: "buyer-1@autofair.com",
      subject: "Hi",
      body: "Body",
      negotiation_id: "neg-1",
    });

    expect(result.success).toBe(true);
    expect(result.message_id).toMatch(/^mock-/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
  });
});
