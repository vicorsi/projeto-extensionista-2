import { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { lerPreferencia, salvarPreferencia } from '@/lib/utils';
import MembrosTab from './cadastros/MembrosTab';
import ClassesTab from './cadastros/ClassesTab';
import UsuariosTab from './cadastros/UsuariosTab';
import LicoesTab from './cadastros/LicoesTab';

const PREF_ABA = 'ebd.cadastros.aba';

export default function CadastrosView() {
  const [aba, setAba] = useState(() => lerPreferencia(PREF_ABA) ?? 'alunos');

  return (
    <div className="grid gap-5">
      <PageHeader title="Cadastros" />
      <Tabs
        value={aba}
        onValueChange={(v) => {
          setAba(v);
          salvarPreferencia(PREF_ABA, v);
        }}
      >
        <TabsList>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="licoes">Lições</TabsTrigger>
        </TabsList>
        <TabsContent value="alunos">
          <MembrosTab />
        </TabsContent>
        <TabsContent value="classes">
          <ClassesTab />
        </TabsContent>
        <TabsContent value="equipe">
          <UsuariosTab />
        </TabsContent>
        <TabsContent value="licoes">
          <LicoesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
