"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setPin, clearPin } from "@/lib/api";
import type { PinKind } from "@/lib/types";

interface SetPinVars {
  kind: PinKind;
  saleEventId: string;
  bundleId?: string | null;
  itemId?: string | null;
}

export function useSetPin(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SetPinVars) => setPin(convId, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages", convId] });
    },
  });
}

export function useClearPin(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearPin(convId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages", convId] });
    },
  });
}
