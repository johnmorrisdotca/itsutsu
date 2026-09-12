"use client";

import type { ReactNode } from "react";

import { CardArrow } from "@/components/ui/CardArrow";
import { FOCUS_RING, SECTION_TITLE } from "@/components/ui/ui.constants";
import type { SettingWord } from "./rulesSummary";

/**
 * The settings that are not the game or the board, folded behind the line
 * that says what they currently are.
 *
 * WHY IT EXISTS, in numbers, because it was a measurement rather than a
 * preference. The set-up screen's two dropdowns became a picture of every
 * family and a row of board blocks, which is what John asked for and is 470
 * pixels taller than what it replaced. On an iPad in Safari the Start button
 * then sat below the fold — a screen where you cannot reach the button that
 * starts the game is worse than the dropdowns it replaced, and no amount of
 * trimming the pickers closed a gap that size. The five controls underneath
 * were about 230 pixels of the panel and none of them is the question the
 * screen exists to ask, so they are the ones that fold.
 *
 * CLOSED BY DEFAULT, AND HONEST ABOUT IT. A `<details>`, so a reader who has
 * not tapped it is told by the browser that there is something closed here —
 * keyboard, screen reader and the Enter key all work without being rebuilt,
 * and it opens before React has attached, which a button driving state does
 * not. `/games` already uses `<details>` for its family accordions, so this
 * is the site's own disclosure rather than a second one.
 *
 * The row shades under a pointer and takes the site's focus ring, rather
 * than leaning on the chevron to report hover: CARD_ARROW_CLASS answers to a
 * `data-card-link`, which a summary is not, so the arrow here reports OPEN
 * (a quarter turn) and the row reports POINTED AT. Two signs, two facts.
 *
 * THE SUMMARY IS THE POINT, not a label on a drawer. John's rule for a
 * confirmation is one press to accept with everything still changeable: the
 * line is the "sees", the tap is the "changeable". So a rematch that arrives
 * with a five-minute clock and no resigning says so without being opened,
 * and the words come from the same value the controls are bound to — see
 * `describeSettings` — so the line cannot describe a game other than the one
 * the button would start.
 */
export function MoreSettings({
  summary,
  children,
}: {
  /** What the folded controls currently say, in the order they appear inside. */
  summary: SettingWord[];
  /** The controls themselves, moved here unchanged. */
  children: ReactNode;
}) {
  return (
    <details className="group/more flex flex-col" data-testid="more-settings">
      {/*
        `list-none` and the marker rule kill the browser's own triangle, since
        the chevron at the right is the site's sign that a thing opens — the
        same one every card on /games carries. `cursor-pointer` because the
        whole row is the control.
      */}
      <summary
        className={
          "flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 py-2" +
          ` transition-colors hover:bg-shade ${FOCUS_RING}` +
          " [&::-webkit-details-marker]:hidden"
        }
        data-testid="more-settings-open"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className={SECTION_TITLE}>
            The rest of the rules <span className="font-mincho normal-case tracking-normal">残りの規則</span>
          </span>
          {/*
            One line, wrapping rather than truncating: a summary cut off at
            the edge of the panel is a summary that stops being true halfway
            along, which is the one thing it must not do.

            The notable ones are drawn in ink and the ordinary ones muted, so
            a clock or an unrated game catches the eye in a line that is
            otherwise the same on every visit. Weight and colour together,
            never colour alone.
          */}
          <span className="flex flex-wrap items-baseline gap-x-1.5 text-xs" data-testid="more-settings-summary">
            {summary.map((word, at) => (
              <span key={word.text} className="flex items-baseline gap-1.5">
                {at > 0 ? <span aria-hidden="true" className="text-muted/60">·</span> : null}
                <span
                  className={word.notable ? "font-semibold text-ink" : "text-muted"}
                  data-notable={word.notable ? "true" : "false"}
                >
                  {word.text}
                </span>
              </span>
            ))}
          </span>
        </span>
        {/*
          Turned a quarter when open, which is the one place this differs from
          a card's arrow: a card's chevron points at somewhere you are going,
          and this one reports whether the drawer under it is open.
        */}
        <CardArrow className="transition-transform group-open/more:rotate-90" />
      </summary>
      <div className="mt-1 flex flex-col gap-3 border-t border-rule pt-3">{children}</div>
    </details>
  );
}
