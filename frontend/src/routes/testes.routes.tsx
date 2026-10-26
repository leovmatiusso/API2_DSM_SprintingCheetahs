import { Route } from "react-router-dom";
import Teste from "@/templates/testes/Teste";
import MainLayout from "@/components/layout/MainLayout";

export const testesRoutes = (
  <Route element={<MainLayout />}>
    <Route path="teste" element={<Teste />} />
  </Route>
);
