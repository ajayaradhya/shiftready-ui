"use client";

import { createContext, useContext, useState } from "react";

type SaleCtx = { label: string; name: string } | null;

interface SaleContextValue {
  sale: SaleCtx;
  setSale: (s: SaleCtx) => void;
  isProcessing: boolean;
  setProcessing: (v: boolean) => void;
}

const Ctx = createContext<SaleContextValue>({
  sale: null,
  setSale: () => {},
  isProcessing: false,
  setProcessing: () => {},
});

export function SaleContextProvider({ children }: { children: React.ReactNode }) {
  const [sale, setSale] = useState<SaleCtx>(null);
  const [isProcessing, setProcessing] = useState(false);
  return (
    <Ctx.Provider value={{ sale, setSale, isProcessing, setProcessing }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSaleContext = () => useContext(Ctx);
