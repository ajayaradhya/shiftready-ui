"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/ui/route-error";

export default function SellerMessageError({
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
      backHref="/seller-central"
      backLabel="Back to Seller Central"
      message="Couldn't load this conversation."
      digest={error.digest}
    />
  );
}
