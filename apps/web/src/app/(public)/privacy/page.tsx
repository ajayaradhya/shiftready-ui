import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Myrio",
};

const EFFECTIVE_DATE = "28 May 2026";

export default function PrivacyPolicyPage() {
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
        Privacy Policy
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-400, #9C9080)", marginBottom: 48, lineHeight: 1.6 }}>
        Myrio is committed to protecting your privacy in accordance with the{" "}
        <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
      </p>

      <Section title="1. Who we are">
        <p>
          Myrio is operated by Ajay B L (ABN pending), located at 50 Blytheswood Ave, Warrawee
          NSW 2074. Contact:{" "}
          <a href="mailto:be.el.ajay@gmail.com" style={linkStyle}>
            be.el.ajay@gmail.com
          </a>
          .
        </p>
        <p>
          Myrio is a peer-to-peer residential moving marketplace. We provide the platform;
          individual sellers and buyers are the parties to any sale.
        </p>
      </Section>

      <Section title="2. Information we collect (APP 1)">
        <p>We collect the following personal information:</p>
        <ul>
          <li>
            <strong>Account data:</strong> name, email address, password (hashed by Firebase Auth),
            optional phone number.
          </li>
          <li>
            <strong>Profile data:</strong> display name, username, suburb, state, biography.
          </li>
          <li>
            <strong>Listing content:</strong> photos of household items and home interiors uploaded
            during the walkthrough or live capture process.
          </li>
          <li>
            <strong>Communications:</strong> messages sent via the in-app messaging system, including
            offers and counter-offers.
          </li>
          <li>
            <strong>Transaction data:</strong> records of accepted offers and marked-sold events.
          </li>
          <li>
            <strong>Usage data:</strong> IP address, device type, browser, pages visited, and
            interactions collected via Google Analytics 4.
          </li>
        </ul>
        <p>
          We collect information only for the purposes set out in this policy and only when reasonably
          necessary.
        </p>
      </Section>

      <Section title="3. How we use your information (APP 6)">
        <p>We use personal information to:</p>
        <ul>
          <li>Operate and improve the Myrio platform.</li>
          <li>
            Process listing content through Google Gemini AI to identify, describe, and price items.
          </li>
          <li>Enable buyers and sellers to communicate about listings.</li>
          <li>Send transactional notifications (offer alerts, message digests).</li>
          <li>Comply with legal obligations.</li>
        </ul>
        <p>
          We will not use or disclose your information for a secondary purpose without your consent,
          unless permitted by the APPs.
        </p>
      </Section>

      <Section title="4. Data storage and security (APP 11)">
        <p>Your data is stored in Australia using the following Google Cloud Platform services:</p>
        <ul>
          <li>
            <strong>Firestore:</strong> native mode, multi-region (eur3 and nam5 replicas do not
            apply — data is in the <code>australia-southeast1</code> region).
          </li>
          <li>
            <strong>Google Cloud Storage:</strong> <code>australia-southeast1</code> region. Media
            files are accessible only via time-limited signed URLs; raw GCS paths are never exposed.
          </li>
        </ul>
        <p>
          We implement reasonable technical and organisational measures to protect your information
          from misuse, interference, loss, and unauthorised access, including Firebase Auth
          authentication, per-resource access controls, and TLS in transit.
        </p>
      </Section>

      <Section title="5. Third-party processors">
        <p>We share data with the following processors under data-processing agreements:</p>
        <ul>
          <li>
            <strong>Google LLC</strong> — Firebase Auth, Firestore, Cloud Storage, Gemini AI, Google
            Analytics 4. Data processed under Google&apos;s Cloud Data Processing Addendum.
          </li>
          <li>
            <strong>Sentry</strong> — error tracking. Error payloads may contain partial request
            data. Personal information is minimised via data-scrubbing configuration.
          </li>
        </ul>
        <p>
          We do not sell your personal information to third parties.
        </p>
      </Section>

      <Section title="6. Data retention">
        <ul>
          <li>Active account data: retained while your account exists.</li>
          <li>
            Deleted account data: PII scrubbed within 30 days of deletion; transaction records
            retained for 7 years per ATO requirements.
          </li>
          <li>Capture-frame photos not associated with a published sale: deleted after 7 days.</li>
          <li>Sale media (archived sales): moved to cold storage after 90 days, deleted after 365 days.</li>
          <li>Notification records: deleted after 90 days.</li>
        </ul>
      </Section>

      <Section title="7. Access and correction (APP 12)">
        <p>
          You may access a copy of the personal information we hold about you at any time via{" "}
          <strong>Settings → Export my data</strong> in the app, or by emailing us. You may correct
          inaccurate information via your profile settings or by contacting us.
        </p>
      </Section>

      <Section title="8. Account deletion (APP 13)">
        <p>
          You may request deletion of your account and personal information at any time via{" "}
          <strong>Settings → Delete account</strong> or by emailing{" "}
          <a href="mailto:be.el.ajay@gmail.com" style={linkStyle}>
            be.el.ajay@gmail.com
          </a>
          . As noted above, transaction records are retained for 7 years.
        </p>
      </Section>

      <Section title="9. Notifications and opt-out (Spam Act 2003)">
        <p>
          We may send you transactional email notifications (new message, offer received, etc.). Each
          notification email includes a functional unsubscribe link. You can also manage notification
          preferences in <strong>Settings → Notifications</strong>.
        </p>
        <p>
          We do not send commercial electronic messages without your consent.
        </p>
      </Section>

      <Section title="10. Complaints (OAIC)">
        <p>
          If you believe we have breached the APPs, please contact us first at{" "}
          <a href="mailto:be.el.ajay@gmail.com" style={linkStyle}>
            be.el.ajay@gmail.com
          </a>
          . If we do not resolve your complaint within 30 days, you may lodge a complaint with the
          Office of the Australian Information Commissioner (OAIC) at{" "}
          <a
            href="https://www.oaic.gov.au/privacy/privacy-complaints"
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
          >
            oaic.gov.au
          </a>
          .
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be notified via the app
          or email. Continued use after notice constitutes acceptance.
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
