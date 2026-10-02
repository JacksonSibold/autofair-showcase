"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Bot,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { Negotiation, DealerNegotiation, Dealership, NegotiationMessage } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_STEPS = [
  "contacting_dealers",
  "negotiating",
  "offers_received",
  "completed",
];

const DEALER_STATUS_LABELS: Record<DealerNegotiation["status"], { label: string; color: string }> = {
  pending: { label: "Queued", color: "secondary" },
  contacted: { label: "Contacted", color: "secondary" },
  responded: { label: "Responded", color: "warning" },
  negotiating: { label: "Negotiating", color: "warning" },
  offer_received: { label: "Offer Received", color: "success" },
  accepted: { label: "Accepted", color: "success" },
  rejected: { label: "Passed", color: "outline" },
  no_response: { label: "No Response", color: "outline" },
};

function DealerCard({
  dn,
  dealership,
}: {
  dn: DealerNegotiation;
  dealership?: Dealership;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = DEALER_STATUS_LABELS[dn.status];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{dealership?.name ?? "Dealership"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dealership?.city}, {dealership?.state}
              {dealership?.distance_from_user_miles != null && (
                <span> · {Math.round(dealership.distance_from_user_miles)}mi</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {dn.best_offer && (
              <span className="text-green-400 font-semibold text-sm">
                {formatCurrency(dn.best_offer)}
              </span>
            )}
            <Badge variant={statusInfo.color as "outline" | "secondary" | "warning" | "success"} className="text-xs">
              {statusInfo.label}
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {dn.listed_price && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Listed: {formatCurrency(dn.listed_price)}</span>
            {dn.best_offer && dn.listed_price && (
              <span className="text-green-400">
                Saved: {formatCurrency(dn.listed_price - dn.best_offer)}
              </span>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            {dn.alias_email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> {dn.alias_email}
              </span>
            )}
            {dn.alias_phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {dn.alias_phone}
              </span>
            )}
          </div>

          {dn.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No messages yet
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dn.messages.map((msg: NegotiationMessage) => (
                <div
                  key={msg.id}
                  className={cn(
                    "text-sm rounded-lg p-3",
                    msg.direction === "outbound"
                      ? "bg-primary/10 border border-primary/20 ml-4"
                      : "bg-card border border-border mr-4"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {msg.direction === "outbound" ? "Alex (AutoFair)" : "Dealer"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NegotiationDetailPage({ params }: Props) {
  const { id } = use(params);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [dealerNegs, setDealerNegs] = useState<(DealerNegotiation & { dealerships: Dealership })[]>([]);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: neg } = await supabase
        .from("negotiations")
        .select("*")
        .eq("id", id)
        .single();
      if (neg) setNegotiation(neg as Negotiation);

      const { data: dns } = await supabase
        .from("dealer_negotiations")
        .select("*, dealerships(*)")
        .eq("negotiation_id", id)
        .order("created_at");
      if (dns) setDealerNegs(dns as (DealerNegotiation & { dealerships: Dealership })[]);
    }

    load();

    // Realtime subscription
    const channel = supabase
      .channel(`negotiation-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "negotiations", filter: `id=eq.${id}` },
        (payload) => setNegotiation(payload.new as Negotiation)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dealer_negotiations", filter: `negotiation_id=eq.${id}` },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function launchNegotiation() {
    setLaunching(true);
    await fetch("/api/negotiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negotiation_id: id }),
    });
    setLaunching(false);
  }

  if (!negotiation) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  const stepIndex = STATUS_STEPS.indexOf(negotiation.status);
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / STATUS_STEPS.length) * 100 : 10;

  const offersReceived = dealerNegs.filter((d) => d.best_offer != null);
  const bestOverall = offersReceived.reduce(
    (best, d) => (d.best_offer && (!best || d.best_offer < best) ? d.best_offer : best),
    null as number | null
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {negotiation.target_year} {negotiation.target_make} {negotiation.target_model}
          </h1>
          <p className="text-muted-foreground text-sm">
            Negotiation · {negotiation.user_zip} · {negotiation.max_drive_miles}mi radius
          </p>
        </div>
        <Badge
          variant={
            negotiation.status === "completed"
              ? "success"
              : negotiation.status === "offers_received"
              ? "success"
              : negotiation.status === "negotiating"
              ? "warning"
              : "secondary"
          }
        >
          {negotiation.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Launch button if active but not started */}
      {negotiation.status === "active" && dealerNegs.length === 0 && (
        <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-sm">Payment confirmed — ready to launch!</p>
              <p className="text-xs text-muted-foreground">Click to start finding and contacting dealerships.</p>
            </div>
            <Button size="sm" onClick={launchNegotiation} disabled={launching}>
              {launching ? "Launching..." : "Launch AI Agent"}
            </Button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          {["Finding Dealers", "Contacting", "Negotiating", "Complete"].map((s, i) => (
            <span
              key={s}
              className={cn(
                "transition-colors",
                i <= stepIndex ? "text-primary" : ""
              )}
            >
              {s}
            </span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Best offer */}
      {bestOverall && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-green-400" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Best Offer So Far</p>
              <p className="text-3xl font-bold text-green-400">{formatCurrency(bestOverall)}</p>
            </div>
            <Button variant="outline" size="sm">Accept This Offer</Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Dealers Contacted", value: dealerNegs.filter((d) => d.status !== "pending").length },
          { label: "Responded", value: dealerNegs.filter((d) => ["responded", "negotiating", "offer_received"].includes(d.status)).length },
          { label: "Offers", value: offersReceived.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <Separator className="mb-6" />

      {/* Dealer cards */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          Dealer Negotiations ({dealerNegs.length})
        </h2>

        {dealerNegs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-muted-foreground text-sm">
              {negotiation.status === "active"
                ? "Launch the AI agent to begin contacting dealers."
                : "Searching for dealers..."}
            </p>
          </div>
        ) : (
          dealerNegs.map((dn) => (
            <DealerCard
              key={dn.id}
              dn={dn}
              dealership={dn.dealerships}
            />
          ))
        )}
      </div>

      {/* Completed notice */}
      {negotiation.status === "completed" && negotiation.final_report && (
        <div className="mt-6 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <h2 className="font-semibold">Negotiation Complete</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Your AI negotiator has finished. Review the offers above and contact your preferred dealer directly to finalize.
          </p>
        </div>
      )}

      {/* No email warning */}
      {negotiation.status === "negotiating" && dealerNegs.every((d) => !d.dealerships?.email) && (
        <div className="mt-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          No dealer email addresses found in our database for this vehicle. Add a MarketCheck API key for full dealer contact data.
        </div>
      )}
    </div>
  );
}
