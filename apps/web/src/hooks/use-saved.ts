"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSaved } from "@myrio/api";
import { useAuth } from "@/hooks/use-auth";

export function useSaved() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved"],
    queryFn: getSaved,
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useInvalidateSaved() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["saved"] });
}
