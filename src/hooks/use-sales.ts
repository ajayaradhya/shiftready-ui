import { useQuery } from "@tanstack/react-query";
import { listSales } from "@/lib/api";

export function useSalesList() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: listSales,
    staleTime: 30_000,
  });
}
