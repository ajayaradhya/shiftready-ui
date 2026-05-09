"use client";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Toaster, toast } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Request failed");
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Action failed");
          },
        }),
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "bg-surface-container-high border border-outline-variant/20 text-on-surface font-medium text-sm rounded-xl shadow-2xl",
              error: "!text-error border-error/20",
              success: "!text-tertiary border-tertiary/20",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
