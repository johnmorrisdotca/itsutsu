import Link from "@/components/ui/Link";
import { ResultMark } from "@/components/game/ResultMark";
import { markOfOutcome } from "@/components/game/resultMarks";

import { Figures } from "@/components/ui/Figures";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PlayedFigure, RecordFigure } from "./PlayerRecord";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { figuresForSource } from "@/lib/legacy/keptFigures";
import { figuresOf, winRateText } from "@/lib/rating/figures";
import { findLegacyPlayer } from "@/lib/legacy/legacyPlayers.data";
import type {
  LegacyClassRecord,
  LegacyGameRecord,
  LegacyPlayer,
  LegacySource,
} from "@/lib/legacy/legacyPlayers.types";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { formatSpecFor } from "@/lib/i18n/format";
import { weave } from "@/lib/i18n/weave";
import { weekdayWords } from "@/lib/social/daysOff";
import { KeptGames } from "./KeptGames";

/**
 * The days a kept record's player took off, as the record wrote them in English ("Saturday and Sunday"), said as the
 * reader's language says its weekdays. A phrase that is not a list of weekday names is a note somebody wrote, and is shown as written.
 */
function daysOffWords(written: string, say: Speaker): string {
  const english = formatSpecFor("en").weekdays;
  const days = written.split(/,\s*|\s+and\s+/).map((name) => english.indexOf(name.trim()));
  return days.length > 0 && days.every((day) => day >= 0) ? say.list(days.map((day) => weekdayWords(say, day).label)) : written;
}

/** A logged result in a word, in the reader's language. */
const RESULT_WORD: Readonly<Record<"won" | "lost" | "drawn", PhraseKey>> = { won: "players.outcomeWon", lost: "players.outcomeLost", drawn: "players.outcomeDrawn" };

/**
 * Everything one site holds about one person.
 *
 * This is a whole tab's worth: who they were there, what they played, what
 * they were told about it, and the games kept in full. It used to be one
 * section of a page that stacked all of them; a man who played on two sites
 * for twenty years does not fit in a scroll.
 */

/*
 * A SOURCE SITE'S GAME NAME GOES THROUGH THE SHARED `GameName`, and this file
 * used to have its own.
 *
 * The copy did everything the shared one does — resolve the outside name
 * through `gameAliases`, say plainly when there is no game here to open — and
 * led to `rulesPath` rather than to the game. That was right when the rules
 * page was the front door and wrong from the moment the address move made
 * /games/<slug> the front door: `GameName` is the one line that decides where
 * every game name on this site leads, and a second copy of it is a page that
 * stopped following when that line moved.
 *
 * Nothing about the name is lost. The shared component keeps a `name` given to
 * it — "Flipversi", "Keryo Pente" — because that is a name somebody wrote down,
 * and it is not ours to replace with our own.
 */

/** One game's individual results, where the source site logged them one by one rather than only a total. */
function GameLog({ game, say }: { game: LegacyGameRecord; say: Speaker }) {
  if (game.log === undefined || game.log.length === 0) return null;
  return (
    <details className="ml-0">
      <summary className="cursor-pointer text-xs text-muted underline-offset-2 hover:underline">
        {say.say("players.legacyOpen", { count: say.number(game.log.length) })}
      </summary>
      <ul className="mt-1.5 flex flex-col divide-y divide-rule text-xs" data-testid="legacy-log">
        {game.log.map((entry, index) => (
          <li key={`${entry.date}-${entry.opponent}-${index}`} className="flex items-center justify-between gap-3 py-1">
            <span className="text-muted">{entry.date}</span>
            <span className="flex-1 truncate px-2">{entry.opponent}</span>
            <span className="inline-flex items-center gap-1 font-mono">
              <ResultMark kind={markOfOutcome(entry.result === "drawn" ? "draw" : entry.result)} />
              {say.say(RESULT_WORD[entry.result])}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

const NUMERIC = "py-1.5 pr-3 text-right font-mono tabular-nums";

/*
 * Nothing on this panel links, and it says so rather than simply not doing it.
 *
 * These are the figures from another site, copied down once. There is no game
 * here behind any of them, so `here: false` is the whole record of this
 * panel's relationship to the rule in AGENTS.md: not an oversight, an
 * exception with a reason, and one the coverage test can see.
 */
const ELSEWHERE = { here: false } as const;
const HEADING = "pb-1.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase";

/** Won, lost and drawn, and what falls out of them, for one row of a table. */
function ResultCells({ record, say }: { record: { won: number; lost: number; drawn: number }; say: Speaker }) {
  const figures = figuresOf(record);
  return (
    <>
      <td className={NUMERIC}>
        <PlayedFigure say={say} record={{ wins: record.won, losses: record.lost, draws: record.drawn }} of={ELSEWHERE} />
      </td>
      <td className={NUMERIC}>
        <RecordFigure say={say} record={{ wins: record.won, losses: record.lost, draws: record.drawn }} of={ELSEWHERE} />
      </td>
      <td className={NUMERIC} data-testid="legacy-win-rate">
        {winRateText(figures.winRate)}
      </td>
    </>
  );
}

/**
 * One class of games — whatever the source site counted separately: regular
 * play, tournaments, the ladder — with its total and its by-game breakdown in
 * the same columns, so the eye reads down a column rather than across a line.
 */
function LegacyClassTable({ row, say }: { row: LegacyClassRecord; say: Speaker }) {
  const detail = row.detail ?? [];
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <h3 className={SECTION_TITLE}>{row.class}</h3>
      <div className={TABLE_SCROLL}>
        <table className="w-full text-sm" data-testid={detail.length > 0 ? "legacy-detail" : "legacy-class"}>
          <thead>
            <tr className="text-left">
              <th className={HEADING}>{say.say("players.legacyGame")}</th>
              <th className={`${HEADING} text-right`}>{say.say("players.colPlayed")}</th>
              <th className={`${HEADING} text-right`}>{say.say("players.wld")}</th>
              <th className={`${HEADING} text-right`}>{say.say("players.colWinRate")}</th>
            </tr>
          </thead>
          <tbody>
            {detail.map((game) => (
              <tr key={game.game} className="border-t border-rule">
                <td className="py-1.5 pr-3 align-top">
                  {/*
                    The board of the game this name is OURS for, through its
                    alias — and nothing for a name with no game here, rather
                    than the nearest board to it.
                  */}
                  <span className="flex items-center gap-2">
                    <GameThumb name={game.game} size="small" />
                    <GameName name={game.game} />
                  </span>
                  <GameLog game={game} say={say} />
                </td>
                <ResultCells record={game} say={say} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-rule-strong font-medium">
              <td className="py-1.5 pr-3" data-testid="legacy-class-total">
                {detail.length > 0 ? say.say("players.legacyTotal") : row.class}
              </td>
              <ResultCells record={row.record} say={say} />
            </tr>
          </tfoot>
        </table>
      </div>
      {detail.length > 0 && !row.detailComplete ? (
        <p className="text-xs text-muted">
          {say.say("players.legacyBreakdown")}
        </p>
      ) : null}
    </section>
  );
}

/** Remarks left on something posted at one site — kept exactly as found. */
function LegacyComments({ source, say }: { source: LegacySource; say: Speaker }) {
  if (source.comments === undefined || source.comments.length === 0) return null;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-comments">
      <h3 className={SECTION_TITLE}>{say.say("players.legacyComments")}</h3>
      <ul className="flex flex-col gap-3">
        {source.comments.map((comment, index) => (
          <li
            key={`${comment.by}-${comment.at}-${index}`}
            className="flex flex-col gap-0.5 border-t border-rule pt-3 first:border-t-0 first:pt-0"
          >
            <p className="text-sm whitespace-pre-line">{comment.text}</p>
            <p className="text-xs text-muted">
              <span className="font-medium text-ink-soft">{comment.by}</span> · {comment.at}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** This person's own record against one other legacy player, game by game. */
function HeadToHead({ source, say }: { source: LegacySource; say: Speaker }) {
  if (source.headToHead === undefined || source.headToHead.length === 0) return null;
  return (
    <>
      {source.headToHead.map((entry) => {
        const opponent = findLegacyPlayer(entry.opponent);
        const figures = figuresOf({
          won: entry.games.filter((g) => g.result === "won").length,
          lost: entry.games.filter((g) => g.result === "lost").length,
          drawn: entry.games.filter((g) => g.result === "drawn").length,
        });
        return (
          <section key={entry.opponent} className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-head-to-head">
            <h3 className="flex items-baseline justify-between gap-3 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
              {say.say("players.legacyAgainst")}{" "}
              {opponent !== null ? (
                <Link
                  href={`/players/${opponent.slug}`}
                  className="normal-case tracking-normal text-ink-soft underline-offset-2 hover:underline"
                >
                  {opponent.name}
                </Link>
              ) : (
                <span className="normal-case tracking-normal text-ink-soft">{entry.opponent}</span>
              )}
              {/*
                The shared shape, not a fourth spelling of it. This one escaped
                the guard on record shapes only by naming: it reads `.won` and
                `.lost` where the guard looks for `.wins` and `.losses`, which
                is a difference in vocabulary and none at all in what is drawn.
              */}
              <span className="font-mono normal-case tracking-normal text-ink-soft">
                <RecordFigure
                  say={say}
                  record={{ wins: figures.won, losses: figures.lost, draws: figures.drawn }}
                  of={ELSEWHERE}
                />{" "}
                · {winRateText(figures.winRate)}
              </span>
            </h3>
            <div className={TABLE_SCROLL}>
              <table className="w-full text-sm" data-testid="legacy-head-to-head-log">
                <tbody>
                  {entry.games.map((game, index) => (
                    <tr key={`${game.date}-${index}`} className="border-t border-rule">
                      <td className="py-1.5 pr-3 text-muted">{game.date}</td>
                      <td className="py-1.5 pr-3">
                        <span className="flex items-center gap-2">
                          <GameThumb name={game.game} size="small" />
                          <GameName name={game.game} />
                        </span>
                      </td>
                      <td className="py-1.5 pr-3 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <ResultMark kind={markOfOutcome(game.result === "drawn" ? "draw" : game.result)} />
                          {say.say(RESULT_WORD[game.result])}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </>
  );
}

/**
 * What one site says about the person, above their figures: the handle they
 * used, the years, the days they set aside, and any line of context.
 */
function SourceHeading({ legacy, source, say }: { legacy: LegacyPlayer; source: LegacySource; say: Speaker }) {
  const handle = <span className="font-medium text-ink-soft">{source.handle ?? legacy.name}</span>;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-muted">
        {weave(say.say("players.legacyPlayedAs"), { handle })}
        {source.joined !== undefined && source.lastActive !== undefined
          ? say.say("players.legacyYears", { from: source.joined, to: source.lastActive })
          : null}
        {source.daysOff !== undefined ? say.say("players.legacyDaysOff", { days: daysOffWords(source.daysOff, say) }) : null}
        {say.sentence("")}{" "}
        {source.siteUrl !== undefined ? (
          <Link href={source.siteUrl} className="underline-offset-2 hover:underline">
            {say.say("players.legacyProfile", { site: source.site })}
          </Link>
        ) : null}
      </p>
      {source.note !== undefined ? (
        <p className="border-l-2 border-rule-strong pl-3 text-sm italic text-ink-soft">{source.note}</p>
      ) : null}
    </div>
  );
}

/** Everything one site holds about this person — one tab's worth. */
export async function LegacySourcePanel({
  legacy,
  source,
  keptFor,
}: {
  legacy: LegacyPlayer;
  source: LegacySource;
  /** The slug whose kept games belong to this record, when there are any. */
  keptFor?: string;
}) {
  const say = await currentSpeaker();
  const figures = figuresForSource(source);
  return (
    <div className="flex flex-col gap-6" data-testid="legacy-source" data-site={source.site}>
      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <SourceHeading legacy={legacy} source={source} say={say} />
        <Figures
          testId="legacy-figures"
          figures={[
            {
              label: say.say("players.colPlayed"),
              value: (
                <PlayedFigure
                  say={say}
                  record={{ wins: figures.won, losses: figures.lost, draws: figures.drawn }}
                  of={ELSEWHERE}
                />
              ),
            },
            {
              label: say.say("players.wld"),
              value: (
                <RecordFigure
                  say={say}
                  record={{ wins: figures.won, losses: figures.lost, draws: figures.drawn }}
                  of={ELSEWHERE}
                />
              ),
            },
            { label: say.say("players.colWinRate"), value: winRateText(figures.winRate) },
          ]}
        />
        {/*
          Two honest definitions, different answers, so the page says which one
          it means. A draw is half a point in this site's ratings, and a win
          rate counted any other way would disagree with a rating printed
          beside it — which is the fourth figure this row is waiting for.
        */}
        <p className="text-xs text-muted">
          {say.say("players.legacyFigures")}
        </p>
      </section>
      <HeadToHead source={source} say={say} />
      {source.summary.map((row) => (
        <LegacyClassTable key={`${source.site}-${row.class}`} row={row} say={say} />
      ))}
      <LegacyComments source={source} say={say} />
      {keptFor !== undefined ? <KeptGames slug={keptFor} site={source.site} /> : null}
    </div>
  );
}
