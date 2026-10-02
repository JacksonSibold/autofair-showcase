-- AutoFair Database Schema
-- Run this in your Supabase SQL editor at: https://supabase.com/dashboard/project/jzafkeddobwcnajoxqiz/sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  zip_code TEXT,
  max_drive_radius_miles INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle searches (free tier)
CREATE TABLE IF NOT EXISTS public.vehicle_searches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  search_type TEXT NOT NULL CHECK (search_type IN ('vin', 'make_model', 'plate')),
  vin TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  trim TEXT,
  exterior_color TEXT,
  interior_color TEXT,
  mileage INTEGER,
  condition TEXT CHECK (condition IN ('new', 'used', 'certified')),
  estimated_fair_price DECIMAL(10,2),
  trade_in_value DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  auction_price DECIMAL(10,2),
  regional_avg_price DECIMAL(10,2),
  nationwide_avg_price DECIMAL(10,2),
  price_range_low DECIMAL(10,2),
  price_range_high DECIMAL(10,2),
  total_available_nationwide INTEGER,
  total_available_regional INTEGER,
  color_rarity_score DECIMAL(3,2),
  carfax_url TEXT,
  carfax_provided BOOLEAN DEFAULT FALSE,
  carfax_found_on_listing BOOLEAN DEFAULT FALSE,
  has_accidents BOOLEAN,
  service_record_count INTEGER,
  raw_pricing_data JSONB,
  raw_vehicle_data JSONB,
  comparable_listings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paid negotiations
CREATE TABLE IF NOT EXISTS public.negotiations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  search_id UUID REFERENCES public.vehicle_searches(id),
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  target_make TEXT NOT NULL,
  target_model TEXT NOT NULL,
  target_year INTEGER NOT NULL,
  preferred_color TEXT,
  preferred_transmission TEXT,
  preferred_options TEXT[],
  priority TEXT DEFAULT 'cheapest' CHECK (priority IN ('cheapest', 'closest', 'specific_config')),
  user_zip TEXT NOT NULL,
  max_drive_miles INTEGER NOT NULL,
  willing_to_ship BOOLEAN DEFAULT FALSE,
  target_price DECIMAL(10,2),
  estimated_sales_tax_rate DECIMAL(5,4),
  status TEXT DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'active', 'contacting_dealers',
    'negotiating', 'offers_received', 'completed', 'cancelled'
  )),
  best_offer_amount DECIMAL(10,2),
  best_offer_dealer_id UUID,
  final_report JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dealerships
CREATE TABLE IF NOT EXISTS public.dealerships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  distance_from_user_miles DECIMAL(6,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual dealer negotiations
CREATE TABLE IF NOT EXISTS public.dealer_negotiations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  negotiation_id UUID REFERENCES public.negotiations(id) NOT NULL,
  dealership_id UUID REFERENCES public.dealerships(id) NOT NULL,
  vin TEXT,
  listing_url TEXT,
  listed_price DECIMAL(10,2),
  contact_method TEXT CHECK (contact_method IN ('email', 'sms', 'both')),
  alias_email TEXT,
  alias_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'contacted', 'responded', 'negotiating',
    'offer_received', 'accepted', 'rejected', 'no_response'
  )),
  initial_offer DECIMAL(10,2),
  current_offer DECIMAL(10,2),
  best_offer DECIMAL(10,2),
  vehicle_price DECIMAL(10,2),
  dealer_fees DECIMAL(10,2),
  estimated_tax DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  total_out_the_door DECIMAL(10,2),
  messages JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealerships ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first so re-running this script is safe)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own searches" ON public.vehicle_searches;
DROP POLICY IF EXISTS "Users can create searches" ON public.vehicle_searches;
DROP POLICY IF EXISTS "Users can update own searches" ON public.vehicle_searches;
DROP POLICY IF EXISTS "Users can view own negotiations" ON public.negotiations;
DROP POLICY IF EXISTS "Users can create negotiations" ON public.negotiations;
DROP POLICY IF EXISTS "Users can update own negotiations" ON public.negotiations;
DROP POLICY IF EXISTS "Users can view own dealer negotiations" ON public.dealer_negotiations;
DROP POLICY IF EXISTS "Dealerships are readable by all" ON public.dealerships;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own searches" ON public.vehicle_searches
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can create searches" ON public.vehicle_searches
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can update own searches" ON public.vehicle_searches
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own negotiations" ON public.negotiations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create negotiations" ON public.negotiations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own negotiations" ON public.negotiations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own dealer negotiations" ON public.dealer_negotiations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.negotiations
      WHERE negotiations.id = dealer_negotiations.negotiation_id
      AND negotiations.user_id = auth.uid()
    )
  );

CREATE POLICY "Dealerships are readable by all" ON public.dealerships
  FOR SELECT USING (TRUE);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_negotiations_updated_at ON public.negotiations;
CREATE TRIGGER update_negotiations_updated_at
  BEFORE UPDATE ON public.negotiations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_dealer_negotiations_updated_at ON public.dealer_negotiations;
CREATE TRIGGER update_dealer_negotiations_updated_at
  BEFORE UPDATE ON public.dealer_negotiations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
