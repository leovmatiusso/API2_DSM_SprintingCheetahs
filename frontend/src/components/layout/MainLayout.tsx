import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../navigation/Sidebar/Sidebar";

export default function MainLayout() {
  const [
    sidebarCollapsed,
    setSidebarCollapsed
  ] = useState(false);

  return (
    <div
      className="
        min-h-screen
        bg-bg-secondary
        text-text
      "
    >
      <Sidebar />

      <main
        className={`
          min-h-screen
          transition-all
          duration-300
          ${
            sidebarCollapsed
              ? "pl-16"
              : "pl-64"
          }
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}