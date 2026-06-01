import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Sayne" },
      { name: "description", content: "How Sayne handles your data and privacy." },
    ],
  }),
  component: PrivacyPage,
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

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="June 1, 2026">
      <P>
        <strong>Operated by:</strong> BioQuant Systems LLC ("Sayne," "we," "us," or "our")
        <br />
        <strong>Effective Date:</strong> June 1, 2026
      </P>

      <H2 n={1}>Introduction</H2>
      <P>
        This Privacy Policy explains how BioQuant Systems LLC ("we," "us," or "our"),
        operator of the Sayne platform available at sayne.io and related applications
        (collectively, the "Service"), collects, uses, discloses, and safeguards your
        information when you use the Service.
      </P>
      <P>
        By accessing or using Sayne, you agree to the collection and use of information in
        accordance with this Privacy Policy. If you do not agree, please do not use the
        Service.
      </P>
      <P>
        Sayne is a research and tracking utility. It is not a medical device, and it does
        not provide medical advice, diagnosis, or treatment. See our Disclaimer and Terms
        of Service for more.
      </P>

      <H2 n={2}>Information We Collect</H2>
      <P>We collect the following categories of information:</P>

      <H3>a) Account Information</H3>
      <UL>
        <li>Email address</li>
        <li>Display name (if provided)</li>
        <li>Password (stored in encrypted/hashed form; we never see your plaintext password)</li>
        <li>Account role or preferences you select</li>
      </UL>

      <H3>b) Information You Enter Into the Service</H3>
      <UL>
        <li>Compounds, vials, and inventory details you add</li>
        <li>Stacks, protocols, dosing schedules, and notes you create or import</li>
        <li>Dose logs and check-off history</li>
        <li>Journal entries (such as self-reported energy, sleep, recovery, and mood ratings)</li>
        <li>Reconstitution dates, storage details, and related tracking data</li>
      </UL>

      <H3>c) Receipt Processing Data</H3>
      <UL>
        <li>
          When you use the Scan Receipt feature, you may upload an image or PDF of a
          purchase receipt. This image is processed by an automated AI service to extract
          product information (such as compound name, quantity, and date).
        </li>
        <li>
          We do NOT store the receipt image after processing. The image is discarded once
          the relevant product information has been extracted.
        </li>
        <li>
          We do NOT extract or store payment card numbers, banking details, or billing
          information from receipts.
        </li>
      </UL>

      <H3>d) Community / Shared Content</H3>
      <UL>
        <li>
          If you choose to share a stack to the Stack Feed, the protocol details you elect
          to share are published in anonymized form. We do not attach your name, email, or
          identifying account details to shared content.
        </li>
      </UL>

      <H3>e) Automatically Collected Information</H3>
      <UL>
        <li>Basic usage and analytics data (such as pages visited and features used)</li>
        <li>Device and browser information</li>
        <li>Crash logs and diagnostic data</li>
        <li>General location inferred from IP address (not precise GPS location)</li>
      </UL>

      <H3>f) Information We Do NOT Intentionally Collect</H3>
      <UL>
        <li>
          We do not request or require government identifiers, Social Security numbers, or
          payment card numbers through receipt scanning.
        </li>
        <li>
          We are not intended for use by anyone under 18, and we do not knowingly collect
          information from minors.
        </li>
      </UL>

      <H2 n={3}>How We Use Your Information</H2>
      <P>We use the information we collect to:</P>
      <UL>
        <li>Provide, operate, and maintain the Service</li>
        <li>Create and manage your account</li>
        <li>Save and display your vials, stacks, schedules, logs, and journal entries</li>
        <li>Process receipts you upload in order to add items to your inventory</li>
        <li>Power features such as the dose calculator, degradation tracking, and reminders</li>
        <li>Display anonymized community content you choose to share</li>
        <li>Improve the Service, including aggregate and de-identified analysis</li>
        <li>Communicate with you about your account, updates, and support</li>
        <li>Detect, prevent, and address technical issues, fraud, or abuse</li>
        <li>Comply with legal obligations</li>
      </UL>

      <H2 n={4}>How We Share Your Information</H2>
      <P>
        We do not sell your personal information. We share information only as follows:
      </P>

      <H3>a) Service Providers (Processors)</H3>
      <P>We use trusted third-party providers to operate the Service, including:</P>
      <UL>
        <li>Supabase — database hosting and storage of your account and tracking data</li>
        <li>
          Google (Gemini) — automated processing of pasted protocols and uploaded receipts
          to extract structured information
        </li>
        <li>Analytics and error-monitoring providers</li>
      </UL>
      <P>
        These providers may process your information only on our behalf and under
        obligations consistent with this Policy.
      </P>

      <H3>b) Anonymized Community Content</H3>
      <P>
        Content you choose to share to the Stack Feed is displayed to other users in
        anonymized form.
      </P>

      <H3>c) Legal and Safety</H3>
      <P>
        We may disclose information if required by law, regulation, legal process, or
        governmental request, or to protect the rights, property, or safety of Sayne, our
        users, or others.
      </P>

      <H3>d) Business Transfers</H3>
      <P>
        If we are involved in a merger, acquisition, financing, or sale of assets, your
        information may be transferred as part of that transaction.
      </P>

      <H2 n={5}>Data Retention</H2>
      <P>
        We retain your account and tracking information for as long as your account is
        active or as needed to provide the Service. You may delete your data or close your
        account at any time (see Section 8). Uploaded receipt images are discarded
        immediately after processing and are not retained.
      </P>

      <H2 n={6}>Data Security</H2>
      <P>
        We implement reasonable technical and organizational measures designed to protect
        your information, including encryption in transit, hashed password storage, and
        access controls. However, no method of transmission or storage is completely
        secure, and we cannot guarantee absolute security.
      </P>

      <H2 n={7}>Your Privacy Rights</H2>
      <P>
        Depending on where you live, you may have rights regarding your personal
        information.
      </P>

      <H3>a) California Residents (CCPA/CPRA)</H3>
      <P>
        You have the right to know what personal information we collect, to request
        deletion, to correct inaccurate information, and to opt out of the "sale" or
        "sharing" of personal information. We do not sell your personal information. To
        exercise these rights, contact us at support@sayne.io.
      </P>

      <H3>b) European Economic Area / UK Residents (GDPR)</H3>
      <P>
        You have the right to access, correct, delete, restrict, or object to processing
        of your personal data, and the right to data portability. Our legal bases for
        processing include performance of a contract (providing the Service), your
        consent, and our legitimate interests. To exercise these rights, contact us at
        support@sayne.io.
      </P>

      <H3>c) All Users</H3>
      <P>
        You may access and edit most of your information directly within the Service, and
        you may request deletion of your account and associated data.
      </P>

      <H2 n={8}>Deleting Your Data</H2>
      <P>
        You may delete individual entries within the Service at any time. To delete your
        entire account and associated personal data, use the account deletion option in
        Settings or contact us at support@sayne.io. We will process deletion requests as
        required by applicable law.
      </P>

      <H2 n={9}>Children's Privacy</H2>
      <P>
        The Service is intended for adults aged 18 and older. We do not knowingly collect
        personal information from anyone under 18. If we learn we have collected
        information from a minor, we will delete it.
      </P>

      <H2 n={10}>International Users</H2>
      <P>
        The Service is operated from the United States. If you access it from outside the
        U.S., you understand your information will be processed in the United States,
        where data protection laws may differ from those in your country.
      </P>

      <H2 n={11}>Third-Party Links</H2>
      <P>
        The Service may contain links to third-party websites or services. We are not
        responsible for the privacy practices of those third parties. This Policy applies
        only to Sayne.
      </P>

      <H2 n={12}>Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. We will post the updated
        version with a new "Last Updated" date, and where appropriate, notify you within
        the Service.
      </P>

      <H2 n={13}>Contact Us</H2>
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
      <P>
        For privacy-related requests, please include enough information for us to verify
        your identity and locate your data.
      </P>
    </LegalLayout>
  );
}
