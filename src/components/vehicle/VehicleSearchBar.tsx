"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Hash, Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleSearchBarProps {
  large?: boolean;
  className?: string;
}

const POPULAR_SEARCHES = [
  "2024 Toyota RAV4",
  "2025 Honda CR-V",
  "2024 Ford F-150",
  "2024 Tesla Model 3",
];

export default function VehicleSearchBar({ large = false, className }: VehicleSearchBarProps) {
  const router = useRouter();
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vinError, setVinError] = useState("");

  function handleVinSearch(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = vin.trim().toUpperCase();
    if (cleaned.length !== 17) {
      setVinError("VIN must be exactly 17 characters");
      return;
    }
    setVinError("");
    router.push(`/search?vin=${cleaned}`);
  }

  function handleMakeModelSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!make.trim() || !year.trim()) return;
    const params = new URLSearchParams({ make: make.trim(), year: year.trim() });
    if (model.trim()) params.set("model", model.trim());
    router.push(`/search?${params.toString()}`);
  }

  function handleQuickSearch(q: string) {
    const parts = q.split(" ");
    const yr = parts[0];
    const mk = parts[1];
    const mdl = parts.slice(2).join(" ");
    const params = new URLSearchParams({ make: mk, year: yr });
    if (mdl) params.set("model", mdl);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className={cn("w-full", className)}>
      <Tabs defaultValue="vehicle" className="w-full">
        <TabsList className="w-full mb-3 bg-card border border-border">
          <TabsTrigger value="vehicle" className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Car className="w-3.5 h-3.5" />
            Make / Model
          </TabsTrigger>
          <TabsTrigger value="vin" className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Hash className="w-3.5 h-3.5" />
            By VIN
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicle">
          <form onSubmit={handleMakeModelSearch} className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Year (e.g. 2024)"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={cn(
                "bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary",
                large ? "h-12 text-base" : "h-10"
              )}
              maxLength={4}
            />
            <Input
              placeholder="Make (e.g. Toyota)"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className={cn(
                "bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary",
                large ? "h-12 text-base" : "h-10"
              )}
            />
            <Input
              placeholder="Model (e.g. RAV4) — optional"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={cn(
                "bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary flex-1",
                large ? "h-12 text-base" : "h-10"
              )}
            />
            <Button
              type="submit"
              disabled={!make.trim() || !year.trim()}
              className={cn("gap-2 shrink-0", large ? "h-12 px-8 text-base" : "h-10")}
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="vin">
          <form onSubmit={handleVinSearch} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter 17-character VIN (e.g. 1HGBH41JXMN109186)"
                value={vin}
                onChange={(e) => {
                  setVin(e.target.value.toUpperCase());
                  setVinError("");
                }}
                className={cn(
                  "bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary font-mono tracking-wider flex-1",
                  large ? "h-12 text-base" : "h-10",
                  vinError && "border-destructive"
                )}
                maxLength={17}
              />
              <Button
                type="submit"
                disabled={vin.length !== 17}
                className={cn("gap-2 shrink-0", large ? "h-12 px-8 text-base" : "h-10")}
              >
                <Search className="w-4 h-4" />
                Decode VIN
              </Button>
            </div>
            {vinError && <p className="text-destructive text-xs">{vinError}</p>}
            <p className="text-xs text-muted-foreground">
              Find your VIN on the driver-side door jamb or windshield (bottom-left corner).
            </p>
          </form>
        </TabsContent>
      </Tabs>

      {/* Quick searches */}
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        <span className="text-xs text-muted-foreground self-center">Popular:</span>
        {POPULAR_SEARCHES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleQuickSearch(q)}
            className="text-xs px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
