import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Sayne" },
      { name: "description", content: "The terms governing your use of Sayne." },
    ],
  }),
  component: TermsPage,
});

const INK = "#2D1F4A";

function H2({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2
      className="font-display font-semibold mt-12 mb-4 text-xl md:text-2xl"
      style={{ color: INK }}
    >
      {n}. {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-display font-semibold mt-6 mb-2 text-base md:text-lg"
      style={{ color: INK }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 mb-4 space-y-1.5">{children}</ul>;
}

function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="June 1, 2026">
      <P>
        <strong>Operated by:</strong> BioQuant Systems LLC ("Sayne," "we," "us," or "our")
        <br />
        <strong>Effective Date:</strong> June 1, 2026
      </P>

      <H2 n={1}>Agreement to Terms</H2>
      <P>
        These Terms of Service ("Terms") form a binding agreement between you and BioQuant
        Systems LLC ("Sayne," "we," "us," or "our") governing your use of the Sayne
        platform at sayne.io and related applications (the "Service").
      </P>
      <P>
        By creating an account or using the Service, you agree to these Terms, our Privacy
        Policy, and our Disclaimer. If you do not agree, do not use the Service.
      </P>

      <H2 n={2}>Eligibility</H2>
      <P>
        You must be at least 18 years old and able to form a binding contract to use the
        Service. By using Sayne, you represent and warrant that you meet these
        requirements.
      </P>

      <H2 n={3}>What Sayne Is — And What It Is Not</H2>
      <P>
        Sayne is a software tool for organizing, tracking, and recording information
        related to compounds, protocols, inventory, schedules, and self-recorded
        observations, for personal research and informational purposes.
      </P>
      <P><strong>Sayne is not:</strong></P>
      <UL>
        <li>A medical device</li>
        <li>A provider of medical advice, diagnosis, or treatment</li>
        <li>A pharmacy, compounding facility, prescriber, or seller of any compound</li>
        <li>A substitute for consultation with a qualified, licensed healthcare professional</li>
      </UL>
      <P>
        Sayne does not recommend, prescribe, endorse, supply, or evaluate any compound,
        dose, protocol, or vendor. Any information displayed in the Service — including
        calculators, templates, community content, degradation estimates, and parsed
        protocols — is provided for informational and organizational purposes only and is
        not medical advice. You are solely responsible for your own decisions and actions.
      </P>

      <H2 n={4}>No Medical Advice; Assumption of Risk</H2>
      <P>You acknowledge and agree that:</P>
      <UL>
        <li>
          You use the Service to track information about decisions you have made
          independently or in consultation with your own qualified professionals.
        </li>
        <li>
          Sayne does not tell you what to take, how much to take, or whether any compound
          or protocol is safe or appropriate for you.
        </li>
        <li>
          Reference values, templates, and community content are general information, not
          personalized recommendations, and may be inaccurate or inapplicable to you.
        </li>
        <li>
          You should consult a licensed healthcare professional before beginning, changing,
          or stopping any protocol.
        </li>
        <li>You assume all risk arising from your own decisions and use of any compound.</li>
      </UL>

      <H2 n={5}>User Content</H2>
      <H3>a) Your Content</H3>
      <P>
        You retain ownership of the information you enter into the Service ("User
        Content"). You grant us a limited license to store, process, and display your User
        Content as necessary to operate the Service.
      </P>
      <H3>b) Shared / Community Content</H3>
      <P>
        If you choose to share content to community features (such as the Stack Feed), you
        grant us and other users a license to view and use that anonymized content within
        the Service. You are responsible for ensuring your shared content does not violate
        these Terms or applicable law, and that it makes no false claims.
      </P>
      <H3>c) Prohibited Content</H3>
      <P>
        You agree not to post content that is unlawful, false, misleading, infringing,
        harmful, or that constitutes medical advice directed at others, marketing of
        compounds for sale, or solicitation.
      </P>

      <H2 n={6}>Acceptable Use</H2>
      <P>You agree not to:</P>
      <UL>
        <li>Use the Service for any unlawful purpose</li>
        <li>
          Use the Service to facilitate the sale, distribution, or marketing of any
          compound or controlled substance
        </li>
        <li>Misrepresent yourself or impersonate others</li>
        <li>Attempt to reverse engineer, scrape, overload, or disrupt the Service</li>
        <li>Upload malicious code or attempt to gain unauthorized access</li>
        <li>Use the Service to provide medical advice to others</li>
      </UL>

      <H2 n={7}>Accounts</H2>
      <P>
        You are responsible for maintaining the confidentiality of your account
        credentials and for all activity under your account. Notify us immediately of any
        unauthorized use.
      </P>

      <H2 n={8}>Subscriptions and Payments</H2>
      <P>
        The Service is currently provided free of charge. If we introduce paid
        subscriptions in the future, we will disclose pricing, billing, renewal, and
        refund terms at the point of purchase and update these Terms accordingly.
      </P>

      <H2 n={9}>Third-Party Services</H2>
      <P>
        The Service integrates third-party providers (such as database, AI processing, and
        payment providers) and may link to third-party content. We are not responsible for
        third-party services, and your use of them may be subject to their own terms.
      </P>

      <H2 n={10}>Intellectual Property</H2>
      <P>
        The Service, including its design, software, branding, "Sayne" name and logo, and
        content we create, is owned by BioQuant Systems LLC and protected by intellectual
        property laws. You may not copy, modify, distribute, or create derivative works
        without our permission.
      </P>

      <H2 n={11}>Disclaimer of Warranties</H2>
      <P>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
        EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE
        SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT ANY INFORMATION (INCLUDING
        CALCULATORS, DEGRADATION ESTIMATES, TEMPLATES, OR PARSED PROTOCOLS) IS ACCURATE,
        COMPLETE, OR RELIABLE. YOU USE THE SERVICE AND ANY INFORMATION IT PROVIDES AT YOUR
        OWN RISK.
      </P>

      <H2 n={12}>Limitation of Liability</H2>
      <P>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, BIOQUANT SYSTEMS LLC AND ITS OWNERS,
        OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
        SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA, OR
        GOODWILL, OR FOR ANY PERSONAL INJURY OR HEALTH OUTCOME, ARISING FROM OR RELATED
        TO YOUR USE OF THE SERVICE OR ANY DECISION OR ACTION YOU TAKE BASED ON INFORMATION
        IN THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
      </P>
      <P>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING
        FROM OR RELATED TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU
        PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS
        ($100).
      </P>

      <H2 n={13}>Indemnification</H2>
      <P>
        You agree to indemnify and hold harmless BioQuant Systems LLC and its owners,
        officers, employees, and agents from any claims, damages, liabilities, and
        expenses (including reasonable legal fees) arising from your use of the Service,
        your User Content, your violation of these Terms, or your violation of any law or
        rights of a third party.
      </P>

      <H2 n={14}>Termination</H2>
      <P>
        We may suspend or terminate your access to the Service at any time, with or
        without notice, for any reason, including violation of these Terms. You may stop
        using the Service and delete your account at any time.
      </P>

      <H2 n={15}>Governing Law and Disputes</H2>
      <P>
        These Terms are governed by the laws of the State of Texas, without regard to its
        conflict-of-laws rules. [You and your attorney should decide on venue and whether
        to include an arbitration clause and class-action waiver — these are commonly
        added here and an attorney should tailor them.]
      </P>

      <H2 n={16}>Changes to These Terms</H2>
      <P>
        We may modify these Terms from time to time. We will post the updated version with
        a new "Last Updated" date and, where appropriate, notify you within the Service.
        Continued use after changes take effect constitutes acceptance.
      </P>

      <H2 n={17}>Contact Us</H2>
      <P>
        BioQuant Systems LLC
        <br />
        6220 Westpark Drive
        <br />
        Suite 149 #B434
        <br />
        Houston, TX 77057
        <br />
        Email: support@sayne.io
      </P>
    </LegalLayout>
  );
}
