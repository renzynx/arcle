"use client";

import { type ApiClient, createApiClient } from "@arcle/api-client";
import { getQueryClient } from "@arcle/query";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { type AuthClientInstance, createAuthClientWithBaseURL } from "./client";
import { authKeys } from "./queries";

type AuthContextValue = {
  authClient: AuthClientInstance;
  apiClient: ApiClient;
  gatewayUrl: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let _authClientRef: AuthClientInstance | null = null;

function setAuthClientRef(client: AuthClientInstance) {
  _authClientRef = client;
}

export function AuthProvider({
  children,
  gatewayUrl,
}: {
  children: ReactNode;
  gatewayUrl: string;
}) {
  const authClient = useMemo(
    () => createAuthClientWithBaseURL(gatewayUrl),
    [gatewayUrl],
  );

  const apiClient = useMemo(
    () => createApiClient({ baseURL: gatewayUrl, getToken: getAccessToken }),
    [gatewayUrl],
  );

  useEffect(() => {
    setAuthClientRef(authClient);
    return () => {
      setAuthClientRef(null as unknown as AuthClientInstance);
    };
  }, [authClient]);

  return (
    <AuthContext.Provider value={{ authClient, apiClient, gatewayUrl }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthClient(): AuthClientInstance {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthClient must be used within an AuthProvider");
  }
  return context.authClient;
}

export function useGatewayUrl(): string {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useGatewayUrl must be used within an AuthProvider");
  }
  return context.gatewayUrl;
}

export function useApiClient(): ApiClient {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useApiClient must be used within an AuthProvider");
  }
  return context.apiClient;
}

export { useSessionQuery as useSession } from "./queries";

const TOKEN_STALE_TIME = 4 * 60 * 1000;

export async function getAccessToken(): Promise<string | undefined> {
  if (!_authClientRef) {
    throw new Error(
      "Auth client not initialized. Wrap your app with AuthProvider.",
    );
  }

  const queryClient = getQueryClient();
  const authClient = _authClientRef;

  try {
    const data = await queryClient.fetchQuery({
      queryKey: [...authKeys.all, "token"] as const,
      queryFn: async () => {
        const { data, error } = await authClient.token();
        if (error) throw error;
        return data;
      },
      staleTime: TOKEN_STALE_TIME,
    });

    return data?.token;
  } catch {
    return undefined;
  }
}

export function clearTokenCache() {
  const queryClient = getQueryClient();
  queryClient.removeQueries({ queryKey: [...authKeys.all, "token"] });
}
