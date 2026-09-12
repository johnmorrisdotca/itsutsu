import { isRefusal } from "@/lib/api/paging";
import { GameName } from "@/components/games/GameName";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HistoryFilters } from "./HistoryFilters";
import { HistoryTable } from "./HistoryTable";
import { Pager } from "./Pager";
import { RecordText } from "./RecordText";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { historyPath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { fetchGameHistoryPage, fetchWholeRecord } from "@/lib/history/gameHistory";
import { recordAsText } from "@/lib/history/recordText";
import { toGameHistoryQuery } from "@/lib/history/gameHistoryQuery";
import { type ImpliedPlayer, recordAddress } from "@/lib/history/recordAddress";

type Params = Record<string, string | string[] | undefined>;

/**
 * The record: every finished game at /history, or one game's at
 * /games/<slug>/history, or the reader's own at /games/<slug>/me.
 *
 * Which game is in the path, because a game's record is a collection of its
 * own with an address of its own — a facet of the game rather than a namespace
 * beside it. The rest — result, size, player, sort, the page — are filters on
 * that collection and live in the query, so a filtered view can still be
 * linked, bookmarked and reloaded. The server reads them the same way the API
 * does, through `toGameHistoryQuery`.
 *
 * `at` is for a collection that is narrower than "this game": /games/<slug>/me
 * is one game's record with a player already fixed, and its pager, its filter
 * bar and its links have to stay on that address rather than widening to
 * everybody's.
 */
export async function RecordPage({
  variant,
  params,
  at,
  impliedPlayer,
}: {
  variant?: RuleVariant;
  params: Params;
  /** The address this collection lives at, when it is not the game's whole record. */
  at?: string;
  /**
   * A player filter the ADDRESS implies rather than the query string —
   * /games/<slug>/me, the only caller today. Applied to the query the same
   * way `variant` already is, and kept out of every address this page
   * writes: see `recordAddress`, which is what actually keeps a member's
   * whole name from ever reaching a URL a reader could bookmark, share or
   * find in a server log.
   */
  impliedPlayer?: ImpliedPlayer;
}) {
  const base = at ?? (variant === undefined ? "/history" : historyPath(variant));
  const { query: queryParams, flat } = recordAddress(params, { variant, impliedPlayer });

  const url = new URL(`https://itsutsu.local${base}`);
  for (const [key, value] of Object.entries(queryParams)) url.searchParams.set(key, value);

  const parsed = toGameHistoryQuery(url);
  /*
   * A PAGE DEGRADES WHERE THE API REFUSES, and the two are right for their own
   * readers. `/api/games` answers 400 naming the parameter, because a caller
   * wrote that address on purpose and can fix it. A person who followed a stale
   * link gets the record they came for and a line saying their filters were not
   * applied — a page is not a place to put an error somebody cannot act on.
   */
  const refused = isRefusal(parsed);
  const query = refused ? null : parsed;
  // What the query falls back to when the reader's own filters do not parse —
  // still carrying whatever the address itself implies, so an invalid `page`
  // on /games/<slug>/me can never widen "your games" into everybody's.
  const { query: fallbackParams } = recordAddress({}, { variant, impliedPlayer });
  const fallbackUrl = new URL(`https://itsutsu.local${base}`);
  for (const [key, value] of Object.entries(fallbackParams)) fallbackUrl.searchParams.set(key, value);
  const fallback = toGameHistoryQuery(fallbackUrl);
  /*
   * The bare address always parses — it is nothing but the path — so a refusal
   * here would be a programming mistake rather than something a reader did.
   * Thrown rather than coerced: a plausible empty query would render the record
   * of no games at all and look like a site with nothing in it.
   */
  if (isRefusal(fallback)) throw new Error(`The record's own address does not parse: ${fallback.error}`);
  const asked = query ?? fallback;
  const [page, whole] = await Promise.all([
    fetchGameHistoryPage(asked),
    fetchWholeRecord(asked),
  ]);

  const copy = variant === undefined ? null : RULE_VARIANT_DISPLAY[variant];

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      <div className="flex flex-col gap-1">
        <h1 className="flex items-baseline gap-3 font-mincho text-2xl font-bold">
          棋譜
          {variant !== undefined && copy !== null ? (
            <span className="font-sans text-lg font-semibold" data-testid="record-game">
              <GameName variant={variant} kanji />
            </span>
          ) : null}
        </h1>
        <p className="text-sm text-muted">
          {copy === null
            ? "Every finished game, newest first. Open one to replay it stone by stone."
            : `Every finished game of ${copy.label}, newest first. Open one to replay it stone by stone.`}
        </p>
      </div>

      <HistoryFilters
        variant={variant ?? null}
        appliedPlayer={
          asked.player === null
            ? null
            : {
                name: asked.player,
                memberId: impliedPlayer?.memberId ?? null,
                // Removable unless the address is the one implying it — a
                // reader who typed ?player=X into /history can take it off;
                // /games/<slug>/me cannot mean anything else.
                removable: impliedPlayer === undefined,
              }
        }
      />
      {refused ? (
        <p className="rounded-xl border border-rule px-4 py-3 text-sm text-muted">
          Those filters were not valid, so this is the unfiltered record.
        </p>
      ) : null}
      <HistoryTable items={page.items} />
      <Pager pagination={page.pagination} params={flat} basePath={base} />
      {/*
        Every game these filters select, not just the page being looked at:
        somebody copying the record out wants the record, and the filters are
        how they said which part of it they meant.
      */}
      <RecordText
        text={recordAsText(whole.items, {
          heading:
            copy === null
              ? "Itsutsu \u2014 every finished game"
              : `Itsutsu \u2014 every finished game of ${copy.label}`,
          total: whole.total,
        })}
      />
  </Page>
  );
}
