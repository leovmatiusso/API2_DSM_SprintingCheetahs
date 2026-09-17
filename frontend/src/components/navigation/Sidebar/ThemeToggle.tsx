import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <button
      type="button"
      onClick={() => setDarkMode((current) => !current)}
      className="inline-flex size-10 items-center justify-center p-0 rounded-lg bg-transparent text-text-muted"
      aria-label={darkMode ? "Ativar tema claro" : "Ativar tema escuro"}
      title={darkMode ? "Tema claro" : "Tema escuro"}
    >
      {darkMode ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
