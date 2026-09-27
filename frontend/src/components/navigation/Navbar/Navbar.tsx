import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, ChevronDown } from "lucide-react";
import { getCurrentUser, logout } from "@/auth";

export default function Header() {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const user = getCurrentUser();

  if (!user) return null;

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="mb-8 flex items-center justify-between border-b border-border bg-bg px-6 py-4">
      <div>
        <strong className="text-xl">Sistema de O.S.</strong>

        <span className="ml-3 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">
          {user.role}
        </span>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-bg-tertiary"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <User size={18} />
          </div>

          <span className="text-sm font-medium">{user.name}</span>

          <ChevronDown
            size={17}
            className={`transition-transform ${menuAberto ? "rotate-180" : ""}`}
          />
        </button>

        {menuAberto && (
          <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-border bg-bg p-1 shadow-md">
            <button
              type="button"
              onClick={() => navigate("/minha-conta")}
              className="w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-bg-tertiary cursor-pointer"
            >
              Minha conta
            </button>

            <button
              type="button"
              onClick={sair}
              className="w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-bg-tertiary cursor-pointer"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}