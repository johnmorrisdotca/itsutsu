import Link from "@/components/ui/Link";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import type { Pagination } from "@/lib/history/gameHistory.types";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

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
  const say = useSpeaker();

  return (
    <nav className="flex items-center justify-between gap-4" aria-label={say.say("replay.pagination")}>
      <p className="text-sm text-muted">
        {say.say("replay.pageOf", { page: String(page), pages: String(totalPages), games: say.count("count.gamePlayed", total) })}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
            {say.say("replay.previous")}
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
            data-testid="next-page"
          >
            {say.say("replay.next")}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
