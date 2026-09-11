import Link from "next/link";

import { playerPath } from "@/lib/rating/playerKey";
import { RecencyLegend, RecencyMark } from "@/components/mine/Recency";
import { fetchHereNow } from "@/lib/social/presence";
import { shownName } from "@/lib/rating/shownName";

/**
 * Who is about, right now.
 *
 * This is the one thing on the players page that answers "can I get a game
 * this minute", so it stays above the tabs rather than behind one. It is
 * three lines whoever is here — the half-hour window is its own cap — and a
 * live fact that is one click away is a live fact nobody looks at.
 */
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
          {here.map((entry) => (
            <span key={entry.id} className="flex items-center gap-1">
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
          ))}
        </p>
      ) : null}
      <RecencyLegend />
    </div>
  );
}
