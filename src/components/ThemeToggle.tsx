"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10" />
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2.5 rounded-xl bg-white dark:bg-[#141425] text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-all border-2 border-gray-200 dark:border-[#2a2a3d] shadow-[0_3px_0_0_#d1d5db] dark:shadow-[0_3px_0_0_#0d0d1a] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#d1d5db] dark:hover:shadow-[0_2px_0_0_#0d0d1a] active:translate-y-[2px] active:shadow-[0_1px_0_0_#d1d5db] flex items-center justify-center cursor-pointer"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-[#FF2D78]" />
      )}
    </button>
  );
}

