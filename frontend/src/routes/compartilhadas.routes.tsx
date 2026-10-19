import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

import Dashboard from "@/templates/compartilhadas/Dashboard";
import MinhaConta from "@/templates/compartilhadas/MinhaConta";
import MinhasOS from "@/templates/compartilhadas/MinhasOS";
import NovaOrdemServico from "@/templates/compartilhadas/NovaOrdemServico";
import PedidoEspecifico from "@/templates/compartilhadas/PedidoEspecifico";
import Projetos from "@/templates/compartilhadas/Projetos";
import ProjetoDetalhe from "@/templates/compartilhadas/ProjetoDetalhe";
import Manutencoes from "@/templates/compartilhadas/Manutencoes";
import ManutencaoDetalhe from "@/templates/compartilhadas/ManutencaoDetalhe";
import OrdensServico from "@/templates/compartilhadas/OrdensServico";
import OrdemServicoDetalhe from "@/templates/compartilhadas/OrdemServicoDetalhe";

export const compartilhadasRoutes = (
  <>
    <Route path="/dashboard" element={<Dashboard />} />

    <Route path="/minha-conta" element={<MinhaConta />} />

    {/* Ordens de serviço: todos, exceto superusuário.
        A criação ("Nova O.S.") só é acessada pelo projeto/manutenção expandido. */}
    <Route element={<ProtectedRoute excludedRoles={["superusuario"]} />}>
      <Route path="/os/nova-os" element={<NovaOrdemServico />} />
      <Route path="/os/disponiveis" element={<OrdensServico />} />
      <Route path="/os/disponiveis/:osId" element={<OrdemServicoDetalhe />} />
    </Route>

    {/* Projetos: todos, exceto superusuário e suporte.
        O filtro por time (via O.S.) é feito no backend. */}
    <Route element={<ProtectedRoute excludedRoles={["superusuario", "suporte"]} />}>
      <Route path="/projetos-totais" element={<Projetos />} />
      <Route path="/projetos-totais/:projetoId" element={<ProjetoDetalhe />} />
    </Route>

    {/* Manutenções: todos, exceto superusuário e comercial. */}
    <Route element={<ProtectedRoute excludedRoles={["superusuario", "comercial"]} />}>
      <Route path="/manutencoes-totais" element={<Manutencoes />} />
      <Route path="/manutencoes-totais/:manutencaoId" element={<ManutencaoDetalhe />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["comercial", "suporte"]} />}>
      <Route path="/manutencao/exemplo" element={<PedidoEspecifico />} />
    </Route>

    <Route
      element={
        <ProtectedRoute
          allowedRoles={["comercial", "suporte", "producao", "software", "implantacao"]}
        />
      }
    >
      <Route path="/os/minhas" element={<MinhasOS />} />
    </Route>
  </>
);