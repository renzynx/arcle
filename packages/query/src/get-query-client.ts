import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from "@tanstack/react-query";

export type QueryClientOptions = {
  staleTime?: number;
};

function makeQueryClient(staleTime: number) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime,
        gcTime: 1000 * 60 * 5,
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

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(options: QueryClientOptions = {}) {
  const staleTime = options.staleTime ?? 60 * 1000;

  if (isServer) {
    return makeQueryClient(staleTime);
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient(staleTime);
  }
  return browserQueryClient;
}
