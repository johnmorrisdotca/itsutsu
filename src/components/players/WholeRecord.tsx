import { Paired } from "@/components/i18n/Paired";
import { Figures } from "@/components/ui/Figures";
import { PlayedFigure, RecordFigure } from "./PlayerRecord";
import { RecordTable } from "./RecordTable";
import { winRateText } from "@/lib/rating/figures";
import type { WholeRecord as Whole } from "@/lib/legacy/wholeRecord";

/**
 * Everything somebody has played, across every site they played it on.
 *
 * Beside the tabs rather than instead of them: somebody who played four
 * thousand games on ItsYourTurn and twenty here should see a figure that
 * reflects a life of playing, and still be able to see which part came from
 * where.
 *
 * There is no combined rating and there will not be one. Games and wins add
 * up; ratings do not. GoldToken's own averaged about 1689 on a scale that is
 * not this site's Elo and was never converted to it, so adding or averaging
 * the two would invent a number describing nothing. The panel says so in
 * words, because a figure that is missing without explanation reads as an
 * oversight rather than as a decision.
 */
/**
 * The part not to soften, and not to let drift away from the figures it is
 * about.
 *
 * Somebody who assumes their current play elsewhere is flowing in is being
 * misled by omission, and they find out at the worst moment — when the number
 * is wrong and they had trusted it. It is a component rather than a paragraph
 * because the combined figure is now what a player page LEADS with, so this
 * has to be able to travel up beside it. A warning that stays put while the
 * number it qualifies moves to the top of the page has quietly become fine
 * print, which is the same as not saying it.
 */
export function SnapshotWarning() {
  return (
    <p className="text-xs leading-snug text-muted" data-testid="whole-record-snapshot">
      <span className="font-semibold text-ink-soft">This does not update.</span> The figures from other
      sites were copied down by hand, once, and are a snapshot of that day rather than a live count —
      nothing played there since is in them. Only what happened here is counted as it happens.
      Bringing the rest up to date automatically is a thing we would like to do and have not done.
    </p>
  );
}

export function WholeRecordPanel({
  whole,
  name,
  showFigures = true,
}: {
  whole: Whole;
  /** Whose record, so this site's own row can lead to the games behind it. */
  name?: string;
  showFigures?: boolean;
}) {
  if (whole.figures.played === 0) return null;

  return (
    <section className="flex flex-col gap-3" data-testid="whole-record">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        <Paired en="Everything played" kanji="通算" kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
      </h2>

      {/*
        Left out when the headline above is already counting everywhere —
        the same three numbers twice on one screen reads as two figures that
        happen to agree, and invites the reader to look for the difference.
        The breakdown below is what this section is for in that case.
      */}
      {showFigures ? (
        <Figures
          testId="whole-record-figures"
          figures={[
            {
              label: "Played",
              value: (
                <PlayedFigure
                  record={{
                    wins: whole.figures.won,
                    losses: whole.figures.lost,
                    draws: whole.figures.drawn,
                  }}
                  of={{ player: name, here: !whole.kept }}
                />
              ),
              testId: "whole-played",
            },
            {
              label: "Won · Lost · Drawn",
              /*
                A total that includes another site has no set of games here to
                open — it is partly a number copied down once. When this site
                is all of it, the same three numbers do lead to the games.
              */
              value: (
                <RecordFigure
                  record={{
                    wins: whole.figures.won,
                    losses: whole.figures.lost,
                    draws: whole.figures.drawn,
                  }}
                  of={{ player: name, here: !whole.kept }}
                />
              ),
              testId: "whole-record-line",
            },
            { label: "Win rate", value: winRateText(whole.figures.winRate), testId: "whole-win-rate" },
          ]}
        />
      ) : null}

      {/*
        A table rather than a run of dots on a line. These rows exist to be
        compared — four thousand games on one site against twenty on another —
        and comparing is what a column does and a sentence does not. It is the
        same table as every other record on the site, so a site's line reads
        the way a player's row does elsewhere.

        NO RATING COLUMN AND NO STREAK, and both are decisions. A rating from
        another site is on another scale and does not add — the paragraph below
        says so at length. A streak is stronger still: a run is an ORDER, and
        what was kept from another site is four totals with no order in them at
        all. Nor would this site's own row have one worth printing, because a
        run interleaves with games played elsewhere that are not in this table.
        Silence is the honest answer; a dash in every cell would be a column
        that says nothing while looking like one that does.
      */}
      <RecordTable
        subject="Site"
        rows={whole.sources.map((source) => ({
          key: source.site,
          subject: (
            <>
              <span className="font-medium text-ink-soft">
                {/*
                  The link is how somebody checks the claim, so it goes where
                  one was written down and nowhere else. An address guessed
                  from a site name and a handle would point at the wrong person
                  as often as the right one, which is worse than no link at
                  all.
                */}
                {source.url === null ? (
                  source.site
                ) : (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline underline-offset-2"
                    data-testid="whole-record-link"
                  >
                    {source.site}
                  </a>
                )}
              </span>
              {source.handle !== null ? (
                <span className="ml-1.5 text-muted">as {source.handle}</span>
              ) : null}
            </>
          ),
          record: {
            wins: source.figures.won,
            losses: source.figures.lost,
            draws: source.figures.drawn,
          },
          /*
            Only this site's row has games to open. The others are four numbers
            copied down once from a site that is still standing and still
            counting — true, and with nothing behind them here.
          */
          of: { player: name, here: source.here },
          streak: null,
          streakBlankBecause:
            "These rows are one site's totals, and a run is an order — the games of two sites interleave in time, so no site's row is a run of anything.",
        }))}
        columns={{ rating: false }}
        testId="whole-record-sources"
        empty={<>Nothing has been recorded under this name anywhere yet.</>}
      />

      {whole.kept && showFigures ? <SnapshotWarning /> : null}

      <p className="text-xs leading-snug text-muted" data-testid="whole-record-no-rating">
        No combined rating, and there will not be one: a rating from another site is on another
        scale, against other players, and adding or averaging two of them would make a number that
        describes nothing. Games and wins add up honestly; ratings do not.
      </p>
    </section>
  );
}
