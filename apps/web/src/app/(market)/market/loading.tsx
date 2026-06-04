import { ConveyorBeltSkeleton } from "@/components/features/marketplace/displays/conveyor-belt";
import { PolaroidPileSkeleton } from "@/components/features/marketplace/displays/polaroid-pile";
import { ReceiptRollSkeleton } from "@/components/features/marketplace/displays/receipt-roll";

export default function MarketLoading() {
  return (
    <div style={{ padding: "0 0 80px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Filter bar skeleton */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0 24px", flexWrap: "wrap" }}>
          <div style={{ height: 36, width: 140, borderRadius: 24, background: "var(--cream-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 36, width: 100, borderRadius: 24, background: "var(--cream-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 36, width: 100, borderRadius: 24, background: "var(--cream-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 36, width: 80, borderRadius: 24, background: "var(--cream-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 36, width: 80, borderRadius: 24, background: "var(--cream-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>

        {/* Section title skeleton */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ height: 28, width: 260, borderRadius: 6, background: "var(--cream-200)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 14, width: 160, borderRadius: 4, background: "var(--cream-100)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>

        <ConveyorBeltSkeleton />

        <div style={{ marginTop: 56, marginBottom: 20 }}>
          <div style={{ height: 28, width: 220, borderRadius: 6, background: "var(--cream-200)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>

        <PolaroidPileSkeleton />

        <div style={{ marginTop: 56, marginBottom: 20 }}>
          <div style={{ height: 28, width: 180, borderRadius: 6, background: "var(--cream-200)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>

        <ReceiptRollSkeleton />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
