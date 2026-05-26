import { useQuery } from "@tanstack/react-query";
import { listSales } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export function useSalesList() {
  const { idToken } = useAuth();
  return useQuery({
    queryKey: ["sales"],
    queryFn: listSales,
    staleTime: 30_000,
    enabled: !!idToken,
  });
}
