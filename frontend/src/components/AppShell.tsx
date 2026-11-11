import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn, papelLabel } from '@/lib/utils';
import type { Papel } from '@/lib/types';

const itens: { to: string; label: string; papeis: Papel[] }[] = [
  { to: '/superintendencia', label: 'Painel', papeis: ['SUPERINTENDENTE'] },
  { to: '/chamada', label: 'Chamada', papeis: ['SUPERINTENDENTE', 'PROFESSOR'] },
  { to: '/cadastros', label: 'Cadastros', papeis: ['SUPERINTENDENTE'] },
];

export default function AppShell() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;
  const visiveis = itens.filter((i) => i.papeis.includes(usuario.papel));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#f5f5f7]/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="container flex h-12 items-center gap-4">
          <span className="hidden shrink-0 text-[15px] font-semibold tracking-tight sm:inline">Projeto Extensionista 2</span>

          <nav className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:justify-center">
            {visiveis.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-full px-3 py-1 text-[13px] transition-colors',
                    isActive ? 'bg-black/[0.06] font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden max-w-[180px] truncate text-[13px] text-muted-foreground md:inline" title={papelLabel[usuario.papel]}>
              {usuario.nome}
            </span>
            <button type="button" onClick={logout} className="text-[13px] text-primary hover:opacity-70">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container pb-20 pt-6 sm:pt-10">
        <Outlet />
      </main>
    </div>
  );
}
