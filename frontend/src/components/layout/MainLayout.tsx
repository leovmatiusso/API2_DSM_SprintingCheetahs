import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/navigation/Sidebar/Sidebar";

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="
        flex
        min-h-screen
        bg-bg-secondary
        text-text
      "
    >
      <Sidebar  onCollapsedChange={setSidebarCollapsed}/>

      <main
        className={`
          min-h-screen
          transition-all
          duration-300
          flex-1
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}
