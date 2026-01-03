import { useMutation, useQuery, useQueryClient } from "@arcle/query";
import { useAuthClient } from "./provider";

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
  passkeys: () => [...authKeys.all, "passkeys"] as const,
} as const;

export function useSessionQuery() {
  const authClient = useAuthClient();

  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSignInMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data, error } = await authClient.signIn.email(credentials);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) return;
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useSignUpMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: {
      email: string;
      password: string;
      name: string;
    }) => {
      const { data, error } = await authClient.signUp.email(credentials);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useSignOutMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.session(), null);
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useTokenQuery() {
  const authClient = useAuthClient();

  return useQuery({
    queryKey: [...authKeys.all, "token"] as const,
    queryFn: async () => {
      const { data, error } = await authClient.token();
      if (error) throw error;
      return data;
    },
    staleTime: 4 * 60 * 1000,
    retry: false,
  });
}

export function useEnableTwoFactorMutation() {
  const authClient = useAuthClient();

  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.enable({ password });
      if (error) throw error;
      return data;
    },
  });
}

export function useDisableTwoFactorMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.disable({ password });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useVerifyTotpMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { code: string; trustDevice?: boolean }) => {
      const { data, error } = await authClient.twoFactor.verifyTotp(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useVerifyBackupCodeMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { code: string; trustDevice?: boolean }) => {
      const { data, error } =
        await authClient.twoFactor.verifyBackupCode(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function usePasskeySignInMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.signIn.passkey();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function usePasskeysQuery() {
  const authClient = useAuthClient();

  return useQuery({
    queryKey: authKeys.passkeys(),
    queryFn: async () => {
      const { data, error } = await authClient.passkey.listUserPasskeys();
      if (error) throw error;
      return data;
    },
  });
}

export function useAddPasskeyMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name?: string) => {
      const { data, error } = await authClient.passkey.addPasskey({
        name: name || "My Passkey",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.passkeys() });
    },
  });
}

export function useDeletePasskeyMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await authClient.passkey.deletePasskey({ id });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.passkeys() });
    },
  });
}

export function useListSessionsQuery() {
  const authClient = useAuthClient();

  return useQuery({
    queryKey: authKeys.sessions(),
    queryFn: async () => {
      const { data, error } = await authClient.listSessions();
      if (error) throw error;
      return data;
    },
  });
}

export function useRevokeSessionMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await authClient.revokeSession({ token });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
}

export function useRevokeOtherSessionsMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.revokeOtherSessions();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
}

export function useUpdateUserMutation() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name?: string; image?: string }) => {
      const { data, error } = await authClient.updateUser(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}
