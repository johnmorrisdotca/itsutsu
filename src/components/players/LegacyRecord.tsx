import Link from "next/link";

import { GameReplay } from "@/components/history/GameReplay";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { rulesPath } from "@/lib/gomoku/slugs";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { aliasedVariant } from "@/lib/legacy/gameAliases";
import { keptGameDetail, keptGameName, keptGamesFor } from "@/lib/legacy/legacyGames.data";
import { findLegacyPlayer } from "@/lib/legacy/legacyPlayers.data";
import type {
  LegacyClassRecord,
  LegacyGame,
  LegacyGameRecord,
  LegacyPlayer,
  LegacySource,
} from "@/lib/legacy/legacyPlayers.types";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";

/**
 * A record kept from somewhere else.
 *
 * Some of the people on this site played for years before it existed, on
 * ItsYourTurn and GoldToken, and some of them are not here to play again.
 * What was kept of that is shown the way it was kept: their totals, the games
 * they played, the comments they left, and the head-to-head records worth
 * remembering. It reads as a record rather than a profile, because that is
 * what it is — nobody can add to it now.
 */

/** A source site's game name, linked to the Itsutsu game it actually is, when there is one. */
function GameName({ name }: { name: string }) {
  const variant = aliasedVariant(name);
  if (variant === null) return <>{name}</>;
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

/** One class of games: its own totals, and its own by-game table when one was kept. */
function LegacyClassTable({ row }: { row: LegacyClassRecord }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <h2 className="flex items-baseline justify-between gap-3 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {row.class}
        <span className="font-mono normal-case tracking-normal text-ink-soft" data-testid="legacy-class-total">
          {row.record.won}W · {row.record.lost}L · {row.record.drawn}D
        </span>
      </h2>
      {row.detail !== undefined && row.detail.length > 0 ? (
        <>
          <table className="w-full text-sm" data-testid="legacy-detail">
            <tbody>
              {row.detail.map((game) => (
                <tr key={game.game} className="border-t border-rule">
                  <td className="py-1.5 pr-3 align-top">
                    <GameName name={game.game} />
                    <GameLog game={game} />
                  </td>
                  <td className="py-1.5 pr-3 align-top font-mono tabular-nums">
                    {game.won}W · {game.lost}L · {game.drawn}D
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!row.detailComplete ? (
            <p className="text-xs text-muted">As far as was recorded — the source site may hold more than what is copied down here.</p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

/** The games kept in full for one slug — a board a reader can step through, not just a result. */
function KeptGames({ slug }: { slug: string }) {
  const games = keptGamesFor(slug);
  if (games.length === 0) return null;
  return (
    <section className="flex flex-col gap-4" data-testid="kept-games">
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">Games we have</h2>
      {games.map((game) => (
        <KeptGame key={game.id} game={game} viewedAs={slug} />
      ))}
    </section>
  );
}

function KeptGame({ game, viewedAs }: { game: LegacyGame; viewedAs: string }) {
  const isBlack = game.black === viewedAs;
  const opponentSlug = isBlack ? game.white : game.black;
  const opponentName = keptGameName(opponentSlug);
  const colour = isBlack ? "black" : "white";
  const result = game.winner === null ? "drew" : game.winner === colour ? "won" : "lost";
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <p className="text-sm text-muted">
        {game.playedAt} · {variantLabel(game.variant)}, {game.size}×{game.size} · vs{" "}
        <Link href={`/players/${opponentSlug}`} className="font-medium text-ink-soft underline-offset-2 hover:underline">
          {opponentName}
        </Link>{" "}
        · played <span className="font-medium text-ink-soft">{colour}</span> · <span className="font-medium text-ink-soft">{result}</span> ·{" "}
        {game.source}
      </p>
      <GameReplay game={keptGameDetail(game)} />
    </div>
  );
}

/** Remarks left on something posted at one site — kept exactly as found. */
function LegacyComments({ source }: { source: LegacySource }) {
  if (source.comments === undefined || source.comments.length === 0) return null;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-comments">
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">Comments</h2>
      <ul className="flex flex-col gap-3">
        {source.comments.map((comment, index) => (
          <li key={`${comment.by}-${comment.at}-${index}`} className="flex flex-col gap-0.5 border-t border-rule pt-3 first:border-t-0 first:pt-0">
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
        const won = entry.games.filter((g) => g.result === "won").length;
        const drawn = entry.games.filter((g) => g.result === "drawn").length;
        const lost = entry.games.filter((g) => g.result === "lost").length;
        return (
          <section key={entry.opponent} className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-head-to-head">
            <h2 className="flex items-baseline justify-between gap-3 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
              Against{" "}
              {opponent !== null ? (
                <Link href={`/players/${opponent.slug}`} className="normal-case tracking-normal text-ink-soft underline-offset-2 hover:underline">
                  {opponent.name}
                </Link>
              ) : (
                <span className="normal-case tracking-normal text-ink-soft">{entry.opponent}</span>
              )}
              <span className="font-mono normal-case tracking-normal text-ink-soft">
                {won}W · {lost}L · {drawn}D
              </span>
            </h2>
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

const LEGACY_OWN_PAGE_COPY: Record<"remembered" | "honorary", { badge: string; tail: string }> = {
  remembered: { badge: "Remembered", tail: "Never played on Itsutsu — this record is kept, not earned here." },
  honorary: { badge: "Honorary member", tail: "Never played on Itsutsu — kept here as an honorary member, in her own right." },
};

/**
 * How a person is described where they played: the handle, the site, and the
 * years, in one clause per site.
 */
function playedAs(legacy: LegacyPlayer, source: LegacySource) {
  return (
    <>
      <span className="font-medium text-ink-soft">{source.handle ?? legacy.name}</span> on{" "}
      <span className="font-medium text-ink-soft">{source.site}</span>
      {source.joined !== undefined && source.lastActive !== undefined
        ? `, ${source.joined} to ${source.lastActive}`
        : null}
    </>
  );
}

/** Everything one site holds about this person, under that site's name. */
function LegacySourceSection({ legacy, source }: { legacy: LegacyPlayer; source: LegacySource }) {
  return (
    <>
      <section className="flex flex-col gap-2" data-testid="legacy-source">
        <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
          {source.site}
          {source.handle !== undefined ? (
            <span className="text-xs font-normal normal-case tracking-normal">as {source.handle}</span>
          ) : null}
        </h2>
        {source.note !== undefined ? (
          <p className="border-l-2 border-rule-strong pl-3 text-sm italic text-ink-soft">{source.note}</p>
        ) : null}
      </section>
      <HeadToHead source={source} />
      {source.summary.map((row) => (
        <LegacyClassTable key={`${source.site}-${row.class}`} row={row} />
      ))}
      <LegacyComments source={source} />
    </>
  );
}

/** A legacy record with its own address — nobody here plays under this name. */
export function LegacyOwnPage({ legacy }: { legacy: LegacyPlayer }) {
  const copy = legacy.kind === "elsewhere" ? null : LEGACY_OWN_PAGE_COPY[legacy.kind];
  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-player">
        <span className="w-fit rounded-full border border-rule-strong bg-ivory px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
          {copy?.badge ?? "Record elsewhere"}
        </span>
        <h1 className="text-lg font-semibold">{legacy.name}</h1>
        {/*
          One person, one page, however many sites they played on: the sites
          are named in one sentence here and then given a section each below,
          rather than being separate records that point at one another.
        */}
        <p className="text-sm text-muted">
          {legacy.location !== undefined ? `${legacy.location} · ` : ""}
          Played as{" "}
          {legacy.sources.map((source, index) => (
            <span key={source.site}>
              {index > 0 ? (index === legacy.sources.length - 1 ? ", and as " : ", as ") : ""}
              {playedAs(legacy, source)}
            </span>
          ))}
          . {copy?.tail ?? "From before Itsutsu — kept alongside whatever they've since earned here."}
        </p>
      </section>
      {legacy.sources.map((source) => (
        <LegacySourceSection key={source.site} legacy={legacy} source={source} />
      ))}
      <KeptGames slug={legacy.slug} />
    </Page>
  );
}

/** A compact version of the same record, appended under a live profile it belongs beside. */
export function LegacyElsewherePanel({ legacy }: { legacy: LegacyPlayer }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-elsewhere-panel">
      <span className="flex flex-wrap items-baseline gap-2">
        <span className="w-fit rounded-full border border-rule-strong bg-ivory px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
          Record elsewhere
        </span>
        <span className="text-sm text-muted">
          Also played as{" "}
          {legacy.sources.map((source, index) => (
            <span key={source.site}>
              {index > 0 ? (index === legacy.sources.length - 1 ? ", and as " : ", as ") : ""}
              {playedAs(legacy, source)}
            </span>
          ))}
          .
        </span>
      </span>
      {legacy.sources.map((source) => (
        <div key={source.site} className="flex flex-col gap-2">
          {legacy.sources.length > 1 ? (
            <span className="text-xs font-semibold text-muted">{source.site}</span>
          ) : null}
          {source.note !== undefined ? (
            <p className="border-l-2 border-rule-strong pl-3 text-sm italic text-ink-soft">{source.note}</p>
          ) : null}
          <table className="w-full text-sm" data-testid="legacy-summary">
            <tbody>
              {source.summary.map((row) => (
                <tr key={row.class} className="border-t border-rule">
                  <td className="py-1.5 pr-3">{row.class}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums">
                    {row.record.won}W · {row.record.lost}L · {row.record.drawn}D
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}


/**
 * One player's profile: rating and tier, the record overall and by game, and
 * the last few games. Everything comes from the games table and the player's
 * row; nothing here is stored twice.
 *
 * A remembered or honorary player never played here at all, and gets this
 * whole address to themselves — no rating, no tier, just the record kept
 * from elsewhere. A live member who also has a record from before Itsutsu
 * gets both: their live profile, and that earlier record appended beneath it.
 */
