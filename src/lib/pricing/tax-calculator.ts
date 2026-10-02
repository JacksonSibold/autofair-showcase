import type { TaxEstimate } from "@/types";

// State sales tax rates (2024)
const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.02, AK: 0, AZ: 0.056, AR: 0.065, CA: 0.0725,
  CO: 0.029, CT: 0.0635, DE: 0, FL: 0.06, GA: 0.04,
  HI: 0.04, ID: 0.06, IL: 0.0625, IN: 0.07, IA: 0.06,
  KS: 0.065, KY: 0.06, LA: 0.0445, ME: 0.055, MD: 0.06,
  MA: 0.0625, MI: 0.06, MN: 0.0655, MS: 0.05, MO: 0.04225,
  MT: 0, NE: 0.055, NV: 0.0685, NH: 0, NJ: 0.06625,
  NM: 0.05, NY: 0.04, NC: 0.03, ND: 0.05, OH: 0.0575,
  OK: 0.045, OR: 0, PA: 0.06, RI: 0.07, SC: 0.05,
  SD: 0.04, TN: 0.07, TX: 0.0625, UT: 0.0485, VT: 0.06,
  VA: 0.043, WA: 0.065, WV: 0.06, WI: 0.05, WY: 0.04,
  DC: 0.0575,
};

// Typical doc fees by state (dealer documentation fee)
const DOC_FEE_BY_STATE: Record<string, number> = {
  CA: 85, FL: 899, TX: 150, NY: 75, PA: 289, OH: 250,
  IL: 324, GA: 599, NC: 599, MI: 230, NJ: 399, VA: 599,
  WA: 150, AZ: 399, CO: 399, MN: 75, WI: 299, MD: 500,
  TN: 599, IN: 195,
};

// Typical title + registration fee by state
const TITLE_REG_FEE: Record<string, number> = {
  CA: 350, FL: 225, TX: 200, NY: 200, PA: 175, OH: 160,
  IL: 300, GA: 350, NC: 200, MI: 150, NJ: 200, VA: 150,
  WA: 250, AZ: 200, CO: 150, MN: 175, WI: 175, MD: 300,
  TN: 100, IN: 150,
};

// Manufacturer destination charge (new cars, approx by brand)
const DESTINATION_CHARGE: Record<string, number> = {
  toyota: 1095, honda: 1095, ford: 1595, chevrolet: 1195,
  gmc: 1295, ram: 1695, dodge: 1695, jeep: 1495, chrysler: 1395,
  nissan: 1095, hyundai: 1045, kia: 1045, subaru: 1025,
  mazda: 1100, volkswagen: 1095, bmw: 995, "mercedes-benz": 1050,
  audi: 995, lexus: 1025, acura: 960, infiniti: 1025, cadillac: 1395,
  lincoln: 1595, volvo: 1095, genesis: 1045, tesla: 0,
  default: 1200,
};

function getStateFromZip(zip: string): string {
  const zipNum = parseInt(zip);
  if (isNaN(zipNum)) return "US";

  if (zipNum >= 35004 && zipNum <= 36925) return "AL";
  if (zipNum >= 99501 && zipNum <= 99950) return "AK";
  if (zipNum >= 85001 && zipNum <= 86556) return "AZ";
  if (zipNum >= 71601 && zipNum <= 72959) return "AR";
  if (zipNum >= 90001 && zipNum <= 96162) return "CA";
  if (zipNum >= 80001 && zipNum <= 81658) return "CO";
  if (zipNum >= 6001 && zipNum <= 6928) return "CT";
  if (zipNum >= 19701 && zipNum <= 19980) return "DE";
  if (zipNum >= 32004 && zipNum <= 34997) return "FL";
  if (zipNum >= 30001 && zipNum <= 31999) return "GA";
  if (zipNum >= 96701 && zipNum <= 96898) return "HI";
  if (zipNum >= 83201 && zipNum <= 83876) return "ID";
  if (zipNum >= 60001 && zipNum <= 62999) return "IL";
  if (zipNum >= 46001 && zipNum <= 47997) return "IN";
  if (zipNum >= 50001 && zipNum <= 52809) return "IA";
  if (zipNum >= 66002 && zipNum <= 67954) return "KS";
  if (zipNum >= 40003 && zipNum <= 42788) return "KY";
  if (zipNum >= 70001 && zipNum <= 71497) return "LA";
  if (zipNum >= 3901 && zipNum <= 4992) return "ME";
  if (zipNum >= 20601 && zipNum <= 21930) return "MD";
  if (zipNum >= 1001 && zipNum <= 2791) return "MA";
  if (zipNum >= 48001 && zipNum <= 49971) return "MI";
  if (zipNum >= 55001 && zipNum <= 56763) return "MN";
  if (zipNum >= 38601 && zipNum <= 39776) return "MS";
  if (zipNum >= 63001 && zipNum <= 65899) return "MO";
  if (zipNum >= 59001 && zipNum <= 59937) return "MT";
  if (zipNum >= 68001 && zipNum <= 69367) return "NE";
  if (zipNum >= 88901 && zipNum <= 89883) return "NV";
  if (zipNum >= 3031 && zipNum <= 3897) return "NH";
  if (zipNum >= 7001 && zipNum <= 8989) return "NJ";
  if (zipNum >= 87001 && zipNum <= 88441) return "NM";
  if (zipNum >= 10001 && zipNum <= 14975) return "NY";
  if (zipNum >= 27006 && zipNum <= 28909) return "NC";
  if (zipNum >= 58001 && zipNum <= 58856) return "ND";
  if (zipNum >= 43001 && zipNum <= 45999) return "OH";
  if (zipNum >= 73001 && zipNum <= 74966) return "OK";
  if (zipNum >= 97001 && zipNum <= 97920) return "OR";
  if (zipNum >= 15001 && zipNum <= 19640) return "PA";
  if (zipNum >= 2801 && zipNum <= 2940) return "RI";
  if (zipNum >= 29001 && zipNum <= 29948) return "SC";
  if (zipNum >= 57001 && zipNum <= 57799) return "SD";
  if (zipNum >= 37010 && zipNum <= 38589) return "TN";
  if (zipNum >= 75001 && zipNum <= 79999) return "TX";
  if (zipNum >= 84001 && zipNum <= 84784) return "UT";
  if (zipNum >= 5001 && zipNum <= 5907) return "VT";
  if (zipNum >= 20101 && zipNum <= 24658) return "VA";
  if (zipNum >= 98001 && zipNum <= 99403) return "WA";
  if (zipNum >= 24701 && zipNum <= 26886) return "WV";
  if (zipNum >= 53001 && zipNum <= 54990) return "WI";
  if (zipNum >= 82001 && zipNum <= 83128) return "WY";
  if (zipNum >= 20001 && zipNum <= 20599) return "DC";

  return "TX"; // default
}

export function calcTaxAndFees(params: {
  vehicle_price: number;
  make: string;
  condition: "new" | "used" | "certified";
  buyer_zip: string;
  shipping_miles?: number;
}): TaxEstimate {
  const state = getStateFromZip(params.buyer_zip);
  const stateTaxRate = STATE_TAX_RATES[state] ?? 0.06;
  const countyTaxRate = 0.01; // approximate county avg
  const totalTaxRate = stateTaxRate + countyTaxRate;

  const taxAmount = Math.round(params.vehicle_price * totalTaxRate);
  const titleFee = TITLE_REG_FEE[state] ?? 200;
  const docFee = DOC_FEE_BY_STATE[state] ?? 299;

  const makeKey = params.make.toLowerCase();
  const destinationCharge =
    params.condition === "new"
      ? DESTINATION_CHARGE[makeKey] ?? DESTINATION_CHARGE.default
      : 0;

  // Shipping cost: $0.65/mile open transport
  const shippingCost = params.shipping_miles
    ? Math.round(params.shipping_miles * 0.65)
    : 0;

  const total =
    params.vehicle_price +
    taxAmount +
    titleFee +
    docFee +
    destinationCharge +
    shippingCost;

  return {
    state_tax_rate: stateTaxRate,
    county_tax_rate: countyTaxRate,
    total_tax_rate: totalTaxRate,
    tax_amount: taxAmount,
    title_fee: titleFee,
    registration_fee: Math.round(titleFee * 0.6),
    doc_fee_estimate: docFee,
    destination_charge: destinationCharge,
    shipping_cost: shippingCost,
    total_out_the_door: total,
  };
}
