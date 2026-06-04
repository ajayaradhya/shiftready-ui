"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/ui/route-error";

export default function SaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <RouteError
      reset={reset}
      backHref="/market"
      backLabel="Back to Marketplace"
      message="Couldn't load this sale."
      digest={error.digest}
    />
  );
}
