"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
      className="h-9 w-9"
    >
      {/* CSS-based swap avoids hydration mismatches without extra state */}
      <Sun className="hidden h-4.5 w-4.5 dark:block" />
      <Moon className="h-4.5 w-4.5 dark:hidden" />
    </Button>
  );
}
