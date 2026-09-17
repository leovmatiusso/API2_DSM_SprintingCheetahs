import { Outlet } from "react-router-dom";
import Sidebar from "../navigation/Sidebar/Sidebar";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar />
      <main className="min-w-0 flex-1 p-0">
        <Outlet />
      </main>
    </div>
  );
}
