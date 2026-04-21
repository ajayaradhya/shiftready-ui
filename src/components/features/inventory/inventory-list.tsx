"use client";

import { InventoryCard } from "./inventory-card";

export function InventoryList() {
  return (
    <section className="w-full md:w-[45%] h-full overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-12 pb-32">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between border-b border-outline-variant/10 pb-2">
          <h3 className="text-xl font-medium text-on-surface">Living Room</h3>
          <span className="text-xs text-on-surface-variant uppercase tracking-widest">4 Items</span>
        </div>
        
        {/* We will map over real data here shortly */}
        <div className="flex flex-col gap-4">
          {/* Component mapping placeholder */}
        </div>
      </div>
    </section>
  );
}