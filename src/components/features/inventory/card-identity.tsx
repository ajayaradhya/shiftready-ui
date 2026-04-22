"use client";

import { InventoryItem } from "@/lib/types";

interface CardIdentityProps {
  name: string;
  brand: string;
  year: number | string;
  onUpdate: (field: keyof InventoryItem, value: any) => void;
  onNumberUpdate: (field: keyof InventoryItem, value: string) => void;
}

export function CardIdentity({ name, brand, year, onUpdate, onNumberUpdate }: CardIdentityProps) {
  return (
    <div className="flex flex-col gap-1.5 pr-10">
      <input 
        className="bg-transparent border-none text-xl font-bold text-on-surface w-full p-0 outline-none focus:text-primary placeholder:opacity-20 transition-colors"
        defaultValue={name}
        onBlur={(e) => onUpdate('name', e.target.value)}
      />
      <div className="flex items-center gap-4">
        <input 
          className="bg-transparent border-none text-xs text-on-surface-variant uppercase tracking-[0.2em] font-black w-1/2 p-0 outline-none focus:text-on-surface"
          defaultValue={brand || "UNKNOWN"}
          onBlur={(e) => onUpdate('brand', e.target.value)}
        />
        <div className="flex items-center gap-1.5 border-l border-outline-variant/20 pl-4">
          <span className="text-[9px] text-outline font-black uppercase tracking-tighter">Purchase Year:</span>
          <input 
            type="text"
            inputMode="numeric"
            className="bg-transparent border-none p-0 text-xs font-bold text-on-surface-variant w-12 outline-none focus:text-primary"
            defaultValue={year || ""}
            onBlur={(e) => onNumberUpdate('actual_year_of_purchase', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}