import { Paired } from "@/components/i18n/Paired";
import { playerPath } from "@/lib/rating/playerKey";
import { RowActions } from "@/components/ui/Controls";
import Link from "next/link";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { HereNow } from "@/lib/social/presence";
import { ChallengeButton } from "./ChallengeButton";
import { START_COPY } from "./mine.constants";
import { RecencyLegend, RecencyMark } from "./Recency";
import { shownName } from "@/lib/rating/shownName";

/**
 * Who is in the room, beside the seats they might take. The players page
 * carries the same list; here it sits next to the board because on a small
 * site the answer to "who can I play" is usually "whoever is about".
 */
export function HereNowPanel({ here, me }: { here: HereNow[]; me: string | null }) {
  const others = here.filter((entry) => entry.email !== me);
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="here-panel">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        <Paired en={START_COPY.hereNow.label} kanji={START_COPY.hereNow.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
        {others.length > 0 ? <span className="font-normal tracking-normal">{others.length}</span> : null}
      </h2>
      {others.length === 0 ? (
        <p className="text-xs text-muted" data-testid="here-empty">
          {START_COPY.nobodyHere}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {others.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 py-0.5 text-sm">
              <RecencyMark recency={entry.recency} />
              <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2">
                {entry.name.trim() !== "" ? (
                  <Link href={playerPath(entry.name, entry.id)} className="underline-offset-2 hover:underline">
                    {shownName(entry.name)}
                  </Link>
                ) : (
                  entry.email
                )}
                {entry.localTime !== null ? <span className="text-xs text-muted">{entry.localTime} there</span> : null}
              </span>
              <RowActions>
                {me !== null && entry.email !== null ? (
                  <ChallengeButton email={entry.email} label="Challenge" />
                ) : null}
              </RowActions>
            </li>
          ))}
        </ul>
      )}
      <RecencyLegend />
    </section>
  );
}
