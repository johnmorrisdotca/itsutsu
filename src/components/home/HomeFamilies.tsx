import Link from "next/link";

import { FamilyMark } from "@/components/games/FamilyMark";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, STRETCHED_CARD } from "@/components/ui/ui.constants";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { familyPath } from "@/lib/gomoku/slugs";

/**
 * THE FAMILIES, ON THE FRONT PAGE, SO A VISITOR SEES THE SHAPE OF THE
 * CATALOGUE BEFORE CHOOSING TO OPEN IT.
 *
 * The front page said "five in a row" and a number, and the other seven
 * families — drops, Othello and its cousins, checkers, go and hex, the races,
 * the strange boards, the small ones — were a click away and unnamed. A
 * reader who came for checkers had no way of knowing it was here.
 *
 * Read from `GAME_FAMILIES`, the list /games draws, so a family added there is
 * on this page the same day. Each card is the way into that family's page,
 * which is open to anyone and shows exactly the games the card counted.
 */
export function HomeFamilies() {
  return (
    <section className="flex flex-col gap-4" data-testid="front-families">
      <div className="flex flex-col gap-1">
        <h2 className="flex flex-wrap items-baseline gap-x-2 font-semibold">
          {GAME_FAMILIES.length} families of games
          <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">種目</span>
        </h2>
        <p className="max-w-prose text-sm text-muted">
          Five in a row is where it started; the other families are the games that grew up beside it, from Othello and
          checkers to go and hex. Open one to see its games, their rules, and a picture of each board.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {GAME_FAMILIES.map((family) => (
          <li key={family.key}>
            <Link
              href={familyPath(family.games[0])}
              data-card-link=""
              data-testid="front-family"
              className={`${PANEL_CLASS} ${STRETCHED_CARD} flex h-full items-center justify-between gap-3`}
            >
              <span className="flex min-w-0 items-start gap-3">
                <FamilyMark family={family.title} size="regular" />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                    {family.title}
                    <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">{family.kanji}</span>
                    <span className="text-xs font-normal text-muted">
                      {family.games.length} {family.games.length === 1 ? "game" : "games"}
                    </span>
                  </span>
                  <span className="text-xs text-muted">{family.blurb}</span>
                </span>
              </span>
              <CardArrow />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
