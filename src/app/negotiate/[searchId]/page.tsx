"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Bot,
  MapPin,
  Palette,
  Settings2,
  Target,
  Truck,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ searchId: string }>;
}

const COLORS = ["White", "Black", "Silver", "Gray", "Red", "Blue", "Green", "Brown", "Orange", "Gold", "Any"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "Any"];
const PRIORITIES = [
  { value: "cheapest", label: "Cheapest Price", desc: "Get the lowest total cost, even if far away" },
  { value: "closest", label: "Closest to Me", desc: "Prioritize nearby dealers first" },
  { value: "specific_config", label: "Exact Configuration", desc: "Must have my specific color/options" },
];
const OPTIONS = [
  "Sunroof / Moonroof", "Leather Seats", "Navigation", "Heated Seats",
  "Cooled Seats", "360 Camera", "Blind Spot Monitor", "Adaptive Cruise",
  "Wireless CarPlay", "Third Row", "AWD / 4WD", "Tow Package",
];
const TIMELINES = ["ASAP", "This week", "This month", "Just exploring"];

type Step = "vehicle" | "preferences" | "location" | "review";

export default function NegotiatePage({ params }: Props) {
  const { searchId } = use(params);
  const router = useRouter();

  const [step, setStep] = useState<Step>("preferences");
  const [loading, setLoading] = useState(false);

  // Form state
  const [color, setColor] = useState("Any");
  const [transmission, setTransmission] = useState("Any");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [priority, setPriority] = useState("cheapest");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState([150]);
  const [willingToShip, setWillingToShip] = useState(false);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("This month");

  function toggleOption(opt: string) {
    setSelectedOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  }

  async function handleSubmit() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirectTo=/negotiate/${searchId}`);
      return;
    }

    // Get search details
    const { data: search } = await supabase
      .from("vehicle_searches")
      .select("*")
      .eq("id", searchId)
      .single();

    if (!search) { setLoading(false); return; }

    // Create negotiation record
    const { data: negotiation } = await supabase
      .from("negotiations")
      .insert({
        user_id: user.id,
        search_id: searchId,
        target_make: search.make,
        target_model: search.model,
        target_year: search.year,
        preferred_color: color === "Any" ? null : color,
        preferred_transmission: transmission === "Any" ? null : transmission,
        preferred_options: selectedOptions.length > 0 ? selectedOptions : null,
        priority,
        user_zip: zip,
        max_drive_miles: radius[0],
        willing_to_ship: willingToShip,
        target_price: budget ? parseFloat(budget.replace(/[^0-9.]/g, "")) : null,
        status: "pending_payment",
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (!negotiation) { setLoading(false); return; }

    // Create Stripe checkout
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        negotiation_id: negotiation.id,
        search_id: searchId,
        make: search.make,
        model: search.model,
        year: search.year,
      }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  }

  const steps: { id: Step; label: string; icon: typeof Bot }[] = [
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "location", label: "Location", icon: MapPin },
    { id: "review", label: "Review", icon: CheckCircle2 },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href={`/vehicle/${searchId}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to pricing
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">AF</span>
            </div>
            <span className="font-semibold text-sm">AutoFair</span>
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">AI Negotiation Setup</h1>
          <p className="text-muted-foreground text-sm">
            Tell us your preferences. We&apos;ll handle everything else.
          </p>
          <div className="flex items-center justify-center gap-1 mt-4">
            <span className="text-2xl font-bold">$20</span>
            <span className="text-muted-foreground text-sm">one-time · 100% anonymous</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => i < stepIndex + 1 && setStep(s.id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors",
                  step === s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : i < stepIndex
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-border text-muted-foreground"
                )}
              >
                <s.icon className="w-3 h-3" />
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {step === "preferences" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  Exterior Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={color === c}
                      onClick={() => setColor(c)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-sm transition-colors",
                        color === c
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Transmission</label>
                <div className="flex gap-2 flex-wrap">
                  {TRANSMISSIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={transmission === t}
                      onClick={() => setTransmission(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-sm transition-colors",
                        transmission === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                  Must-Have Options
                </label>
                <div className="flex flex-wrap gap-2">
                  {OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={selectedOptions.includes(opt)}
                      onClick={() => toggleOption(opt)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs transition-colors",
                        selectedOptions.includes(opt)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Priority
                </label>
                <div className="space-y-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      aria-pressed={priority === p.value}
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        priority === p.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <p className={cn("text-sm font-medium", priority === p.value && "text-primary")}>{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={() => setStep("location")}>
                Next: Location <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {step === "location" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Your ZIP Code *
                </label>
                <Input
                  placeholder="e.g. 75001"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  maxLength={5}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Max Drive Distance: <span className="text-primary">{radius[0]} miles</span>
                </label>
                <Slider
                  value={radius}
                  onValueChange={setRadius}
                  min={10}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 mi</span>
                  <span>500 mi</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  Willing to ship from anywhere in the US?
                </label>
                <div className="flex gap-2">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => setWillingToShip(v)}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-sm transition-colors",
                        willingToShip === v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {v ? "Yes — find the best deal anywhere" : "No — local only"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Hard Budget Limit (out-the-door)</label>
                <Input
                  placeholder="e.g. 35000 (optional)"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">
                  We never reveal this to dealers. Used to filter out deals above your max.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Timeline</label>
                <Select value={timeline} onValueChange={setTimeline}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("preferences")} className="flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep("review")} disabled={!zip}>
                  Review <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <div className="space-y-4">
                <h2 className="font-semibold">Your Negotiation Brief</h2>

                <div className="space-y-2 text-sm">
                  {[
                    ["Priority", PRIORITIES.find(p => p.value === priority)?.label],
                    ["Color", color],
                    ["Transmission", transmission],
                    ["Options", selectedOptions.length > 0 ? selectedOptions.join(", ") : "None specified"],
                    ["Location", `ZIP ${zip} · ${radius[0]} mile radius`],
                    ["Shipping", willingToShip ? "Yes, willing to ship" : "Local only"],
                    ["Budget", budget ? `$${parseInt(budget.replace(/\D/g, "")).toLocaleString()} OTD max` : "No hard limit"],
                    ["Timeline", timeline],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-right max-w-[60%]">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium mb-1">What happens next:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Our AI finds matching vehicles from 10–20 dealerships</li>
                    <li>• Sends negotiation emails/texts using an anonymous alias</li>
                    <li>• Returns to you with the best offers in 24–48 hours</li>
                    <li>• You choose to accept, continue, or cancel at any time</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">AutoFair AI Negotiation</span>
                    <span className="text-xl font-bold text-primary">$20</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    One-time fee · Secure payment via Stripe
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("location")} className="flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Pay $20 & Start <ChevronRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                You&apos;ll be redirected to Stripe&apos;s secure checkout
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
