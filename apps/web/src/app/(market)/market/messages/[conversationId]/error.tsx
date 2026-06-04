"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/ui/route-error";

export default function MessageError({
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
      backHref="/market/messages"
      backLabel="Back to Messages"
      message="Couldn't load this conversation."
      digest={error.digest}
    />
  );
}
