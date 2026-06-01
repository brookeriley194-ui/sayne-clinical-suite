import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — Sayne" },
      { name: "description", content: "Important information about how to use Sayne safely." },
    ],
  }),
  component: DisclaimerPage,
});

const INK = "#2D1F4A";

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-display font-semibold mt-12 mb-4 text-xl md:text-2xl uppercase tracking-wide"
      style={{ color: INK }}
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 mb-4 space-y-1.5">{children}</ul>;
}

function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" lastUpdated="June 1, 2026">
      <P>
        <strong>Operated by:</strong> BioQuant Systems LLC
      </P>

      <H2>Not Medical Advice</H2>
      <P>
        The information provided by Sayne (the "Service"), operated by BioQuant Systems
        LLC, is for general informational, organizational, and research-tracking purposes
        only. It is not intended to be and should not be construed as medical advice,
        diagnosis, or treatment.
      </P>
      <P>
        Sayne is a tracking and organizational tool. It does not recommend, prescribe,
        endorse, or evaluate any compound, dose, protocol, or vendor, and it is not a
        substitute for the advice of a qualified, licensed healthcare professional.
      </P>

      <H2>Always Consult a Professional</H2>
      <P>
        Always seek the advice of your physician or another qualified healthcare provider
        with any questions you may have regarding a medical condition, a substance, or any
        protocol. Never disregard professional medical advice or delay seeking it because
        of something you read, calculated, or tracked using Sayne.
      </P>
      <P>
        Do not begin, change, or stop any protocol based on information in the Service
        without first consulting a qualified professional.
      </P>

      <H2>Information Is Not Verified or Personalized</H2>
      <P>
        Any reference information in the Service — including dose calculators, degradation
        and potency estimates, half-life values, protocol templates, community-shared
        content, and AI-parsed protocols — consists of general information and estimates.
        This information:
      </P>
      <UL>
        <li>May be incomplete, inaccurate, or out of date</li>
        <li>Is not personalized to your individual circumstances, health, or needs</li>
        <li>Reflects general or commonly-referenced information, not clinical guidance</li>
        <li>Should be independently verified before you rely on it</li>
      </UL>
      <P>
        Calculations and estimates (such as draw volumes and potency percentages) are
        provided as a convenience and may not reflect your actual materials or conditions.
        You are responsible for verifying any calculation before acting on it.
      </P>

      <H2>Community and Template Content</H2>
      <P>
        Protocol templates and community-shared stacks are provided for educational and
        informational reference only. They represent commonly-discussed protocol
        structures or content that other users have chosen to share in anonymized form.
        They are NOT:
      </P>
      <UL>
        <li>Personal medical recommendations</li>
        <li>Verified or endorsed by Sayne</li>
        <li>Guaranteed to be safe, effective, or appropriate for anyone</li>
      </UL>
      <P>
        Sayne does not verify the accuracy of community content and is not responsible for
        it. Self-reported observations shared by users are personal experiences, not
        evidence of safety or efficacy.
      </P>

      <H2>No Supply or Sale of Compounds</H2>
      <P>
        Sayne does not sell, supply, distribute, compound, or facilitate the purchase of
        any compound. Sayne is vendor-neutral and has no commercial relationship with any
        seller of any compound displayed or referenced in the Service. References to
        compounds or vendors are not endorsements.
      </P>

      <H2>Assumption of Risk</H2>
      <P>
        By using Sayne, you acknowledge that any decisions you make and any actions you
        take regarding compounds or protocols are your own responsibility and at your own
        risk. To the maximum extent permitted by law, BioQuant Systems LLC disclaims all
        liability for any outcome arising from your use of the Service or reliance on its
        information.
      </P>

      <H2>For Adults Only</H2>
      <P>The Service is intended for adults aged 18 and older.</P>

      <H2>Contact</H2>
      <P>
        BioQuant Systems LLC
        <br />
        Email: support@sayne.io
      </P>
    </LegalLayout>
  );
}
