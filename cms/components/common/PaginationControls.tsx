"use client";
import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}

export default function PaginationControls({
  page,
  setPage,
  totalPages,
}: Props) {
  const generatePages = () => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }

    return pages;
  };

  const pages = generatePages();

  if (totalPages === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-4">
      <Button
        variant="outline"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        &lt;
      </Button>

      {pages.map((p, idx) =>
        typeof p === "number" ? (
          <Button
            key={idx}
            variant={p === page ? "default" : "outline"}
            onClick={() => setPage(p)}
          >
            {p}
          </Button>
        ) : (
          <span key={idx} className="px-2 text-muted-foreground">
            {p}
          </span>
        )
      )}

      <Button
        variant="outline"
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
      >
        &gt;
      </Button>
    </div>
  );
}
