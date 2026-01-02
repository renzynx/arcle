export type {
  MutationFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  UseInfiniteQueryResult,
  UseMutationResult,
  UseQueryResult,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";
export {
  dehydrate,
  HydrationBoundary,
  QueryClientProvider,
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
export {
  getQueryClient,
  type QueryClientOptions,
} from "./get-query-client";
export { QueryProvider, type QueryProviderProps } from "./provider";
