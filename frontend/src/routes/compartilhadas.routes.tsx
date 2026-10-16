import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getCurrentUser } from "@/auth";

import Dashboard from "@/templates/compartilhadas/Dashboard";
import MinhaConta from "@/templates/compartilhadas/MinhaConta";
import MinhasOS from "@/templates/compartilhadas/MinhasOS";
import NovaOrdemServico from "@/templates/compartilhadas/NovaOrdemServico";
import PedidoEspecifico from "@/templates/compartilhadas/PedidoEspecifico";
import Projetos from "@/templates/compartilhadas/Projetos";

const user = getCurrentUser();

export const compartilhadasRoutes = (
  <>
  <Route path="/dashboard" element={<Dashboard />} />
  
  <Route path="/minha-conta" element={<MinhaConta />} />
  
  <Route element={<ProtectedRoute excludedRoles={["superusuario"]} />}>
    <Route path="/os/nova-os" element={<NovaOrdemServico />} />
  </Route>
  
  <Route element={<ProtectedRoute excludedRoles={["superusuario"]} />}>
    <Route path="/projetos-totais" element={<Projetos />} />
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