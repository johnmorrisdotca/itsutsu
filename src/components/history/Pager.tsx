import Link from "next/link";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import type { Pagination } from "@/lib/history/gameHistory.types";

/** Previous/next links that keep every other filter in the URL intact. */
export function Pager({
  pagination,
  params,
  basePath = "/history",
}: {
  pagination: Pagination;
  params: Record<string, string | undefined>;
  /** The collection being paged: /history, or /history/<slug> for one game's record. */
  basePath?: string;
}) {
  const href = (page: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && key !== "page") next.set(key, value);
    }
    next.set("page", String(page));
    return `${basePath}?${next.toString()}`;
  };

  const { page, totalPages, total } = pagination;

  return (
    <nav className="flex items-center justify-between gap-4" aria-label="Pagination">
      <p className="text-sm text-muted">
        Page {page} of {totalPages} · {total} game{total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
            data-testid="next-page"
          >
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
