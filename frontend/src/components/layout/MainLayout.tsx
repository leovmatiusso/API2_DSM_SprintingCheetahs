import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/navigation/Sidebar/Sidebar";

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="bg-bg-secondary text-text flex min-h-screen">
      <Sidebar onCollapsedChange={setSidebarCollapsed} />

      <main className={`min-h-screen flex-1 transition-all duration-300`}>
        
        <Outlet />
      </main>
    </div>
  );
}
