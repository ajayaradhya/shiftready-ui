import { Video, Sun, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STEPS: { num: string; Icon: LucideIcon; text: string }[] = [
  { num: "01", Icon: Video, text: "Walk slowly through each room" },
  { num: "02", Icon: Sun,   text: "Good lighting helps AI see items" },
  { num: "03", Icon: Mic,   text: "Narrate item names or prices (optional)" },
];

export function HowTo() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
      {STEPS.map(({ num, Icon, text }) => (
        <div
          key={num}
          style={{
            background: "var(--sr-bg-card)",
            border: "1px solid var(--sr-border-subtle)",
            borderRadius: "var(--sr-radius-lg)",
            padding: 18,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--clay-50)", color: "var(--clay-600)",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}
          >
            <Icon size={18} strokeWidth={1.6} />
          </div>
          <div>
            <div style={{
              fontFamily: "var(--sr-font-mono)", fontSize: 10,
              color: "var(--sr-text-muted)", letterSpacing: "0.14em",
              textTransform: "uppercase", marginBottom: 2,
            }}>
              {num}
            </div>
            <div style={{
              fontSize: 13, lineHeight: 1.45,
              color: "var(--sr-text-primary)", fontWeight: 500,
            }}>
              {text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
