import React, { createContext, useCallback } from 'react';
import type { User } from '../types';
import api from '../services/api';
import { useUser } from '../hooks/auth/useUser';
import { useLogin, useRegister } from '../hooks/auth/useAuthMutations';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const token = api.getTokens();
    const { data: user, isLoading: isUserLoading } = useUser(!!token);

    const loginMutation = useLogin();
    const registerMutation = useRegister();

    const logout = useCallback(() => {
        api.logout();
        queryClient.setQueryData(queryKeys.auth.user(), null);
        queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    }, [queryClient]);

    const login = async (credentials: any) => {
        await loginMutation.mutateAsync(credentials);
    };

    const register = async (userData: any) => {
        await registerMutation.mutateAsync(userData);
    };

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isAuthenticated: !!user,
                isLoading: isUserLoading && !!token,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
