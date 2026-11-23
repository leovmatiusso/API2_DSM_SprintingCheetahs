import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/navigation/Sidebar/Sidebar";
import Navbar from "@/components/navigation/Navbar/Navbar"
import { Toaster } from 'sonner';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="bg-bg-secondary text-text flex min-h-screen @container">
      <Sidebar onCollapsedChange={setSidebarCollapsed} />

      {/* min-w-0: o conteúdo nunca alarga a página além da tela (no celular isso cortava a sidebar). */}
      <main className={`min-h-screen min-w-0 flex-1 transition-all duration-300`}>
        <Navbar />
        <Outlet />
      </main>
      <Toaster
        expand
        visibleToasts={9}
        position="bottom-right"
        offset={24}
        toastOptions={{
          unstyled: true,
        }}
      />
    </div>
  );
}
