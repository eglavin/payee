import { Badge } from "@/components/ui/badge";
import type { Category } from "@/lib/categories";

interface CategoryBadgeProps {
  categoryId?: string;
  categories: Category[];
  placeholder?: string;
}

export function CategoryBadge({
  categoryId,
  categories,
  placeholder = "Uncategorized",
}: CategoryBadgeProps) {
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    return <span className="text-sm text-muted-foreground">{placeholder}</span>;
  }

  return (
    <Badge variant="secondary" className="gap-1.5 font-normal">
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />
      {category.label}
    </Badge>
  );
}
