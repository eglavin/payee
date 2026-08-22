"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/category-badge";
import type { Category } from "@/lib/categories";

const NONE_VALUE = "__none__";
const NEW_VALUE = "__new__";

interface CategoryPickerProps {
  categories: Category[];
  categoryId?: string;
  onCategoryChange: (categoryId: string | null) => void;
  onAddCategory: (label: string) => Category;
  size?: "sm" | "default";
  placeholder?: string;
  className?: string;
}

export function CategoryPicker({
  categories,
  categoryId,
  onCategoryChange,
  onAddCategory,
  size = "default",
  placeholder = "No category",
  className,
}: CategoryPickerProps) {
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  function handleValueChange(value: string | null) {
    if (value === NEW_VALUE) {
      setAddingNew(true);
      return;
    }
    onCategoryChange(!value || value === NONE_VALUE ? null : value);
  }

  function commitNewCategory() {
    const label = newLabel.trim();
    if (label) {
      const category = onAddCategory(label);
      onCategoryChange(category.id);
    }
    setNewLabel("");
    setAddingNew(false);
  }

  function cancelNewCategory() {
    setAddingNew(false);
    setNewLabel("");
  }

  if (addingNew) {
    return (
      <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
        <Input
          autoFocus
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New category name"
          className="h-8 w-40"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitNewCategory();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelNewCategory();
            }
          }}
        />
        <Button type="button" size="sm" onClick={commitNewCategory}>
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={cancelNewCategory}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Select value={categoryId ?? NONE_VALUE} onValueChange={handleValueChange}>
      <SelectTrigger size={size} className={className}>
        <SelectValue placeholder={placeholder}>
          {(value: string | null) =>
            value && value !== NONE_VALUE ? (
              <CategoryBadge categoryId={value} categories={categories} />
            ) : (
              placeholder
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{placeholder}</SelectItem>
        <SelectSeparator />
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <CategoryBadge categoryId={category.id} categories={categories} />
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={NEW_VALUE}>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Plus className="size-3.5" />
            New category
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
