import Link from "next/link";

const LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Acceptable Use", href: "/acceptable-use" },
  { label: "Contact", href: "mailto:be.el.ajay@gmail.com" },
];

export function LegalFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--sr-border-subtle, #EDE5D6)",
        background: "var(--sr-bg-app, #FAF6F0)",
        padding: "20px 32px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px 20px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--sr-font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: ".12em",
          color: "var(--ink-400, #9C9080)",
          marginRight: 4,
        }}
      >
        ShiftReady · ABN pending
      </span>
      {LINKS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          style={{
            fontFamily: "var(--sr-font-sans)",
            fontSize: 12,
            color: "var(--ink-400, #9C9080)",
            textDecoration: "none",
          }}
        >
          {label}
        </Link>
      ))}
    </footer>
  );
}
