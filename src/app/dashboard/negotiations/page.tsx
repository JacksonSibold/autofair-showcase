import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Negotiation } from "@/types";

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending_payment: { label: "Pending Payment", variant: "outline" },
  active: { label: "Active", variant: "secondary" },
  contacting_dealers: { label: "Contacting Dealers", variant: "warning" },
  negotiating: { label: "Negotiating", variant: "warning" },
  offers_received: { label: "Offers Received", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

export default async function NegotiationsListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: negotiations } = await supabase
    .from("negotiations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Negotiations</h1>
        <Button asChild size="sm">
          <Link href="/search"><Plus className="w-4 h-4" /> New Search</Link>
        </Button>
      </div>

      {(negotiations ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Car className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h2 className="font-semibold mb-1">No negotiations yet</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Search a vehicle and start your first AI negotiation for just $20.
          </p>
          <Button asChild><Link href="/search">Search a Vehicle</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(negotiations ?? []).map((neg: Negotiation) => {
            const s = STATUS_LABELS[neg.status] ?? STATUS_LABELS.active;
            return (
              <Link
                key={neg.id}
                href={`/dashboard/negotiations/${neg.id}`}
                className="block rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {neg.target_year} {neg.target_make} {neg.target_model}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(neg.created_at).toLocaleDateString()} ·{" "}
                      {neg.user_zip} · {neg.max_drive_miles}mi
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={s.variant as "outline" | "secondary" | "warning" | "success"}>
                      {s.label}
                    </Badge>
                    {neg.best_offer_amount && (
                      <p className="text-green-400 font-semibold text-sm mt-1">
                        Best: {formatCurrency(neg.best_offer_amount)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
