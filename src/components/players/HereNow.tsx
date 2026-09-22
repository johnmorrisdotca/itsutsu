import Link from "next/link";

import { playerPath } from "@/lib/rating/playerKey";
import { RecencyLegend, RecencyMark } from "@/components/mine/Recency";
import { fetchHereNow } from "@/lib/social/presence";
import { shownName } from "@/lib/rating/shownName";

/**
 * Who is about, right now.
 *
 * This is the one thing on the players page that answers "can I get a game
 * this minute", so it stays above the tabs rather than behind one — and a
 * live fact that is one click away is a live fact nobody looks at.
 *
 * "Three lines whoever is here — the half-hour window is its own cap" was
 * written here once, and on a database with fifty-one in the window it was
 * 1,310 pixels of a phone. So the first dozen are the answer to "is anybody
 * about", and the rest fold behind a line that says how many more, which is
 * the answer to the other question. Nothing is hidden the fold does not count.
 */
const NAMES_SHOWN = 12;
export async function HereNow({ now }: { now: Date }) {
  const here = await fetchHereNow(now);
  const hereNow = here.filter((entry) => entry.recency === "now").length;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-rule bg-ivory/60 px-3 py-2" data-testid="here-now">
      <p className="text-sm">
        <span className="font-semibold">{hereNow}</span> {hereNow === 1 ? "player" : "players"} here in the last five
        minutes, <span className="font-semibold">{here.length}</span> in the last half hour.
        <span className="ml-2 text-xs text-muted">Site clock: {now.toUTCString().slice(17, 22)} UTC</span>
      </p>
      {here.length > 0 ? (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {here.slice(0, NAMES_SHOWN).map((entry) => (
            <Name key={entry.id} entry={entry} />
          ))}
        </p>
      ) : null}
      {here.length > NAMES_SHOWN ? (
        <details className="group" data-testid="here-more">
          <summary className="cursor-pointer list-none text-xs text-muted underline-offset-4 hover:underline">
            <span className="group-open:hidden">and {here.length - NAMES_SHOWN} more in the last half hour</span>
            <span className="hidden group-open:inline">fewer</span>
          </summary>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {here.slice(NAMES_SHOWN).map((entry) => (
              <Name key={entry.id} entry={entry} />
            ))}
          </p>
        </details>
      ) : null}
      <RecencyLegend />
    </div>
  );
}

function Name({ entry }: { entry: Awaited<ReturnType<typeof fetchHereNow>>[number] }) {
  return (
    <span className="flex items-center gap-1">
      <RecencyMark recency={entry.recency} />
      {entry.name.trim() !== "" ? (
        <Link href={playerPath(entry.name, entry.id)} className="underline-offset-2 hover:underline" data-testid="here-name">
          {shownName(entry.name)}
        </Link>
      ) : (
        entry.email
      )}
      {entry.localTime !== null ? <span className="text-xs text-muted">{entry.localTime} there</span> : null}
    </span>
  );
}
