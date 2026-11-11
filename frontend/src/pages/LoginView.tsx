import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { rotaInicial, useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Segmented } from '@/components/ui/tabs';
import { MODO_DEMO, getErrorMessage } from '@/lib/api';
import { SENHA_DEMO } from '@/lib/mock/server';
import type { Papel } from '@/lib/types';

function CampoSenha({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visivel ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="pr-20"
        required
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-primary hover:opacity-70"
      >
        {visivel ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  );
}

export default function LoginView() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState<'entrar' | 'cadastrar'>('entrar');
  const [enviando, setEnviando] = useState(false);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cad, setCad] = useState({ nome: '', email: '', senha: '', papel: 'PROFESSOR' as Papel });

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const u = await login(email.trim(), senha);
      navigate(rotaInicial(u.papel), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'E-mail ou senha inválidos'));
    } finally {
      setEnviando(false);
    }
  }

  async function cadastrar(e: FormEvent) {
    e.preventDefault();
    if (cad.senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    setEnviando(true);
    try {
      const u = await register({ ...cad, nome: cad.nome.trim(), email: cad.email.trim() });
      navigate(rotaInicial(u.papel), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível criar a conta'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <h1 className="text-[34px] font-bold tracking-tightest">Projeto Extensionista 2</h1>
          <p className="mt-1 text-[17px] text-muted-foreground">Escola Bíblica Dominical</p>
        </div>

        <Segmented
          value={aba}
          onChange={setAba}
          options={[
            { value: 'entrar', label: 'Entrar' },
            { value: 'cadastrar', label: 'Criar conta' },
          ]}
          className="mb-6"
        />

        {aba === 'entrar' ? (
          <form onSubmit={entrar} className="grid gap-4">
            <Field label="E-mail" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Senha" htmlFor="login-senha">
              <CampoSenha id="login-senha" value={senha} onChange={setSenha} autoComplete="current-password" />
            </Field>
            <Button type="submit" size="lg" loading={enviando} className="mt-2 w-full">
              Entrar
            </Button>
            {MODO_DEMO && (
              <div className="mt-4 rounded-2xl bg-card p-4 text-[13px] text-muted-foreground">
                <p className="mb-3">Versão de demonstração. Entre como:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Superintendente', email: 'super@demo.com' },
                    { label: 'Professor', email: 'professor@demo.com' },
                  ].map((d) => (
                    <Button
                      key={d.email}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEmail(d.email);
                        setSenha(SENHA_DEMO);
                      }}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
                <p className="mt-3">
                  Senha: <span className="tabular text-foreground">{SENHA_DEMO}</span>. Os dados ficam salvos só neste navegador.
                </p>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={cadastrar} className="grid gap-4">
            <Field label="Nome completo" htmlFor="cad-nome">
              <Input id="cad-nome" autoComplete="name" value={cad.nome} onChange={(e) => setCad({ ...cad, nome: e.target.value })} required />
            </Field>
            <Field label="E-mail" htmlFor="cad-email">
              <Input
                id="cad-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={cad.email}
                onChange={(e) => setCad({ ...cad, email: e.target.value })}
                required
              />
            </Field>
            <Field label="Senha" htmlFor="cad-senha" hint="Mínimo de 6 caracteres">
              <CampoSenha id="cad-senha" value={cad.senha} onChange={(v) => setCad({ ...cad, senha: v })} autoComplete="new-password" />
            </Field>
            <Field label="Função">
              <Segmented
                value={cad.papel}
                onChange={(papel) => setCad({ ...cad, papel })}
                options={[
                  { value: 'PROFESSOR', label: 'Professor' },
                  { value: 'SUPERINTENDENTE', label: 'Superintendente' },
                ]}
              />
            </Field>
            <Button type="submit" size="lg" loading={enviando} className="mt-2 w-full">
              Criar conta
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
