import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { HistoryTable } from "@/components/history/HistoryTable";
import { Pager } from "@/components/history/Pager";
import { RecordText } from "@/components/history/RecordText";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { recordPath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { fetchGameHistoryPage, fetchWholeRecord } from "@/lib/history/gameHistory";
import { recordAsText } from "@/lib/history/recordText";
import { toGameHistoryQuery } from "@/lib/history/gameHistoryQuery";

type Params = Record<string, string | string[] | undefined>;

/**
 * The record, at /history — or one game's record, at /history/<slug>.
 *
 * Which game is in the path, because a game's record is a collection of its
 * own with an address of its own. The rest — result, size, player, sort, the
 * page — are filters on that collection and live in the query, so a filtered
 * view can still be linked, bookmarked and reloaded. The server reads them
 * the same way the API does, through `toGameHistoryQuery`.
 */
export async function RecordPage({ variant, params }: { variant?: RuleVariant; params: Params }) {
  const base = variant === undefined ? "/history" : recordPath(variant);
  const url = new URL(`https://itsutsu.local${base}`);
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && key !== "variant") url.searchParams.set(key, value);
  }
  if (variant !== undefined) url.searchParams.set("variant", variant);

  const query = toGameHistoryQuery(url);
  const asked = query ?? toGameHistoryQuery(new URL(`https://itsutsu.local${base}`))!;
  const [page, whole] = await Promise.all([
    fetchGameHistoryPage(asked),
    fetchWholeRecord(asked),
  ]);

  const flat = Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[0] !== "variant",
    ),
  );
  const copy = variant === undefined ? null : RULE_VARIANT_DISPLAY[variant];

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      <div className="flex flex-col gap-1">
        <h1 className="flex items-baseline gap-3 font-mincho text-2xl font-bold">
          棋譜
          {copy !== null ? (
            <span className="font-sans text-lg font-semibold" data-testid="record-game">
              {copy.label} <span className="font-mincho text-base font-normal opacity-70">{copy.kanji}</span>
            </span>
          ) : null}
        </h1>
        <p className="text-sm text-muted">
          {copy === null
            ? "Every finished game, newest first. Open one to replay it stone by stone."
            : `Every finished game of ${copy.label}, newest first. Open one to replay it stone by stone.`}
        </p>
      </div>

      <HistoryFilters variant={variant ?? null} />
      {query === null ? (
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
