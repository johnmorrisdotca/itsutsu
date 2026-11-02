import { ReadyOffline } from "@/components/offline/ReadyOffline";
import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameStatsStrip } from "@/components/games/GameStats";
import { PuzzleLine } from "@/components/puzzles/PuzzleLine";
import { GameThumb } from "@/components/games/GameThumb";
import { CardArrow } from "@/components/ui/CardArrow";
import { weave } from "@/lib/i18n/weave";
import { RAISED_LINK, STRETCHED_CARD } from "@/components/ui/ui.constants";
import type { CatalogueStats } from "@/lib/catalogue/catalogue.types";
import { isCasualKind, isHousekiKind, isPartyKind, isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { HousekiLine } from "@/components/houseki/HousekiLine";
import { CasualLine } from "@/components/casual/CasualLine";
import { PartyLine } from "@/components/party/PartyLine";
import { familyPath } from "@/lib/gomoku/slugs";
import type { Speaker } from "@/lib/i18n/i18n";
import { pairedText } from "@/lib/gomoku/seatWords";

import type { CatalogueFamily, CatalogueGame, CatalogueGuest } from "./games.types";

/** What a family holds, drawn open: its blurb and a card for each of its games and each guest from another family. */
export function FamilyBody({ family, stats, signedIn, say }: { family: CatalogueFamily; stats: CatalogueStats; signedIn: boolean; say: Speaker }) {
  return (
    <>
      <p className="mt-2 text-sm text-muted">{family.blurb}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {family.games.map((game) => (
          <FamilyGameCard key={game.variant} game={game} stats={stats} signedIn={signedIn} say={say} />
        ))}
        {/* Guests from other families, after the family's own: see ALSO_LISTED_IN. */}
        {family.guests.map((guest) => (
          <FamilyGameCard key={guest.variant} game={guest} stats={stats} signedIn={signedIn} say={say} />
        ))}
      </ul>
    </>
  );
}

/**
 * One game on a family's shelf, at home there or a guest from its own family.
 *
 * THE WHOLE CARD IS THE WAY INTO THE GAME. John, looking at this box:
 * "Mousing over a game should show us a button to click… right now we're
 * forced to click the name." The box read as one object and answered on two
 * words of it.
 *
 * The name is still the one link to the game, and it is spread over the card
 * (`stretched`) rather than a second link being laid under it — so a keyboard
 * reader gets one stop for one destination and a screen reader hears one link,
 * not two. The count and the last game lead ELSEWHERE, so they are `raised`
 * above the face; anything added to this card that leads somewhere needs the
 * same, or the face swallows the click. The arrow at the right is the sign that
 * the card opens, and it is drawn at rest so a finger on an iPad — where
 * nothing hovers — is told the same thing a pointer is. See ui.constants.ts.
 *
 * A GUEST IS THE SAME CARD: the same name leading to the same game, the same
 * figures, because it is the same game. One line more says where it lives —
 * "also under Flips" — and leads to that family, raised like every other link
 * on the card.
 */
function FamilyGameCard({
  game,
  stats,
  signedIn,
  say,
}: {
  game: CatalogueGame | CatalogueGuest;
  stats: CatalogueStats;
  signedIn: boolean;
  say: Speaker;
}) {
  const guest = "home" in game;
  return (
    <li
      className={`${STRETCHED_CARD} flex items-center justify-between gap-3 rounded-lg border border-rule px-3 py-2 text-sm`}
      data-testid="family-game"
      data-variant={game.variant}
      data-listed={guest ? "shelf" : "home"}
    >
      {/*
        The game's board, the way /games/new's picker and every list of games
        draws it. John: "Looks like we aren't showing the icons for all the
        variant games in a family!" In flow under the stretched name, so a tap
        on it opens the card.
      */}
      <GameThumb variant={game.variant} size="regular" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-medium">
          <GameName variant={game.variant} kanji stretched />
        </span>
        {guest ? (
          <span className="text-[0.7rem] text-muted" data-testid="family-game-home">
            {weave(say.say("gamepages.alsoUnder"), {
              family: (
                <Link href={familyPath(game.variant)} className={`${RAISED_LINK} underline underline-offset-2`}>
                  {pairedText(say, game.home.title, game.home.kanji)}
                </Link>
              ),
            })}
          </span>
        ) : null}
        {/* And why it is on this shelf too: the reason `ALSO_LISTED_IN` gives beside it. */}
        {guest ? (
          <span className="text-[0.7rem] text-muted" data-testid="family-game-why">
            {game.why}
          </span>
        ) : null}
        <span className="text-xs text-muted">{game.tagline}</span>
        {/* Whether this device can play it with no connection (`ReadyOffline`). */}
        <ReadyOffline game={game.variant} />
        {game.inspiredBy !== undefined ? (
          <span className="text-[0.7rem] text-muted italic">{say.say("gamescreen.inspiredBy", { name: game.inspiredBy })}</span>
        ) : null}
        {/*
          What has been played of it, and who is best at it. It replaces "12
          played · last Kyu vs Dan", which was the last game's two names and
          nothing about the game; the date of that game is in the strip, and for
          a member it still opens the game. The same figures on a guest's card as
          at home: they are the game's, not the shelf's.
        */}
        {isPuzzleKind(game.variant) ? (
          <PuzzleLine kind={game.variant} signedIn={signedIn} />
        ) : isPartyKind(game.variant) ? (
          <PartyLine kind={game.variant} signedIn={signedIn} />
        ) : isCasualKind(game.variant) ? (
          <CasualLine kind={game.variant} signedIn={signedIn} />
        ) : isHousekiKind(game.variant) ? (
          <HousekiLine kind={game.variant} signedIn={signedIn} />
        ) : (
          <GameStatsStrip stats={stats.games[game.variant]} signedIn={signedIn} />
        )}
      </span>
      <CardArrow />
    </li>
  );
}

