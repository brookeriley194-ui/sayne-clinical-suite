import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  CalendarDays,
  Beaker,
  Calculator,
  BookOpen,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/getting-started")({
  head: () => ({
    meta: [
      { title: "Getting Started — Sayne" },
      {
        name: "description",
        content:
          "A beginner-friendly guide to using Sayne. Learn what peptides are, how to build your first stack, track vials, log doses, and use the calculator.",
      },
      { property: "og:title", content: "Getting Started — Sayne" },
      {
        property: "og:description",
        content:
          "New to peptides? Start here. A simple, jargon-free guide to tracking your research with Sayne.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GettingStartedPage,
});

const INK = "#2D1F4A";
const MUTED = "#9B8EC4";
const LAVENDER = "#C9A8F5";
const BABY_BLUE = "#89CFF0";
const MINT = "#98E4B2";

function GettingStartedPage() {
  return (
    <LegalLayout title="Getting Started with Sayne" lastUpdated="August 30, 2026">
      <div className="space-y-10">
        {/* Intro */}
        <section>
          <p className="text-lg leading-relaxed">
            Welcome to Sayne. If you are brand new to peptides, you are in the right place.
            This guide explains everything in plain English — no science degree required.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/signup">
              <Button className="gap-2" style={{ backgroundColor: BABY_BLUE, color: INK }}>
                Create a free account <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/home">
              <Button variant="outline" className="gap-2">
                Visit the homepage
              </Button>
            </Link>
          </div>
        </section>

        {/* What are peptides */}
        <section className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: "#fff", borderColor: "#DDD5F0" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-xl grid place-items-center" style={{ backgroundColor: `${LAVENDER}30` }}>
              <Sparkles className="size-5" style={{ color: LAVENDER }} />
            </div>
            <h2 className="font-display text-2xl font-bold">What are peptides, exactly?</h2>
          </div>
          <p>
            Peptides are short chains of amino acids — basically tiny building blocks that your body already uses to send signals and carry out jobs like healing tissue, managing appetite, or regulating hormones.
          </p>
          <p className="mt-3">
            Researchers study specific peptides to understand how these signals work. Think of a peptide like a small instruction manual: it tells a cell to do something, such as repair skin, support recovery, or influence metabolism.
          </p>
          <p className="mt-3" style={{ color: MUTED }}>
            <strong>Important:</strong> Peptides sold online are for research and laboratory use only. They are not approved by the FDA for human consumption, diagnosis, treatment, or prevention of any disease. Sayne is a tracking and organization tool, not a medical service.
          </p>
        </section>

        {/* The big idea */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">What Sayne does for you</h2>
          <p className="mb-4">
            Sayne is like a smart notebook for your peptide research. Instead of trying to remember doses, vial sizes, and schedules in your head, you record them in one place. The app then helps you:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Layers, text: "Build a 'stack' — your personal list of compounds and when to take them" },
              { icon: Beaker, text: "Track your vials, including how much powder is inside and how much water you mixed it with" },
              { icon: Calculator, text: "Calculate how much liquid to draw for each dose" },
              { icon: CalendarDays, text: "Log doses on a calendar so you can see what you took and when" },
              { icon: BookOpen, text: "Keep research notes and outcomes in one journal" },
              { icon: FlaskConical, text: "Browse community templates to get ideas for your own protocol" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: "#DDD5F0", backgroundColor: "#fff" }}>
                <item.icon className="size-5 shrink-0 mt-0.5" style={{ color: BABY_BLUE }} />
                <span className="text-sm leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Step by step */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Your first 10 minutes</h2>
          <div className="space-y-6">
            <Step number={1} title="Create your account" color={LAVENDER}>
              Sign up as a researcher. Sayne is currently in free early access, so you get full access to every feature while we gather feedback.
            </Step>

            <Step number={2} title="Add your first vial" color={BABY_BLUE}>
              A <strong>vial</strong> is just a small bottle containing your research compound. Tap <strong>My Vials</strong> and add:
              <ul className="list-disc ml-5 mt-2 space-y-1" style={{ color: MUTED }}>
                <li>The compound name (for example, BPC-157 or TB-500)</li>
                <li>How many milligrams (mg) of powder were in the vial</li>
                <li>How much bacteriostatic water you added, if you have reconstituted it</li>
                <li>The status: sealed, open, empty, or expired</li>
              </ul>
              <p className="mt-2" style={{ color: MUTED }}>
                Tip: If you have a receipt or label, you can use the AI import to read the text automatically.
              </p>
            </Step>

            <Step number={3} title="Build your first stack" color={MINT}>
              A <strong>stack</strong> is simply a group of compounds you are researching together, along with a schedule. Go to <strong>My Stacks</strong> and create a new stack. For each compound, you can:
              <ul className="list-disc ml-5 mt-2 space-y-1" style={{ color: MUTED }}>
                <li>Pick the compound name</li>
                <li>Set a dose amount (for example, 250 micrograms)</li>
                <li>Choose how often you plan to take it — daily, every other day, or custom days of the week</li>
                <li>Link it to one of your vials so Sayne knows which bottle to pull from</li>
              </ul>
            </Step>

            <Step number={4} title="Use the calculator" color={LAVENDER}>
              Not sure how much liquid to draw into your syringe? Open the <strong>Calculator</strong> and enter:
              <ul className="list-disc ml-5 mt-2 space-y-1" style={{ color: MUTED }}>
                <li>How much powder is in the vial</li>
                <li>How much water you mixed it with</li>
                <li>Your target dose</li>
              </ul>
              <p className="mt-2" style={{ color: MUTED }}>
                Sayne tells you the exact syringe units and volume to draw. No guessing.
              </p>
            </Step>

            <Step number={5} title="Log your doses" color={BABY_BLUE}>
              Each day, open <strong>Research Logs</strong> or the <strong>Today</strong> page and mark your doses as done. This creates a record you can look back on later.
            </Step>

            <Step number={6} title="Track outcomes" color={MINT}>
              Use the <strong>Journal</strong> inside each stack to write notes, side observations, measurements, or anything else you want to remember. Over time, this becomes your personal research log.
            </Step>
          </div>
        </section>

        {/* Quick glossary */}
        <section className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: "#fff", borderColor: "#DDD5F0" }}>
          <h2 className="font-display text-2xl font-bold mb-4">Quick glossary</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold">Peptide</dt>
              <dd style={{ color: MUTED }}>A short chain of amino acids used by the body for signaling and regulation.</dd>
            </div>
            <div>
              <dt className="font-semibold">Stack</dt>
              <dd style={{ color: MUTED }}>A group of compounds and a schedule you are researching together.</dd>
            </div>
            <div>
              <dt className="font-semibold">Vial</dt>
              <dd style={{ color: MUTED }}>The small bottle that holds your compound, usually as a powder before mixing.</dd>
            </div>
            <div>
              <dt className="font-semibold">Reconstitute</dt>
              <dd style={{ color: MUTED }}>Adding bacteriostatic water to the powder so it becomes a liquid you can measure.</dd>
            </div>
            <div>
              <dt className="font-semibold">Bacteriostatic water</dt>
              <dd style={{ color: MUTED }}>Sterile water with a small amount of preservative used to dissolve research compounds.</dd>
            </div>
            <div>
              <dt className="font-semibold">Dose</dt>
              <dd style={{ color: MUTED }}>The amount you plan to take in one session, usually measured in micrograms (mcg) or milligrams (mg).</dd>
            </div>
            <div>
              <dt className="font-semibold">Syringe units</dt>
              <dd style={{ color: MUTED }}>The numbered marks on an insulin-style syringe. On a U-100 syringe, 100 units equals 1 milliliter (mL).</dd>
            </div>
          </dl>
        </section>

        {/* Stack feed */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">Explore the Stack Feed</h2>
          <p className="mb-4">
            Not sure where to begin? The <strong>Stack Feed</strong> is a library of pre-built research templates shared by the community. You can browse by goal, import a template into your own account, and edit it to fit your needs.
          </p>
          <p style={{ color: MUTED }}>
            Templates are starting points for your own research, not prescriptions or recommendations. Always do your own reading and consult a qualified professional before beginning any new research protocol.
          </p>
        </section>

        {/* Safety */}
        <section className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: `${MINT}15`, borderColor: MINT }}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-6 shrink-0 mt-0.5" style={{ color: MINT }} />
            <div>
              <h2 className="font-display text-xl font-bold mb-2">Safety first</h2>
              <ul className="list-disc ml-5 space-y-2 text-sm" style={{ color: INK }}>
                <li>Peptides sold online are for research and lab use only.</li>
                <li>Sayne does not provide medical advice, diagnoses, or treatment recommendations.</li>
                <li>Do not use Sayne to decide what to put in your body. Use it only to organize and track your existing research plan.</li>
                <li>Store your compounds safely, keep them away from children and pets, and follow all applicable laws in your area.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-6">
          <h2 className="font-display text-2xl font-bold mb-3">Ready to get organized?</h2>
          <p className="mb-5" style={{ color: MUTED }}>
            Create your free account and build your first stack in under five minutes.
          </p>
          <Link to="/signup">
            <Button size="lg" className="gap-2" style={{ backgroundColor: BABY_BLUE, color: INK }}>
              Start using Sayne <ArrowRight className="size-4" />
            </Button>
          </Link>
        </section>
      </div>
    </LegalLayout>
  );
}

function Step({
  number,
  title,
  children,
  color,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="size-8 rounded-full grid place-items-center text-sm font-bold shrink-0"
          style={{ backgroundColor: color, color: "#fff" }}
        >
          {number}
        </div>
        {number < 6 && <div className="w-px flex-1 mt-2" style={{ backgroundColor: "#DDD5F0" }} />}
      </div>
      <div className="pb-6">
        <h3 className="font-display text-lg font-bold mb-2">{title}</h3>
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
