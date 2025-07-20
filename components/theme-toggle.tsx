"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="cursor-pointer flex items-center space-x-4 px-3 py-3 rounded-full text-xl">
        <div className="h-6 w-6" />
        <span className="lg:hidden xl:block">Mode</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="cursor-pointer flex items-center space-x-4 px-3 py-3 rounded-full text-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
    >
      {theme === "dark" ? (
        <Sun className="h-6 w-6" />
      ) : (
        <Moon className="h-6 w-6" />
      )}
      <span className="lg:hidden xl:block">Mode</span>
    </button>
  );
}
