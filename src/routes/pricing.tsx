import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SayneLogo } from "@/components/sayne-logo";
import { SayneFooter } from "@/components/sayne-footer";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Sayne" },
      {
        name: "description",
        content:
          "Simple pricing for Sayne. Start free with the Researcher plan. Upgrade to Researcher Pro for unlimited vials, stacks, and AI imports.",
      },
      { property: "og:title", content: "Pricing — Sayne" },
      {
        property: "og:description",
        content:
          "Start free. Upgrade when you're ready for unlimited tracking, analytics, and AI imports.",
      },
    ],
  }),
  component: PricingPage,
});

const INK = "#2D1F4A";
const MUTED = "#9B8EC4";
const LAVENDER = "#C9A8F5";
const BABY_BLUE = "#89CFF0";
const MINT = "#98E4B2";
const BORDER = "#DDD5F0";

function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [intent, setIntent] = useState<"trial" | "upgrade">("trial");

  const openWaitlist = (which: "trial" | "upgrade") => {
    setIntent(which);
    setWaitlistOpen(true);
  };

  return (
    <div style={{ backgroundColor: "#F8F5FF", color: INK }} className="min-h-screen flex flex-col">
      <header className="w-full px-6 md:px-10 py-6 flex items-center justify-between">
        <SayneLogo />
        <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: MUTED }}>
          <Link to="/home" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/pricing" className="text-foreground">Pricing</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
        </nav>
      </header>

      <main className="flex-1 w-full px-5 md:px-8">
        <section className="mx-auto max-w-5xl pt-8 md:pt-14 pb-6 text-center">
          <h1
            className="font-display font-bold tracking-tight text-4xl md:text-5xl"
            style={{ color: INK, fontFamily: "Syne, 'Space Grotesk', system-ui, sans-serif" }}
          >
            Simple pricing. Start free.
          </h1>
          <p className="mt-4 text-base md:text-lg max-w-2xl mx-auto" style={{ color: MUTED }}>
            Track your first stack free. Upgrade when you're ready for unlimited everything.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3">
            <div
              className="relative inline-flex p-1 rounded-full"
              style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}` }}
            >
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className="relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer"
                style={{ color: !annual ? INK : MUTED }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className="relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer"
                style={{ color: annual ? INK : MUTED }}
              >
                Annual
              </button>
              <motion.div
                aria-hidden
                layout
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute top-1 bottom-1 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${BABY_BLUE}33, ${LAVENDER}44)`,
                  border: `1px solid ${LAVENDER}66`,
                  left: annual ? "calc(50% + 2px)" : 4,
                  right: annual ? 4 : "calc(50% + 2px)",
                }}
              />
            </div>
            {annual && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${MINT}55`, color: "#1f5e3a", border: `1px solid ${MINT}` }}
              >
                Save 50%
              </motion.span>
            )}
          </div>
        </section>

        {/* Cards */}
        <section className="mx-auto max-w-5xl pt-4 pb-12">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {/* FREE */}
            <PlanCard
              accent={BABY_BLUE}
              name="Researcher"
              priceMain="$0"
              priceSub="forever free"
              cta={
                <Button
                  onClick={() => (window.location.href = "/signup")}
                  variant="outline"
                  className="w-full"
                  style={{ borderColor: BABY_BLUE, color: "#1F4E66" }}
                >
                  Get Started
                </Button>
              }
              features={[
                "Track up to 3 vials",
                "2 active stacks",
                "Unlimited dose calculator",
                "3 AI protocol imports",
                "3 receipt scans",
                "Browse the Stack Feed",
                "7-day history",
                "Daily dose tracking",
              ]}
              checkColor={BABY_BLUE}
            />

            {/* PRO */}
            <PlanCard
              featured
              accent={LAVENDER}
              badge="Most Popular"
              name="Researcher Pro"
              priceNode={
                annual ? (
                  <div>
                    <div
                      className="text-sm line-through"
                      style={{ color: MUTED }}
                    >
                      $179.88
                    </div>
                    <div className="flex items-baseline gap-1.5 justify-center">
                      <span className="font-display font-bold text-5xl" style={{ color: INK }}>
                        $90
                      </span>
                      <span className="text-sm" style={{ color: MUTED }}>/year</span>
                    </div>
                    <div
                      className="mt-2 text-xs font-medium"
                      style={{ color: "#1f5e3a" }}
                    >
                      Just $7.50/month — save 50%
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5 justify-center">
                    <span className="font-display font-bold text-5xl" style={{ color: INK }}>
                      $14.99
                    </span>
                    <span className="text-sm" style={{ color: MUTED }}>/month</span>
                  </div>
                )
              }
              cta={
                <div className="space-y-2">
                  <Button
                    onClick={() => openWaitlist("trial")}
                    className="w-full liquid-button text-foreground hover:opacity-95 shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${BABY_BLUE} 0%, ${LAVENDER} 120%)`,
                      color: "#1F1240",
                    }}
                  >
                    Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <p className="text-[11px] text-center" style={{ color: MUTED }}>
                    7-day free trial. Cancel anytime.
                  </p>
                </div>
              }
              featuresHeader="Everything in Researcher, plus:"
              features={[
                "Unlimited vials",
                "Unlimited stacks",
                "Unlimited AI imports & receipt scans",
                "Full Protocol Journal with unlimited history",
                "Outcome curves & trend tracking",
                "Full degradation analytics",
                "Share to the Stack Feed",
                "Streak tracking & reminders",
                "Export your data (PDF & CSV)",
                "Priority support",
              ]}
              checkColor={LAVENDER}
            />
          </div>

          <p className="mt-8 text-center text-sm" style={{ color: MUTED }}>
            No credit card required to start. Upgrade, downgrade, or cancel anytime.
          </p>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl pb-20 px-2">
          <h2
            className="font-display font-bold tracking-tight text-2xl md:text-3xl text-center mb-6"
            style={{ color: INK }}
          >
            Frequently asked
          </h2>
          <div className="sayne-card p-2 md:p-4">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="px-3">
                  <AccordionTrigger className="font-display text-base" style={{ color: INK }}>
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent style={{ color: MUTED, lineHeight: 1.65 }}>
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <SayneFooter />

      {/* Waitlist / placeholder modal */}
      <WaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        intent={intent}
      />
    </div>
  );
}

function PlanCard({
  name,
  priceMain,
  priceSub,
  priceNode,
  cta,
  features,
  featuresHeader,
  featured = false,
  accent,
  badge,
  checkColor,
}: {
  name: string;
  priceMain?: string;
  priceSub?: string;
  priceNode?: React.ReactNode;
  cta: React.ReactNode;
  features: string[];
  featuresHeader?: string;
  featured?: boolean;
  accent: string;
  badge?: string;
  checkColor: string;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-white p-7 md:p-8 ${
        featured ? "md:scale-[1.02] md:-translate-y-1" : ""
      }`}
      style={{
        border: `1.5px solid ${featured ? accent : BORDER}`,
        boxShadow: featured
          ? `0 18px 50px -18px ${LAVENDER}66, 0 6px 18px -8px ${LAVENDER}55, 0 0 0 1px ${LAVENDER}33 inset`
          : "0 1px 2px 0 rgb(45 31 74 / 0.04), 0 1px 3px 0 rgb(45 31 74 / 0.06)",
      }}
    >
      {badge && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold"
          style={{
            background: `linear-gradient(135deg, ${LAVENDER}, ${BABY_BLUE})`,
            color: "#1F1240",
            boxShadow: `0 6px 18px -6px ${LAVENDER}99`,
          }}
        >
          <Sparkles className="h-3 w-3" /> {badge}
        </span>
      )}

      <div className="text-center">
        <div
          className="font-display text-lg font-semibold"
          style={{ color: INK, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        >
          {name}
        </div>
        <div className="mt-4 min-h-[112px] flex flex-col items-center justify-center">
          {priceNode ? (
            priceNode
          ) : (
            <>
              <div className="font-display font-bold text-5xl" style={{ color: INK }}>
                {priceMain}
              </div>
              {priceSub && (
                <div className="mt-1 text-sm" style={{ color: MUTED }}>
                  {priceSub}
                </div>
              )}
            </>
          )}
        </div>
        <div className="mt-5">{cta}</div>
      </div>

      <div className="my-6 h-px" style={{ backgroundColor: BORDER }} />

      {featuresHeader && (
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: MUTED }}>
          {featuresHeader}
        </div>
      )}
      <ul className="space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: INK }}>
            <span
              className="mt-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full shrink-0"
              style={{ backgroundColor: `${checkColor}33`, color: checkColor }}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span style={{ lineHeight: 1.5 }}>{f}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

const FAQ = [
  {
    q: "Is there really a free version?",
    a: "Yes. The Researcher plan is free forever and includes everything you need to track your first stack. No credit card required.",
  },
  {
    q: "What happens if I cancel Pro?",
    a: "You keep your data and return to the free Researcher plan. You can re-subscribe anytime.",
  },
  {
    q: "Can I switch between monthly and annual?",
    a: "Yes, you can change your billing anytime from Settings.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your tracking data is private to you. Anything you share to the Stack Feed is anonymous. See our Privacy Policy for details.",
  },
  {
    q: "Does Sayne give medical advice?",
    a: "No. Sayne is a research and tracking tool, not a medical provider. Always consult a qualified professional. See our Disclaimer.",
  },
];

function WaitlistDialog({
  open,
  onOpenChange,
  intent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  intent: "trial" | "upgrade";
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email.");
      return;
    }
    // Placeholder: payments not wired up yet.
    setSubmitted(true);
    toast.success("You're on the list — we'll email you when Pro is ready.");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setSubmitted(false); setEmail(""); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {intent === "trial" ? "Pro is coming soon" : "Upgrade is coming soon"}
          </DialogTitle>
          <DialogDescription>
            We're putting the finishing touches on billing. Drop your email and we'll let you know
            the moment Researcher Pro is live — you'll get early access.
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div
            className="rounded-lg p-4 text-sm"
            style={{ backgroundColor: `${MINT}33`, color: "#1f5e3a", border: `1px solid ${MINT}` }}
          >
            You're on the list. 💌
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Button
              type="submit"
              className="w-full"
              style={{
                background: `linear-gradient(135deg, ${BABY_BLUE} 0%, ${LAVENDER} 120%)`,
                color: "#1F1240",
              }}
            >
              Join the waitlist
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
