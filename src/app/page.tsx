import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import VehicleSearchBar from "@/components/vehicle/VehicleSearchBar";
import {
  Search,
  TrendingDown,
  Bot,
  Shield,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Star,
  Zap,
  Globe,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AF</span>
            </div>
            <span className="font-bold text-lg tracking-tight">AutoFair</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#compare" className="hover:text-foreground transition-colors">vs. CarEdge</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="glow-blue">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden grid-pattern spotlight">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 border border-primary/20 bg-primary/10 text-primary">
              <Zap className="w-3 h-3" />
              Free Pricing Intelligence + $20 AI Negotiation
            </Badge>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
              Know What Your{" "}
              <span className="text-gradient">Next Car</span>
              <br />
              Should Cost.
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Instant pricing intelligence on any vehicle — free. Then let our AI
              negotiation agent contact dealerships and fight for the best price.{" "}
              <span className="text-foreground font-medium">Just $20. No subscription.</span>
            </p>

            <div className="max-w-2xl mx-auto mb-8">
              <VehicleSearchBar />
            </div>

            <p className="text-sm text-muted-foreground">
              No account required for pricing lookup.{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up free
              </Link>{" "}
              to save searches.
            </p>

            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <span>4.9/5 from early users</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span>100% anonymous negotiations</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Avg. savings: $2,400</span>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-border bg-card/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Vehicles in Database", value: "42M+" },
              { label: "Avg. Negotiation Savings", value: "$2,400" },
              { label: "Dealers Nationwide", value: "18,000+" },
              { label: "Cost to Negotiate", value: "$20" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Two Tiers */}
        <section id="pricing" className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">Simple Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Start Free. Negotiate for $20.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get full market pricing for any car at no cost. Pay once when
              you&apos;re ready to have our AI fight for the best deal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-8">
              <div className="mb-6">
                <Badge variant="secondary" className="mb-3">Free Forever</Badge>
                <div className="text-3xl font-bold mb-1">$0</div>
                <p className="text-muted-foreground text-sm">No account required</p>
              </div>
              <ul className="space-y-3 text-sm mb-8">
                {[
                  "Fair market price for any vehicle",
                  "Regional & nationwide price comps",
                  "How many are available near you",
                  "Color & option rarity score",
                  "Sales tax & out-the-door estimate",
                  "Carfax integration (bring your own)",
                  "Unlimited searches",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/search">
                <Button variant="outline" className="w-full">
                  Search a Vehicle <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="rounded-xl border border-primary/40 bg-card p-8 relative overflow-hidden glow-blue">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className="mb-6 relative">
                <Badge className="mb-3">AI Negotiation</Badge>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold">$20</span>
                  <span className="text-muted-foreground text-sm">one-time per vehicle</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  CarEdge charges $50/month. We charge $20. Once.
                </p>
              </div>
              <ul className="space-y-3 text-sm mb-8 relative">
                {[
                  "Everything in Free tier",
                  "AI agent contacts 10–20 dealerships",
                  "Full email + SMS negotiation on your behalf",
                  "Your identity stays 100% anonymous",
                  "Nationwide search + shipping quotes",
                  "Real-time negotiation dashboard",
                  "Best-offer recommendation report",
                  "Average savings: $2,400 below asking",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/search">
                <Button className="w-full glow-blue">
                  Start Negotiating <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-card/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4">How It Works</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                From Search to Best Deal in 3 Steps
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: Search,
                  title: "Search Any Vehicle",
                  description:
                    "Enter a VIN, or search by make/model/year. We pull pricing from millions of real transactions and active listings nationwide.",
                },
                {
                  step: "02",
                  icon: TrendingDown,
                  title: "See What You Should Pay",
                  description:
                    "Get the fair price, great deal threshold, regional comps, market availability, color rarity, and a full out-the-door estimate.",
                },
                {
                  step: "03",
                  icon: Bot,
                  title: "Let AI Negotiate For You",
                  description:
                    "Pay $20 and our AI agent emails and texts dealerships, references competing offers, and negotiates aggressively — all anonymously.",
                },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="text-6xl font-bold text-border/50 mb-4 font-mono">{item.step}</div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Competitor Comparison */}
        <section id="compare" className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">vs. The Competition</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Better Than CarEdge. Cheaper Too.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              CarEdge pioneered AI car negotiation but charges $50/month. We
              charge $20 flat. No subscription. No recurring fees.
            </p>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left p-4 text-muted-foreground font-medium">Feature</th>
                  <th className="text-center p-4 font-semibold text-primary">AutoFair</th>
                  <th className="text-center p-4 text-muted-foreground">CarEdge</th>
                  <th className="text-center p-4 text-muted-foreground">DIY</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Pricing Intelligence", true, true, false],
                    ["AI Negotiation Agent", true, true, false],
                    ["Email + SMS Outreach", true, true, false],
                    ["Anonymous Identity", true, true, false],
                    ["Nationwide Dealer Search", true, true, false],
                    ["Real-time Dashboard", true, true, false],
                    ["Price", "$20 flat", "$50/mo", "Free + stress"],
                  ] as [string, boolean | string, boolean | string, boolean | string][]
                ).map(([feature, autofair, caredge, diy], i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-card/30 transition-colors">
                    <td className="p-4 font-medium">{feature}</td>
                    <td className="p-4 text-center">
                      {typeof autofair === "boolean" ? (
                        autofair ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-semibold text-primary">{autofair}</span>
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {typeof caredge === "boolean" ? (
                        caredge ? (
                          <CheckCircle2 className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span>{caredge}</span>
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {typeof diy === "boolean" ? (
                        diy ? (
                          <CheckCircle2 className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span>{diy}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trust */}
        <section className="py-20 bg-card/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-4">Your Privacy Is Protected</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Dealers never know who you are. Our AI negotiates using anonymous alias emails and phone numbers.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: "Anonymous by Default",
                  description:
                    "We generate unique alias emails and phone numbers for every negotiation. Dealers contact the alias, not you.",
                },
                {
                  icon: Globe,
                  title: "No Dealer Relationships",
                  description:
                    "We have zero dealer partnerships. We work for you, not the dealer. Our incentive is your savings.",
                },
                {
                  icon: Bot,
                  title: "AI That Sounds Human",
                  description:
                    "Powered by GPT-4o, our agent communicates naturally. Dealers interact as if talking to a real buyer's agent.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 spotlight pointer-events-none" />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              What Should You Pay For{" "}
              <span className="text-gradient">Your Next Car?</span>
            </h2>
            <p className="text-muted-foreground mb-10 text-lg">Find out in seconds. Free.</p>
            <div className="max-w-xl mx-auto">
              <VehicleSearchBar large />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">AF</span>
              </div>
              <span className="font-semibold">AutoFair</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 AutoFair. Not affiliated with any dealership.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
