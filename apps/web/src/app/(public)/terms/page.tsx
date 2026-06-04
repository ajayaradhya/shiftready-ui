import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · ShiftReady",
};

const EFFECTIVE_DATE = "28 May 2026";

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 32px 80px" }}>
      <p
        style={{
          fontFamily: "var(--sr-font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: ".14em",
          color: "var(--ink-400, #9C9080)",
          marginBottom: 10,
        }}
      >
        Legal · Effective {EFFECTIVE_DATE}
      </p>
      <h1
        style={{
          fontFamily: "var(--sr-font-serif)",
          fontSize: 34,
          fontWeight: 500,
          letterSpacing: "-.02em",
          color: "var(--sr-text-primary, #1F1B17)",
          margin: "0 0 8px",
        }}
      >
        Terms of Service
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-400, #9C9080)", marginBottom: 48, lineHeight: 1.6 }}>
        Please read these terms carefully before using ShiftReady. By creating an account or using
        the platform, you agree to be bound by these terms.
      </p>

      <Section title="1. About ShiftReady">
        <p>
          ShiftReady is operated by Ajay B L (ABN pending), 50 Blytheswood Ave, Warrawee NSW 2074.
          ShiftReady provides a peer-to-peer marketplace platform that connects people moving home
          (&ldquo;sellers&rdquo;) with buyers interested in purchasing their household items.
        </p>
        <p>
          <strong>ShiftReady is not a party to any sale.</strong> All transactions are directly
          between buyers and sellers. ShiftReady does not handle money, hold items, or take
          responsibility for the outcome of any transaction.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least <strong>18 years old</strong> to create an account and use
          ShiftReady. By registering, you confirm you meet this requirement. We reserve the right
          to terminate accounts found to be in breach of this requirement.
        </p>
      </Section>

      <Section title="3. Your account">
        <p>
          You are responsible for maintaining the security of your account credentials. You must
          notify us immediately of any unauthorised access. We are not liable for loss arising from
          your failure to keep credentials secure.
        </p>
        <p>
          You may not create more than <strong>3 concurrent active sales</strong>. You may archive a
          sale to free a slot.
        </p>
        <p>
          Listings automatically expire after <strong>30 days of inactivity</strong>. You will
          receive a reminder at 27 days. Expired listings can be re-published.
        </p>
      </Section>

      <Section title="4. Listings and content">
        <p>
          You are solely responsible for the accuracy of your listings, including item descriptions,
          photos, and prices. ShiftReady uses AI (Google Gemini) to assist with identification and
          pricing suggestions; these suggestions are not guarantees and should be reviewed by you
          before publishing.
        </p>
        <p>
          By uploading content to ShiftReady you grant us a non-exclusive, royalty-free licence to
          store, display, and process that content for the purpose of operating the platform.
        </p>
      </Section>

      <Section title="5. Prohibited items">
        <p>The following items must not be listed on ShiftReady:</p>
        <ul>
          <li>Firearms, weapons, and ammunition</li>
          <li>Alcohol (resale is regulated under NSW liquor laws)</li>
          <li>Tobacco products and vaping devices</li>
          <li>Prescription pharmaceuticals</li>
          <li>Illicit drugs or drug paraphernalia</li>
          <li>Live animals</li>
          <li>Recalled or banned goods (as listed by the ACCC)</li>
          <li>Counterfeit goods</li>
          <li>Ivory, protected wildlife, or products made from them</li>
          <li>Adult or explicit content</li>
          <li>Stolen goods</li>
        </ul>
        <p>
          Listings breaching this policy will be removed and the account may be suspended or
          permanently banned. Illegal items may be reported to relevant authorities.
        </p>
      </Section>

      <Section title="6. Transactions and payment">
        <p>
          ShiftReady does not process payments. Buyers and sellers agree on price via the in-app
          messaging system and arrange payment and pickup directly. Common methods include cash on
          pickup or bank transfer. ShiftReady is not responsible for payment disputes.
        </p>
        <p>
          Sellers are solely responsible for any tax obligations arising from their sales, including
          GST where applicable. Peer-to-peer sales of second-hand personal goods are typically
          GST-free; consult the ATO or a tax professional if in doubt.
        </p>
      </Section>

      <Section title="7. Consumer guarantees (Australian Consumer Law)">
        <p>
          Nothing in these terms limits any right you may have under the{" "}
          <em>Competition and Consumer Act 2010</em> (Cth) (Australian Consumer Law). For B2C
          transactions where a seller is acting in trade or commerce, Australian Consumer Law
          guarantees apply and cannot be excluded.
        </p>
        <p>
          For private (non-business) sales, buyers should satisfy themselves as to the condition of
          items before purchase. ShiftReady provides no warranty on item condition.
        </p>
      </Section>

      <Section title="8. Disputes">
        <p>
          ShiftReady does not mediate disputes between buyers and sellers. If you are unable to
          resolve a dispute directly, you may contact your state consumer protection agency (NSW
          Fair Trading: <a href="https://www.fairtrading.nsw.gov.au" target="_blank" rel="noreferrer" style={linkStyle}>fairtrading.nsw.gov.au</a>)
          or seek resolution through your financial institution if payment has been made.
        </p>
      </Section>

      <Section title="9. Suspension and termination">
        <p>
          We may suspend or terminate your account for breach of these terms, the Acceptable Use
          Policy, or applicable law. You may delete your account at any time via Settings.
        </p>
      </Section>

      <Section title="10. Limitation of liability">
        <p>
          To the maximum extent permitted by law, ShiftReady is not liable for any indirect,
          incidental, or consequential loss arising from your use of the platform, including loss
          from any transaction between users.
        </p>
        <p>
          Our liability for any direct loss is limited to the greater of $100 AUD or the amount you
          paid to ShiftReady in the 12 months preceding the claim.
        </p>
      </Section>

      <Section title="11. Governing law">
        <p>
          These terms are governed by the laws of New South Wales, Australia. Any disputes will be
          subject to the exclusive jurisdiction of the courts of NSW.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these terms:{" "}
          <a href="mailto:be.el.ajay@gmail.com" style={linkStyle}>
            be.el.ajay@gmail.com
          </a>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontFamily: "var(--sr-font-serif)",
          fontSize: 18,
          fontWeight: 500,
          color: "var(--sr-text-primary, #1F1B17)",
          margin: "0 0 12px",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.75,
          color: "var(--sr-text-secondary, #3A3528)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

const linkStyle: React.CSSProperties = {
  color: "var(--clay-600, #B5604A)",
  textDecoration: "none",
};
