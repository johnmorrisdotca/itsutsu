import { SiteHeader } from "@/components/layout/SiteHeader";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { HistoryTable } from "@/components/history/HistoryTable";
import { Pager } from "@/components/history/Pager";
import { fetchGameHistoryPage } from "@/lib/history/gameHistory";
import { toGameHistoryQuery } from "@/lib/history/gameHistoryQuery";

export const metadata = {
  title: "Record 棋譜 · Gomoku",
  description: "Every game played, with the stones in the order they were laid.",
};

/**
 * The record. Filters live in the URL, so this reads them the same way the API
 * does — through `toGameHistoryQuery` — and a filtered view can be shared.
 */
export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const params = await searchParams;

  const url = new URL("https://gomoku.local/history");
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") url.searchParams.set(key, value);
  }

  const query = toGameHistoryQuery(url);
  const page = await fetchGameHistoryPage(
    query ?? toGameHistoryQuery(new URL("https://gomoku.local/history"))!,
  );

  const flat = Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );

  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-6">
        <SiteHeader />

        <div className="flex flex-col gap-1">
          <h1 className="font-mincho text-2xl font-bold">棋譜</h1>
          <p className="text-sm text-muted">
            Every finished game, newest first. Open one to replay it stone by stone.
          </p>
        </div>

        <HistoryFilters />
        {query === null ? (
          <p className="rounded-xl border border-rule px-4 py-3 text-sm text-muted">
            Those filters were not valid, so this is the unfiltered record.
          </p>
        ) : null}
        <HistoryTable items={page.items} />
        <Pager pagination={page.pagination} params={flat} />
      </main>
    </div>
  );
}
