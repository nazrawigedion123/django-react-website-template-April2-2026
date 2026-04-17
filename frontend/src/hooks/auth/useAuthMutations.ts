import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import api from "../../services/api";
import type { AuthResponse, LoginCredentials, RegisterPayload, RegisterResponse } from "../../types";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => api.login(credentials),
    onSuccess: (data: AuthResponse) => {
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterPayload) => api.register(userData),
    onSuccess: (data: RegisterResponse) => {
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
    },
  });
};

export const useGoogleLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, codeVerifier }: { code: string; codeVerifier: string }) =>
      api.googleLogin(code, codeVerifier),
    onSuccess: (data: AuthResponse) => {
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
    },
  });
};
