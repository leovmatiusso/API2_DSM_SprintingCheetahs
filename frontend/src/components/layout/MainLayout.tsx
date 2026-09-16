import { Outlet } from "react-router-dom";
import Sidebar from "../navigation/Sidebar/Sidebar";

export default function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}
