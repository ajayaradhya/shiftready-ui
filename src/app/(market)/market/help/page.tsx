"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, LifeBuoy, Mail } from "lucide-react";

const SUPPORT_EMAIL = "support@myrio.com.au";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How does Myrio work?",
    a: "Sellers film a walkthrough of their home and our AI automatically identifies, describes, and prices every item. The sale is then published to the marketplace so buyers can browse, save, and message the seller directly.",
  },
  {
    q: "Is it free to list on Myrio?",
    a: "Yes — listing your sale is completely free. Myrio is in early access and we're focused on helping people move stress-free.",
  },
  {
    q: "How do I buy something?",
    a: 'Browse the marketplace, find an item you like, and tap "Express Interest" or "Message Seller" to open a chat. Negotiate directly with the seller and arrange a pickup time that works for both of you.',
  },
  {
    q: "Are the prices negotiable?",
    a: "Yes. AI pricing gives a fair starting point but all deals are between you and the seller. Use the in-app messaging to make an offer.",
  },
  {
    q: "How do I know a seller is legitimate?",
    a: "All sellers are verified via Firebase Authentication (Google or email). Seller usernames are shown instead of real names to protect privacy — identities are confirmed by the platform.",
  },
  {
    q: "What happens after I agree on a price?",
    a: "The seller marks the item as sold in the app, which reserves it for you. Pickup is arranged directly with the seller via the messages thread.",
  },
  {
    q: "Can I save items to buy later?",
    a: "Yes — tap the heart icon on any sale or item to save it. Your saved items live in the Saved section accessible from the navigation bar.",
  },
  {
    q: "How do I start selling?",
    a: "Create a free account, go to Seller Central, and start a new sale. You can capture items live using your phone camera — each tap identifies the item automatically.",
  },
  {
    q: "What areas does Myrio cover?",
    a: "Myrio is available across Australia, with early sellers primarily in Sydney and surrounding suburbs. More areas are being added as the platform grows.",
  },
  {
    q: "How do I contact support?",
    a: `Email us at ${SUPPORT_EMAIL} and we'll get back to you within one business day.`,
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid var(--sr-border-subtle)",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "var(--sr-font-sans)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--sr-text-primary)",
          }}
        >
          {q}
        </span>
        {open ? (
          <ChevronUp size={16} color="var(--ink-400)" style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={16} color="var(--ink-400)" style={{ flexShrink: 0 }} />
        )}
      </button>
      {open && (
        <p
          style={{
            fontSize: 13,
            color: "var(--ink-500)",
            lineHeight: 1.6,
            paddingBottom: 16,
            margin: 0,
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div style={{ padding: "40px 24px 80px", maxWidth: 720, margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--sr-font-serif)",
          fontSize: 28,
          fontWeight: 500,
          color: "var(--sr-text-primary)",
          marginBottom: 6,
        }}
      >
        Help &amp; FAQ
      </h1>
      <p style={{ fontSize: 13, color: "var(--ink-400)", marginBottom: 40 }}>
        Common questions about buying and selling on Myrio.
      </p>

      {/* FAQ list */}
      <div
        style={{
          borderRadius: "var(--sr-radius-xl)",
          border: "1px solid var(--sr-border-subtle)",
          background: "var(--sr-bg-card)",
          padding: "0 24px",
          marginBottom: 32,
        }}
      >
        {FAQS.map((faq) => (
          <FaqItem key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>

      {/* Contact card */}
      <div
        style={{
          borderRadius: "var(--sr-radius-xl)",
          border: "1px solid var(--sr-border-subtle)",
          background: "var(--sr-bg-card)",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--sr-radius-lg)",
            background: "var(--clay-50)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <LifeBuoy size={22} color="var(--clay-500)" strokeWidth={1.5} />
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--sr-font-serif)",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--sr-text-primary)",
              marginBottom: 6,
            }}
          >
            Still need help?
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-400)", marginBottom: 16 }}>
            Our team responds within one business day.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: "var(--sr-radius-full)",
              background: "var(--clay-500)",
              color: "#fff",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Mail size={14} strokeWidth={1.5} />
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
