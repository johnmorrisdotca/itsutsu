import Link from "next/link";

import { Figures } from "@/components/ui/Figures";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { rulesPath } from "@/lib/gomoku/slugs";
import { aliasedVariant } from "@/lib/legacy/gameAliases";
import { figuresForSource } from "@/lib/legacy/keptFigures";
import { countText, figuresOf, recordText, winRateText } from "@/lib/rating/figures";
import { findLegacyPlayer } from "@/lib/legacy/legacyPlayers.data";
import type {
  LegacyClassRecord,
  LegacyGameRecord,
  LegacyPlayer,
  LegacySource,
} from "@/lib/legacy/legacyPlayers.types";
import { KeptGames } from "./KeptGames";

/**
 * Everything one site holds about one person.
 *
 * This is a whole tab's worth: who they were there, what they played, what
 * they were told about it, and the games kept in full. It used to be one
 * section of a page that stacked all of them; a man who played on two sites
 * for twenty years does not fit in a scroll.
 */

/**
 * A source site's game name, linked to the Itsutsu game it actually is.
 *
 * And said plainly when it is not one. A kept record lists games this site
 * does not have and never will — Backgammon, Nackgammon, Battleboats, most of
 * that list — and those used to render as bare words, which on a page where
 * every other game name is a link reads as a link somebody forgot to make.
 * The rule "every game name leads to that game" is only honest if the
 * exceptions look like exceptions.
 *
 * Greyed and italic rather than struck through or marked with a symbol: it is
 * part of somebody's history and belongs on the page at full size. The title
 * says why for anybody who wonders, and the name itself is never altered —
 * Nackgammon is what they played, whatever we have.
 */
export function GameName({ name }: { name: string }) {
  const variant = aliasedVariant(name);
  if (variant === null) {
    return (
      <span
        className="text-muted italic"
        title="Not a game played here — part of this record from elsewhere."
        data-testid="game-not-here"
      >
        {name}
      </span>
    );
  }
  return (
    <Link href={rulesPath(variant)} className="underline-offset-2 hover:underline">
      {name}
    </Link>
  );
}

/** One game's individual results, where the source site logged them one by one rather than only a total. */
function GameLog({ game }: { game: LegacyGameRecord }) {
  if (game.log === undefined || game.log.length === 0) return null;
  return (
    <details className="ml-0">
      <summary className="cursor-pointer text-xs text-muted underline-offset-2 hover:underline">
        {game.log.length} games, one by one
      </summary>
      <ul className="mt-1.5 flex flex-col divide-y divide-rule text-xs" data-testid="legacy-log">
        {game.log.map((entry, index) => (
          <li key={`${entry.date}-${entry.opponent}-${index}`} className="flex items-center justify-between gap-3 py-1">
            <span className="text-muted">{entry.date}</span>
            <span className="flex-1 truncate px-2">{entry.opponent}</span>
            <span className="font-mono">{entry.result}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

const NUMERIC = "py-1.5 pr-3 text-right font-mono tabular-nums";
const HEADING = "pb-1.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase";

/** Won, lost and drawn, and what falls out of them, for one row of a table. */
function ResultCells({ record }: { record: { won: number; lost: number; drawn: number } }) {
  const figures = figuresOf(record);
  return (
    <>
      <td className={NUMERIC}>{countText(figures.played)}</td>
      <td className={NUMERIC}>{recordText(figures)}</td>
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
function LegacyClassTable({ row }: { row: LegacyClassRecord }) {
  const detail = row.detail ?? [];
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <h3 className={SECTION_TITLE}>{row.class}</h3>
      <table className="w-full text-sm" data-testid={detail.length > 0 ? "legacy-detail" : "legacy-class"}>
        <thead>
          <tr className="text-left">
            <th className={HEADING}>Game</th>
            <th className={`${HEADING} text-right`}>Played</th>
            <th className={`${HEADING} text-right`}>Won · Lost · Drawn</th>
            <th className={`${HEADING} text-right`}>Win rate</th>
          </tr>
        </thead>
        <tbody>
          {detail.map((game) => (
            <tr key={game.game} className="border-t border-rule">
              <td className="py-1.5 pr-3 align-top">
                <GameName name={game.game} />
                <GameLog game={game} />
              </td>
              <ResultCells record={game} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-rule-strong font-medium">
            <td className="py-1.5 pr-3" data-testid="legacy-class-total">
              {detail.length > 0 ? "All of it" : row.class}
            </td>
            <ResultCells record={row.record} />
          </tr>
        </tfoot>
      </table>
      {detail.length > 0 && !row.detailComplete ? (
        <p className="text-xs text-muted">
          The breakdown is as far as it was recorded — the source site may hold more than what is copied down here. The
          total above it is the site&rsquo;s own.
        </p>
      ) : null}
    </section>
  );
}

/** Remarks left on something posted at one site — kept exactly as found. */
function LegacyComments({ source }: { source: LegacySource }) {
  if (source.comments === undefined || source.comments.length === 0) return null;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-comments">
      <h3 className={SECTION_TITLE}>Comments</h3>
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
function HeadToHead({ source }: { source: LegacySource }) {
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
              Against{" "}
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
              <span className="font-mono normal-case tracking-normal text-ink-soft">
                {figures.won}W · {figures.lost}L · {figures.drawn}D · {winRateText(figures.winRate)}
              </span>
            </h3>
            <table className="w-full text-sm" data-testid="legacy-head-to-head-log">
              <tbody>
                {entry.games.map((game, index) => (
                  <tr key={`${game.date}-${index}`} className="border-t border-rule">
                    <td className="py-1.5 pr-3 text-muted">{game.date}</td>
                    <td className="py-1.5 pr-3">
                      <GameName name={game.game} />
                    </td>
                    <td className="py-1.5 pr-3 font-mono">{game.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
function SourceHeading({ legacy, source }: { legacy: LegacyPlayer; source: LegacySource }) {
  const years =
    source.joined !== undefined && source.lastActive !== undefined ? `${source.joined} to ${source.lastActive}` : null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-muted">
        Played as <span className="font-medium text-ink-soft">{source.handle ?? legacy.name}</span>
        {years !== null ? <>, {years}</> : null}
        {source.daysOff !== undefined ? <>. Took {source.daysOff} off</> : null}.{" "}
        {source.siteUrl !== undefined ? (
          <Link href={source.siteUrl} className="underline-offset-2 hover:underline">
            Their profile on {source.site}
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
export function LegacySourcePanel({
  legacy,
  source,
  keptFor,
}: {
  legacy: LegacyPlayer;
  source: LegacySource;
  /** The slug whose kept games belong to this record, when there are any. */
  keptFor?: string;
}) {
  const figures = figuresForSource(source);
  return (
    <div className="flex flex-col gap-6" data-testid="legacy-source" data-site={source.site}>
      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <SourceHeading legacy={legacy} source={source} />
        <Figures
          testId="legacy-figures"
          figures={[
            { label: "Played", value: countText(figures.played) },
            { label: "Won · Lost · Drawn", value: recordText(figures) },
            { label: "Win rate", value: winRateText(figures.winRate) },
          ]}
        />
        {/*
          Two honest definitions, different answers, so the page says which one
          it means. A draw is half a point in this site's ratings, and a win
          rate counted any other way would disagree with a rating printed
          beside it — which is the fourth figure this row is waiting for.
        */}
        <p className="text-xs text-muted">
          Every figure here is worked out from the record and none of it is stored, so it cannot disagree with the
          totals below. A win rate counts a draw as half a game won, the way the ratings on this site score one.
        </p>
      </section>
      <HeadToHead source={source} />
      {source.summary.map((row) => (
        <LegacyClassTable key={`${source.site}-${row.class}`} row={row} />
      ))}
      <LegacyComments source={source} />
      {keptFor !== undefined ? <KeptGames slug={keptFor} site={source.site} /> : null}
    </div>
  );
}
