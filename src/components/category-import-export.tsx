"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildCategoryExportJson,
  categoryExportFileName,
  parseCategoryImport,
  type CategoryExportData,
} from "@/lib/category-export";
import type { Category } from "@/lib/categories";

interface CategoryImportExportProps {
  customCategories: Category[];
  assignments: Record<string, string>;
  onImport: (data: CategoryExportData) => void;
}

export function CategoryImportExport({
  customCategories,
  assignments,
  onImport,
}: CategoryImportExportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  function handleExport() {
    const blob = new Blob([buildCategoryExportJson({ customCategories, assignments })], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = categoryExportFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const data = parseCategoryImport(text);
      onImport(data);
      const categoryCount = data.customCategories.length;
      const assignmentCount = Object.keys(data.assignments).length;
      setMessage({
        type: "success",
        text: `Imported ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"} and ${assignmentCount} assignment${assignmentCount === 1 ? "" : "s"}.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not read that file.",
      });
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={handleExport}>
          <Download className="size-4" />
          Export categories
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" />
          Import categories
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {message && (
        <p
          className={`text-xs ${message.type === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
