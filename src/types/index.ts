export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  zip_code: string | null;
  max_drive_radius_miles: number;
  created_at: string;
  updated_at: string;
};

export type VehicleSearch = {
  id: string;
  user_id: string | null;
  search_type: "vin" | "make_model" | "plate";
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  mileage: number | null;
  condition: "new" | "used" | "certified" | null;
  estimated_fair_price: number | null;
  trade_in_value: number | null;
  retail_price: number | null;
  auction_price: number | null;
  regional_avg_price: number | null;
  nationwide_avg_price: number | null;
  price_range_low: number | null;
  price_range_high: number | null;
  total_available_nationwide: number | null;
  total_available_regional: number | null;
  color_rarity_score: number | null;
  carfax_url: string | null;
  carfax_provided: boolean;
  carfax_found_on_listing: boolean;
  has_accidents: boolean | null;
  service_record_count: number | null;
  raw_pricing_data: Record<string, unknown> | null;
  raw_vehicle_data: Record<string, unknown> | null;
  comparable_listings: ComparableListing[] | null;
  created_at: string;
};

export type ComparableListing = {
  vin?: string;
  price: number;
  mileage?: number;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color?: string;
  dealer_name?: string;
  dealer_city?: string;
  dealer_state?: string;
  distance_miles?: number;
  listing_url?: string;
  days_on_market?: number;
};

export type Negotiation = {
  id: string;
  user_id: string;
  search_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: "pending" | "paid" | "refunded";
  target_make: string;
  target_model: string;
  target_year: number;
  preferred_color: string | null;
  preferred_transmission: string | null;
  preferred_options: string[] | null;
  priority: "cheapest" | "closest" | "specific_config";
  user_zip: string;
  max_drive_miles: number;
  willing_to_ship: boolean;
  target_price: number | null;
  estimated_sales_tax_rate: number | null;
  status:
    | "pending_payment"
    | "active"
    | "contacting_dealers"
    | "negotiating"
    | "offers_received"
    | "completed"
    | "cancelled";
  best_offer_amount: number | null;
  best_offer_dealer_id: string | null;
  final_report: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Dealership = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_from_user_miles: number | null;
  created_at: string;
};

export type DealerNegotiation = {
  id: string;
  negotiation_id: string;
  dealership_id: string;
  vin: string | null;
  listing_url: string | null;
  listed_price: number | null;
  contact_method: "email" | "sms" | "both" | null;
  alias_email: string | null;
  alias_phone: string | null;
  status:
    | "pending"
    | "contacted"
    | "responded"
    | "negotiating"
    | "offer_received"
    | "accepted"
    | "rejected"
    | "no_response";
  initial_offer: number | null;
  current_offer: number | null;
  best_offer: number | null;
  vehicle_price: number | null;
  dealer_fees: number | null;
  estimated_tax: number | null;
  shipping_cost: number | null;
  total_out_the_door: number | null;
  messages: NegotiationMessage[];
  created_at: string;
  updated_at: string;
  dealership?: Dealership;
};

export type NegotiationMessage = {
  id: string;
  direction: "outbound" | "inbound";
  channel: "email" | "sms";
  content: string;
  timestamp: string;
  from?: string;
  to?: string;
};

export type VehicleDecodeResult = {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  body_style: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  fuel_type: string | null;
  cylinders: number | null;
  displacement: string | null;
  plant_city: string | null;
  plant_country: string | null;
  errors: string[];
};

export type PricingResult = {
  fair_price: number;
  great_deal_price: number;
  msrp: number | null;
  invoice_price: number | null;
  retail_price: number;
  trade_in_value: number;
  auction_price: number;
  regional_avg: number;
  nationwide_avg: number;
  price_range_low: number;
  price_range_high: number;
  total_available_nationwide: number;
  total_available_regional: number;
  color_rarity_score: number;
  days_on_market_avg: number;
  comparable_listings: ComparableListing[];
  incentives: OEMIncentive[];
  confidence: "high" | "medium" | "low";
};

export type OEMIncentive = {
  name: string;
  amount: number;
  expiry?: string;
  type: "rebate" | "financing" | "lease";
};

export type TaxEstimate = {
  state_tax_rate: number;
  county_tax_rate: number;
  total_tax_rate: number;
  tax_amount: number;
  title_fee: number;
  registration_fee: number;
  doc_fee_estimate: number;
  destination_charge: number;
  shipping_cost: number;
  total_out_the_door: number;
};
