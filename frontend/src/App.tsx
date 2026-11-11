import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, rotaInicial, useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/AppShell';
import { EmptyState, LoadingState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import LoginView from '@/pages/LoginView';
import TeacherDashboard from '@/pages/TeacherDashboard';
import SuperintendentDashboard from '@/pages/SuperintendentDashboard';
import CadastrosView from '@/pages/CadastrosView';
import type { Papel } from '@/lib/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <LoadingState />;
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ roles, children }: { roles: Papel[]; children: ReactNode }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!roles.includes(usuario.papel)) return <Navigate to={rotaInicial(usuario.papel)} replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <LoadingState />;
  if (usuario) return <Navigate to={rotaInicial(usuario.papel)} replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { usuario } = useAuth();
  return <Navigate to={usuario ? rotaInicial(usuario.papel) : '/login'} replace />;
}

function SemAcesso() {
  const { logout } = useAuth();
  return (
    <EmptyState
      title="Acesso não liberado"
      description="Sua conta ainda não tem acesso aos painéis da EBD. Procure a superintendência da sua igreja."
      action={
        <Button variant="secondary" onClick={logout}>
          Sair
        </Button>
      }
      className="mx-auto mt-10 max-w-md"
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <LoginView />
                </PublicOnly>
              }
            />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<HomeRedirect />} />
              <Route
                path="chamada"
                element={
                  <RequireRole roles={['SUPERINTENDENTE', 'PROFESSOR']}>
                    <TeacherDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="superintendencia"
                element={
                  <RequireRole roles={['SUPERINTENDENTE']}>
                    <SuperintendentDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="cadastros"
                element={
                  <RequireRole roles={['SUPERINTENDENTE']}>
                    <CadastrosView />
                  </RequireRole>
                }
              />
              <Route path="sem-acesso" element={<SemAcesso />} />
            </Route>
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster
        position="top-center"
        duration={2500}
        toastOptions={{
          style: {
            borderRadius: '14px',
            border: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            fontSize: '14px',
            fontFamily: 'inherit',
          },
        }}
      />
    </QueryClientProvider>
  );
}
