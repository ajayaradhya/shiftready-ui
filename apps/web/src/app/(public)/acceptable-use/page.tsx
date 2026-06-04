import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy · ShiftReady",
};

const EFFECTIVE_DATE = "28 May 2026";

export default function AcceptableUsePage() {
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
        Acceptable Use Policy
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-400, #9C9080)", marginBottom: 48, lineHeight: 1.6 }}>
        This policy sets out what is and is not acceptable behaviour on ShiftReady. It applies to
        all users and supplements our{" "}
        <a href="/terms" style={linkStyle}>
          Terms of Service
        </a>
        .
      </p>

      <Section title="1. Respectful communication">
        <p>You must not use ShiftReady to:</p>
        <ul>
          <li>Harass, threaten, or abuse other users, including via private messages.</li>
          <li>
            Send unsolicited bulk messages or use the platform to spam buyers or sellers.
          </li>
          <li>Discriminate against users based on race, gender, religion, disability, or other
          protected attributes.</li>
        </ul>
      </Section>

      <Section title="2. Fair dealing">
        <p>You must not:</p>
        <ul>
          <li>
            Pressure buyers or sellers to conduct transactions off-platform in order to avoid our
            safety features, message history, or future dispute evidence.
          </li>
          <li>
            Artificially inflate views or save counts by using bots, scripts, or coordinated
            click-farming.
          </li>
          <li>
            Create fake listings, phantom offers, or shill bidding to manipulate prices or
            visibility.
          </li>
          <li>
            Impersonate another person, including by choosing a username that resembles another
            user&apos;s identity.
          </li>
        </ul>
      </Section>

      <Section title="3. Scam prevention">
        <p>You must not:</p>
        <ul>
          <li>List items you do not own or do not intend to sell.</li>
          <li>Accept payment for an item and then fail to complete the sale without refunding.</li>
          <li>
            Use phishing links, fake payment pages, or social engineering in messages to extract
            money or credentials from other users.
          </li>
          <li>
            Attempt to bypass the report system by threatening or discouraging victims from
            reporting fraud.
          </li>
        </ul>
      </Section>

      <Section title="4. Platform integrity">
        <p>You must not:</p>
        <ul>
          <li>Attempt to reverse-engineer, scrape, or extract data from ShiftReady at scale.</li>
          <li>
            Introduce malware, exploits, or malicious code via uploaded content or messages.
          </li>
          <li>
            Circumvent authentication, rate limits, or access controls.
          </li>
        </ul>
      </Section>

      <Section title="5. Reporting violations">
        <p>
          If you encounter a listing or user that breaches this policy, use the in-app{" "}
          <strong>Report</strong> button. Reports are reviewed manually. Categories include:{" "}
          <em>Illegal / Restricted item</em>, <em>Unsafe item</em>, <em>Scam or fraud</em>,{" "}
          <em>Harassment</em>, and <em>Other</em>.
        </p>
        <p>
          Urgent safety matters should also be reported to NSW Police. Do not use ShiftReady to
          report illegal activity to law enforcement — contact triple zero (000) for emergencies.
        </p>
      </Section>

      <Section title="6. Enforcement">
        <p>
          Violations may result in warning, listing removal, temporary suspension, or permanent
          account ban, at our sole discretion. Severe violations (fraud, distribution of illegal
          content) may be referred to law enforcement.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          To report a breach of this policy or ask a question:{" "}
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
