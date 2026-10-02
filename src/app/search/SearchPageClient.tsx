"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Hash,
  Car,
  AlertCircle,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import type { VehicleDecodeResult } from "@/types";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR + 1 - i));

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tab, setTab] = useState<"vehicle" | "vin">(
    searchParams.get("vin") ? "vin" : "vehicle"
  );

  // VIN state
  const [vin, setVin] = useState(searchParams.get("vin") ?? "");
  const [vinError, setVinError] = useState("");

  // Make/Model state
  const [year, setYear] = useState(searchParams.get("year") ?? "");
  const [make, setMake] = useState(searchParams.get("make") ?? "");
  const [model, setModel] = useState(searchParams.get("model") ?? "");
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [zip, setZip] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [decoded, setDecoded] = useState<VehicleDecodeResult | null>(null);

  // Load makes list
  useEffect(() => {
    fetch("/api/vehicle/makes")
      .then((r) => r.json())
      .then((d) => setMakes(d.makes ?? []));
  }, []);

  // Load models when make+year changes
  useEffect(() => {
    if (!make) { setModels([]); return; }
    const params = new URLSearchParams({ make });
    if (year) params.set("year", year);
    fetch(`/api/vehicle/models?${params}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []));
  }, [make, year]);

  const runSearch = useCallback(async () => {
    if (tab === "vin") {
      const cleaned = vin.trim().toUpperCase();
      if (cleaned.length !== 17) {
        setVinError("VIN must be exactly 17 characters");
        return;
      }
      setVinError("");
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/vehicle/decode?vin=${cleaned}`);
        const data: VehicleDecodeResult = await res.json();
        if (!res.ok) throw new Error((data as unknown as { error: string }).error);
        setDecoded(data);
        await saveAndRedirect({ ...data, zip });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to decode VIN");
        setLoading(false);
      }
    } else {
      if (!make || !year) return;
      setLoading(true);
      setError("");
      try {
        await saveAndRedirect({
          vin: "" as string,
          year: parseInt(year),
          make,
          model: model || make,
          trim: null,
          engine: null,
          transmission: null,
          drivetrain: null,
          body_style: null,
          exterior_color: null,
          interior_color: null,
          fuel_type: null,
          cylinders: null,
          displacement: null,
          plant_city: null,
          plant_country: null,
          errors: [],
          zip,
        } as unknown as VehicleDecodeResult & { zip?: string });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
        setLoading(false);
      }
    }
  }, [tab, vin, make, model, year, zip]);

  // Auto-run on mount if params present
  useEffect(() => {
    if ((searchParams.get("vin") || (searchParams.get("make") && searchParams.get("year"))) && !decoded) {
      runSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveAndRedirect(vehicle: (VehicleDecodeResult & { zip?: string; vin: string | null }) | VehicleDecodeResult) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const record = {
      user_id: user?.id ?? null,
      search_type: (vehicle as VehicleDecodeResult).vin ? "vin" : "make_model" as "vin" | "make_model",
      vin: (vehicle as VehicleDecodeResult).vin ?? null,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim,
      condition: "used" as const,
    };

    const { data, error: dbError } = await supabase
      .from("vehicle_searches")
      .insert(record)
      .select("id")
      .single();

    if (dbError || !data) {
      // Still redirect with params if DB fails
      const params = new URLSearchParams({
        make: vehicle.make,
        model: vehicle.model,
        year: String(vehicle.year),
        ...(vehicle.vin ? { vin: vehicle.vin } : {}),
        ...("zip" in vehicle && vehicle.zip ? { zip: vehicle.zip } : {}),
      });
      router.push(`/vehicle?${params}`);
      return;
    }

    router.push(`/vehicle/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">AF</span>
            </div>
            <span className="font-semibold text-foreground">AutoFair</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search a Vehicle</h1>
          <p className="text-muted-foreground">
            Get instant fair market pricing for any car — free.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "vehicle" | "vin")}>
            <TabsList className="w-full mb-6 bg-background border border-border">
              <TabsTrigger value="vehicle" className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Car className="w-3.5 h-3.5" />
                Make / Model
              </TabsTrigger>
              <TabsTrigger value="vin" className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Hash className="w-3.5 h-3.5" />
                By VIN
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vehicle" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Year *</label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Make *</label>
                  <Select value={make} onValueChange={(v) => { setMake(v); setModel(""); }}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.length === 0 ? (
                        <SelectItem value="_loading" disabled>Loading...</SelectItem>
                      ) : (
                        makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Model</label>
                <Select value={model} onValueChange={setModel} disabled={!make}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder={make ? "Select model (optional)" : "Select make first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your ZIP Code <span className="text-muted-foreground">(for regional pricing)</span></label>
                <Input
                  placeholder="e.g. 90210"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  maxLength={5}
                  className="bg-background border-border"
                />
              </div>
            </TabsContent>

            <TabsContent value="vin" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Vehicle Identification Number (VIN)</label>
                <Input
                  placeholder="e.g. 1HGBH41JXMN109186"
                  value={vin}
                  onChange={(e) => { setVin(e.target.value.toUpperCase()); setVinError(""); }}
                  className={cn(
                    "bg-background border-border font-mono tracking-widest",
                    vinError && "border-destructive"
                  )}
                  maxLength={17}
                />
                {vinError ? (
                  <p className="text-destructive text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {vinError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {vin.length}/17 characters — Find on driver-side door jamb or windshield corner
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your ZIP Code <span className="text-muted-foreground">(for regional pricing)</span></label>
                <Input
                  placeholder="e.g. 90210"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  maxLength={5}
                  className="bg-background border-border"
                />
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            className="w-full mt-6 gap-2"
            size="lg"
            onClick={runSearch}
            disabled={loading || (tab === "vehicle" ? !make || !year : vin.length !== 17)}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing market data...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Get Pricing
              </>
            )}
          </Button>
        </div>

        {loading && (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground text-center">Fetching market data...</p>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {decoded && !loading && (
          <div className="mt-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <Badge variant="secondary" className="mb-2">Decoded</Badge>
            <p className="font-semibold">
              {decoded.year} {decoded.make} {decoded.model}
              {decoded.trim ? ` ${decoded.trim}` : ""}
            </p>
            {decoded.engine && <p className="text-sm text-muted-foreground">{decoded.engine}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
