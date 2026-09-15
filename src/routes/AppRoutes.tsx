import { Routes, Route } from "react-router-dom";

import MainLayout from "@/components/layout/MainLayout";

import Dashboard from "@/pages/Dashboard";
import Usuarios from "@/pages/Usuarios";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
    </Routes>
  );
}