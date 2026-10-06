import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, RAISED_LINK, STRETCHED_CARD } from "@/components/ui/ui.constants";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import { listingWhy } from "@/lib/gomoku/familyCopy";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { pairedText } from "@/lib/gomoku/seatWords";
import { weave } from "@/lib/i18n/weave";
import { familyPath } from "@/lib/gomoku/slugs";

import type { FamilyShelfProps } from "./games.types";

/**
 * A FAMILY'S SHELF ON ITS OWN PAGE: every game it shows, one card each, its
 * own games first and then any listed from other families.
 *
 * Out of the family page, so the one family with an address of its own —
 * Party games, at /games/party, a shelf of guests with no game at home in it —
 * draws the same cards as every other family's page rather than a copy of
 * them.
 */
export async function FamilyShelf({ shelf, current = null }: FamilyShelfProps) {
  const say = await currentSpeaker();
  const locale = say.locale;
  return (
    <ul className="flex flex-col gap-3" data-testid="family-games">
      {shelf.map((shown) => {
        const game = shown.variant;
        const sibling = gameCopyFor(game, locale);
        return (
          /*
            The same card the catalogue draws, and the same rule: the whole
            card leads to the game, through its name stretched over it, with
            the arrow saying so. See the families view in GameCatalogue.tsx
            for the reasoning, and STRETCHED_CARD for the mechanism.
          */
          <li
            key={game}
            className={`${PANEL_CLASS} ${STRETCHED_CARD} flex items-center justify-between gap-3 ${
              game === current ? "border-rule-strong" : ""
            }`}
            data-testid={`family-game-${game}`}
            data-listed={shown.listed}
          >
            <GameThumb variant={game} size="regular" />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-baseline gap-2 font-semibold">
                <GameName variant={game} kanji stretched />
                {game === current ? <span className="text-xs font-normal text-muted">{say.say("gamepages.theOneYouCameFrom")}</span> : null}
              </span>
              {/* A guest says where it lives, and leads there, raised above the card's face — and why it is here too. */}
              {shown.listed === "shelf" ? (
                <>
                  <span className="text-xs text-muted" data-testid="family-game-home">
                    {weave(say.say("gamepages.alsoUnder"), {
                      family: (
                        <Link href={familyPath(game)} className={`${RAISED_LINK} underline underline-offset-2`}>
                          {pairedText(say, shown.home.title, shown.home.kanji)}
                        </Link>
                      ),
                    })}
                  </span>
                  <span className="text-sm" data-testid="family-game-why">
                    {listingWhy(game, shown.home.key, shown.why, locale)}
                  </span>
                </>
              ) : null}
              <span className="text-sm text-muted">{sibling.tagline}</span>
              {sibling.inspiredBy !== undefined ? (
                <span className="text-xs text-muted italic">{say.say("gamescreen.inspiredBy", { name: sibling.inspiredBy })}</span>
              ) : null}
            </span>
            <CardArrow />
          </li>
        );
      })}
    </ul>
  );
}
