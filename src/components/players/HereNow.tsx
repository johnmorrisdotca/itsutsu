
import { PlayerName } from "@/components/players/PlayerName";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { weave } from "@/lib/i18n/weave";
import { RecencyLegend, RecencyMark } from "@/components/mine/Recency";
import { fetchHereNow } from "@/lib/social/presence";
import { currentTestModeReader } from "@/lib/testMode/testMode";

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
  const say = await currentSpeaker();
  const here = await fetchHereNow(now, await currentTestModeReader());
  const hereNow = here.filter((entry) => entry.recency === "now").length;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-rule bg-ivory/60 px-3 py-2" data-testid="here-now">
      <p className="text-sm">
        {weave(say.say("players.hereLine"), {
          now: <span className="font-semibold">{say.count("count.player", hereNow)}</span>,
          half: <span className="font-semibold">{say.number(here.length)}</span>,
        })}
        <span className="ml-2 text-xs text-muted">{say.say("players.siteClock", { time: now.toUTCString().slice(17, 22) })}</span>
      </p>
      {here.length > 0 ? (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {here.slice(0, NAMES_SHOWN).map((entry) => (
            <Name key={entry.id} entry={entry} say={say} />
          ))}
        </p>
      ) : null}
      {here.length > NAMES_SHOWN ? (
        <details className="group" data-testid="here-more">
          <summary className="cursor-pointer list-none text-xs text-muted underline-offset-4 hover:underline">
            <span className="group-open:hidden">{say.say("players.hereMore", { count: say.number(here.length - NAMES_SHOWN) })}</span>
            <span className="hidden group-open:inline">{say.say("players.hereFewer")}</span>
          </summary>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {here.slice(NAMES_SHOWN).map((entry) => (
              <Name key={entry.id} entry={entry} say={say} />
            ))}
          </p>
        </details>
      ) : null}
      <RecencyLegend say={say} />
    </div>
  );
}

function Name({ entry, say }: { entry: Awaited<ReturnType<typeof fetchHereNow>>[number]; say: Speaker }) {
  return (
    <span className="flex items-center gap-1">
      <RecencyMark recency={entry.recency} say={say} />
      {entry.name.trim() !== "" ? (
        <PlayerName name={entry.name} memberId={entry.id} fallback="" testId="here-name" tag={entry.tag} />
      ) : (
        entry.email
      )}
      {entry.localTime !== null ? <span className="text-xs text-muted">{say.say("players.localThere", { time: entry.localTime })}</span> : null}
    </span>
  );
}
