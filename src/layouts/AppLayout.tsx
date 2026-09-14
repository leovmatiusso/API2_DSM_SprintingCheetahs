import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background text-text transition-all duration-300">

      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>

    </div>
  );
}