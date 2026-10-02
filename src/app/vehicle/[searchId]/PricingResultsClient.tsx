"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  TrendingDown,
  MapPin,
  Globe,
  Sparkles,
  ChevronRight,
  Info,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import type { VehicleSearch, PricingResult, TaxEstimate, ComparableListing } from "@/types";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";

interface Props {
  search: VehicleSearch;
  pricing: PricingResult;
  taxEstimate: TaxEstimate;
}

function PriceGauge({ price, low, high }: { price: number; low: number; high: number }) {
  const range = high - low;
  const pct = range > 0 ? Math.max(0, Math.min(100, ((price - low) / range) * 100)) : 50;
  const color =
    pct <= 25 ? "text-green-400" : pct <= 50 ? "text-blue-400" : pct <= 75 ? "text-yellow-400" : "text-red-400";
  const label =
    pct <= 25 ? "Great Deal" : pct <= 50 ? "Good Deal" : pct <= 75 ? "Fair Price" : "Above Market";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(low)}</span>
        <span className={cn("font-semibold", color)}>{label}</span>
        <span>{formatCurrency(high)}</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-blue-500 via-yellow-500 to-red-500">
        <div
          className="absolute top-0 w-3 h-3 rounded-full bg-white border-2 border-background shadow-lg -translate-x-1/2"
          style={{ left: `${pct}%` }}
        />
      </div>
      <p className={cn("text-center text-sm font-bold", color)}>{label}</p>
    </div>
  );
}

function AvailabilityBar({ regional, nationwide }: { regional: number; nationwide: number }) {
  const supply =
    nationwide > 500
      ? { label: "High Supply", color: "text-green-400", pct: 90 }
      : nationwide > 100
      ? { label: "Normal Supply", color: "text-blue-400", pct: 60 }
      : nationwide > 20
      ? { label: "Limited Supply", color: "text-yellow-400", pct: 35 }
      : { label: "Very Rare", color: "text-red-400", pct: 15 };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Near you
        </span>
        <span className="font-semibold">{formatNumber(regional)} vehicles</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Nationwide
        </span>
        <span className="font-semibold">{formatNumber(nationwide)} vehicles</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${supply.pct}%` }}
        />
      </div>
      <p className={cn("text-sm font-medium text-center", supply.color)}>{supply.label}</p>
    </div>
  );
}

function OTDBreakdown({ pricing, taxEstimate }: { pricing: PricingResult; taxEstimate: TaxEstimate }) {
  const rows = [
    { label: "Vehicle Price (Fair)", value: pricing.fair_price },
    ...(taxEstimate.destination_charge > 0
      ? [{ label: "Destination Charge", value: taxEstimate.destination_charge }]
      : []),
    { label: `Doc Fee (est.)`, value: taxEstimate.doc_fee_estimate },
    {
      label: `Sales Tax (${(taxEstimate.total_tax_rate * 100).toFixed(2)}%)`,
      value: taxEstimate.tax_amount,
    },
    { label: "Title & Registration", value: taxEstimate.title_fee },
    ...(taxEstimate.shipping_cost > 0
      ? [{ label: "Shipping", value: taxEstimate.shipping_cost }]
      : []),
  ];

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{r.label}</span>
          <span>{formatCurrency(r.value)}</span>
        </div>
      ))}
      <Separator className="my-2" />
      <div className="flex justify-between font-bold">
        <span>Estimated Out-the-Door</span>
        <span className="text-primary text-lg">{formatCurrency(taxEstimate.total_out_the_door)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        * Estimates only. Actual dealer fees vary. Tax based on buyer ZIP.
      </p>
    </div>
  );
}

function CompsTable({ listings }: { listings: ComparableListing[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? listings : listings.slice(0, 5);

  if (listings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
        No comparable listings available. Connect a MarketCheck API key for live data.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left px-6 py-2 font-medium">Vehicle</th>
              <th className="text-left px-3 py-2 font-medium">Price</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Miles</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Location</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">DOM</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {shown.map((l, i) => (
              <tr key={i} className="border-b border-border/40 hover:bg-card/50 transition-colors">
                <td className="px-6 py-3">
                  <div className="font-medium">{l.year} {l.make} {l.model}</div>
                  {l.trim && <div className="text-xs text-muted-foreground">{l.trim}</div>}
                </td>
                <td className="px-3 py-3 font-semibold text-primary">{formatCurrency(l.price)}</td>
                <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">
                  {l.mileage ? formatNumber(l.mileage) : "—"}
                </td>
                <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">
                  {l.dealer_city}, {l.dealer_state}
                  {l.distance_miles != null && (
                    <span className="text-xs ml-1">({Math.round(l.distance_miles)}mi)</span>
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">
                  {l.days_on_market ?? "—"}d
                </td>
                <td className="px-3 py-3">
                  {l.listing_url && (
                    <a
                      href={l.listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {listings.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-primary hover:underline w-full text-center"
        >
          {expanded ? "Show less" : `Show all ${listings.length} comparables`}
        </button>
      )}
    </div>
  );
}

export default function PricingResultsClient({ search, pricing, taxEstimate }: Props) {
  const router = useRouter();
  const vehicleTitle = `${search.year} ${search.make} ${search.model}${search.trim ? ` ${search.trim}` : ""}`;

  const priceRows = [
    { label: "Great Deal", value: pricing.great_deal_price, highlight: true, color: "text-green-400" },
    { label: "Fair Purchase Price", value: pricing.fair_price, highlight: false, color: "text-blue-400" },
    { label: "Regional Average", value: pricing.regional_avg, highlight: false, color: "text-foreground" },
    { label: "National Average", value: pricing.nationwide_avg, highlight: false, color: "text-foreground" },
    { label: "Retail / Sticker", value: pricing.retail_price, highlight: false, color: "text-muted-foreground" },
    { label: "Trade-in Value", value: pricing.trade_in_value, highlight: false, color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">AF</span>
            </div>
            <span className="font-semibold text-sm">AutoFair</span>
          </Link>
          <Badge
            variant={pricing.confidence === "high" ? "success" : pricing.confidence === "medium" ? "warning" : "outline"}
            className="text-xs"
          >
            {pricing.confidence === "high" ? "High" : pricing.confidence === "medium" ? "Medium" : "Low"} Confidence
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Vehicle title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">{vehicleTitle}</h1>
          {search.vin && (
            <p className="text-muted-foreground text-sm font-mono mt-1">VIN: {search.vin}</p>
          )}
        </div>

        {/* No Carfax warning for used */}
        {search.condition !== "new" && !search.carfax_provided && (
          <div className="mb-6 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              No vehicle history report provided. Pricing confidence is lower without Carfax.{" "}
              <button className="underline hover:no-underline">Add Carfax</button>
            </span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column — main pricing */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fair price hero */}
            <div className="rounded-xl border border-primary/30 bg-card p-6 glow-blue">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Fair Purchase Price</p>
                  <p className="text-4xl font-bold text-primary">
                    {formatCurrency(pricing.fair_price)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(pricing.great_deal_price)} great deal ·{" "}
                    {formatCurrency(pricing.retail_price)} retail
                  </p>
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                  <TrendingDown className="w-4 h-4" />
                  Target
                </div>
              </div>
              <PriceGauge
                price={pricing.fair_price}
                low={pricing.price_range_low}
                high={pricing.price_range_high}
              />
            </div>

            {/* Price table */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-4">Price Breakdown</h2>
              <div className="space-y-3">
                {priceRows.map((row) => (
                  <div
                    key={row.label}
                    className={cn(
                      "flex items-center justify-between py-2",
                      row.highlight && "px-3 rounded-lg bg-primary/10 border border-primary/20"
                    )}
                  >
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className={cn("font-semibold", row.color)}>
                      {formatCurrency(row.value)}
                    </span>
                  </div>
                ))}
                {pricing.incentives.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Current OEM Incentives
                      </p>
                      {pricing.incentives.map((inc, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-green-400">{inc.name}</span>
                          <span className="text-green-400 font-medium">
                            -{formatCurrency(inc.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* OTD Estimate */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                Out-the-Door Estimate
                <span className="group relative">
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </span>
              </h2>
              <OTDBreakdown pricing={pricing} taxEstimate={taxEstimate} />
            </div>

            {/* Comparable listings */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-4">
                Comparable Listings
                {pricing.comparable_listings.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {pricing.comparable_listings.length} found
                  </Badge>
                )}
              </h2>
              <CompsTable listings={pricing.comparable_listings} />
            </div>
          </div>

          {/* Right column — availability + CTA */}
          <div className="space-y-6">
            {/* Market availability */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-4">Market Availability</h2>
              <AvailabilityBar
                regional={pricing.total_available_regional}
                nationwide={pricing.total_available_nationwide}
              />
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Days on Market</span>
                  <span>{pricing.days_on_market_avg}d</span>
                </div>
                {search.exterior_color && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color Rarity</span>
                    <span>
                      {pricing.color_rarity_score >= 0.8
                        ? "Very Rare"
                        : pricing.color_rarity_score >= 0.6
                        ? "Uncommon"
                        : "Common"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Negotiate CTA */}
            <div className="rounded-xl border border-primary/40 bg-card p-6 glow-blue">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">AI Negotiation</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Let our AI contact up to 20 dealerships and negotiate the best
                price on your behalf. Completely anonymous.
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold">$20</span>
                <span className="text-muted-foreground text-sm">one-time</span>
              </div>
              <Button className="w-full gap-2 mb-3" asChild>
                <Link href={`/negotiate/${search.id}`}>
                  Negotiate For Me <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                CarEdge charges $50/mo. We charge $20. Once.
              </p>
            </div>

            {/* New car notice */}
            {search.condition === "new" && pricing.msrp && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-semibold mb-3 text-sm">New Car Intel</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MSRP</span>
                    <span>{formatCurrency(pricing.msrp)}</span>
                  </div>
                  {pricing.invoice_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Price</span>
                      <span className="text-green-400">{formatCurrency(pricing.invoice_price)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Target Price</span>
                    <span className="text-primary">{formatCurrency(pricing.fair_price)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
