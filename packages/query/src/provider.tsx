"use client";

import {
  defaultShouldDehydrateQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

export type QueryProviderProps = {
  children: ReactNode;
  staleTime?: number;
};

function makeQueryClient(staleTime: number) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime,
        gcTime: 1000 * 60 * 5,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        shouldRedactErrors: () => false,
      },
    },
  });
}

export function QueryProvider({
  children,
  staleTime = 60 * 1000,
}: QueryProviderProps) {
  const [queryClient] = useState(() => makeQueryClient(staleTime));

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
