import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Bot, ChevronRight } from "lucide-react";

export default function NegotiateSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3">You&apos;re In!</h1>
        <p className="text-muted-foreground mb-6">
          Payment received. Your AI negotiator is spinning up and will begin
          contacting dealerships shortly. You&apos;ll receive updates on your dashboard
          as offers come in.
        </p>
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-8">
          <div className="flex items-center gap-2 justify-center mb-2">
            <Bot className="w-5 h-5 text-primary" />
            <span className="font-medium">What happens next</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 text-left">
            <li>1. AI finds 10–20 matching dealers (next few minutes)</li>
            <li>2. Sends initial negotiation outreach (within 1 hour)</li>
            <li>3. Follows up as dealers respond (24–48 hours)</li>
            <li>4. You get a summary of all offers with recommendation</li>
          </ul>
        </div>
        <Button asChild className="w-full gap-2">
          <Link href="/dashboard">
            View Negotiation Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
