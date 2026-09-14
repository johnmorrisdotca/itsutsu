import Link from "next/link";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { MY_GAMES_COPY } from "./mine.constants";

/**
 * What `/play?all=seated` was narrowed to, and the way back off it.
 *
 * The page a seat-refused notice's count lands on. "Every page a link lands on
 * says what it was narrowed to, and lets it be taken off" — so this names the
 * set (the games the limit counts), prints how many there are in the same shape
 * the group headings use, and links back to the whole queue.
 *
 * Drawn even at nought: an empty narrowing is an answer, and the way back has to
 * be there either way.
 */
export function SeatedNarrowing({ total }: { total: number }) {
  const copy = MY_GAMES_COPY.seated;
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-1`} data-testid="my-games-seated">
      <p className="flex flex-wrap items-baseline gap-2 text-sm font-medium">
        {copy.label}
        <span className="font-mono tabular-nums" data-testid="my-games-seated-count">
          {total}
        </span>
      </p>
      <p className="text-xs text-muted">{copy.hint}</p>
      <Link href="/play" className="text-xs font-medium underline underline-offset-4" data-testid="my-games-seated-back">
        {copy.back}
      </Link>
    </div>
  );
}
