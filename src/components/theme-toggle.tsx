"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/components/theme-provider";

const options: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border bg-muted p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          type="button"
          variant={theme === value ? "default" : "ghost"}
          size="icon-sm"
          onClick={() => setTheme(value)}
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
          title={label}
        >
          <Icon className="size-3.5" />
        </Button>
      ))}
    </div>
  );
}
