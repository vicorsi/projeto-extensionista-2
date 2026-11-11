import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tokenStorage, UNAUTHORIZED_EVENT } from '@/lib/api';
import { authApi } from '@/lib/services';
import type { Papel, RegisterPayload, Usuario } from '@/lib/types';

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<Usuario>;
  register: (dados: RegisterPayload) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(() => !!tokenStorage.get());

  useEffect(() => {
    if (!tokenStorage.get()) return;
    let ativo = true;
    authApi
      .me()
      .then((u) => ativo && setUsuario(u))
      .catch(() => {
        tokenStorage.clear();
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUsuario(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    const handler = () => {
      setUsuario(null);
      queryClient.clear();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [queryClient]);

  const login = useCallback(async (email: string, senha: string) => {
    const res = await authApi.login(email, senha);
    tokenStorage.set(res.token);
    setUsuario(res.usuario);
    return res.usuario;
  }, []);

  const register = useCallback(async (dados: RegisterPayload) => {
    const res = await authApi.register(dados);
    tokenStorage.set(res.token);
    setUsuario(res.usuario);
    return res.usuario;
  }, []);

  const value = useMemo(
    () => ({ usuario, carregando, login, register, logout }),
    [usuario, carregando, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export function rotaInicial(papel: Papel): string {
  if (papel === 'SUPERINTENDENTE') return '/superintendencia';
  if (papel === 'PROFESSOR') return '/chamada';
  return '/sem-acesso';
}
