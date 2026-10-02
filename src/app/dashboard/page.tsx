import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Car, Clock, TrendingDown, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Negotiation } from "@/types";

const STATUS_LABELS: Record<Negotiation["status"], { label: string; color: string }> = {
  pending_payment: { label: "Pending Payment", color: "outline" },
  active: { label: "Starting", color: "secondary" },
  contacting_dealers: { label: "Contacting Dealers", color: "warning" },
  negotiating: { label: "Negotiating", color: "warning" },
  offers_received: { label: "Offers Received", color: "success" },
  completed: { label: "Complete", color: "success" },
  cancelled: { label: "Cancelled", color: "outline" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: negotiations }, { data: searches }] = await Promise.all([
    supabase
      .from("negotiations")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("vehicle_searches")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const activeNeg = (negotiations ?? []).filter((n) =>
    ["active", "contacting_dealers", "negotiating", "offers_received"].includes(n.status)
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user?.email?.split("@")[0]}</p>
        </div>
        <Button asChild>
          <Link href="/search">
            <Plus className="w-4 h-4" /> New Search
          </Link>
        </Button>
      </div>

      {/* Active negotiations */}
      {activeNeg.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary" />
            Active Negotiations
          </h2>
          <div className="space-y-3">
            {activeNeg.map((neg) => {
              const statusInfo = STATUS_LABELS[neg.status as Negotiation["status"]];
              return (
                <Link
                  key={neg.id}
                  href={`/dashboard/negotiations/${neg.id}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">
                        {neg.target_year} {neg.target_make} {neg.target_model}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {neg.max_drive_miles} mile radius · {neg.user_zip}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={statusInfo.color as "outline" | "secondary" | "warning" | "success"}>
                        {statusInfo.label}
                      </Badge>
                      {neg.best_offer_amount && (
                        <p className="text-sm font-semibold text-green-400 mt-1">
                          Best: {formatCurrency(neg.best_offer_amount)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent searches */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Recent Searches
        </h2>
        {(searches ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Car className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-muted-foreground text-sm">No searches yet.</p>
            <Link href="/search" className="text-primary text-sm hover:underline mt-1 inline-block">
              Search your first vehicle →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {(searches ?? []).map((s) => (
              <Link
                key={s.id}
                href={`/vehicle/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">
                    {s.year} {s.make} {s.model}
                    {s.trim ? ` ${s.trim}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
                {s.estimated_fair_price && (
                  <span className="text-primary font-semibold text-sm">
                    {formatCurrency(s.estimated_fair_price)} fair
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* All negotiations */}
      {(negotiations ?? []).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            All Negotiations
          </h2>
          <div className="space-y-2">
            {(negotiations ?? []).map((neg) => {
              const statusInfo = STATUS_LABELS[neg.status as Negotiation["status"]];
              return (
                <Link
                  key={neg.id}
                  href={`/dashboard/negotiations/${neg.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {neg.target_year} {neg.target_make} {neg.target_model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(neg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {neg.best_offer_amount && (
                      <span className="text-green-400 text-sm font-semibold">
                        {formatCurrency(neg.best_offer_amount)}
                      </span>
                    )}
                    <Badge variant={statusInfo.color as "outline" | "secondary" | "warning" | "success"}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
