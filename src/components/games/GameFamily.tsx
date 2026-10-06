import { FamilyMark } from "@/components/games/FamilyMark";
import { Paired } from "@/components/i18n/Paired";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { familyBlurb } from "@/lib/gomoku/familyCopy";
import { weave } from "@/lib/i18n/weave";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, SECTION_TITLE, STRETCHED_ROW } from "@/components/ui/ui.constants";
import type { GameKey } from "@/lib/catalogue/gameKeys";
import Link from "@/components/ui/Link";
import { GAME_FAMILIES, familyPagePath, gamesShownIn, siblingsOf } from "@/lib/gomoku/families";
import { ALSO_LISTED_IN } from "@/lib/gomoku/familyShelves";

/**
 * The other games in this game's family, on the game's own page.
 *
 * The last of the seven errands John listed on /rules/connect-six, and the one
 * that had nowhere to go: "Decide that this game isn't one I want to play, but
 * the Variant it mentions is." A rules page told you what Connect6 was and
 * offered you a board; if the answer was no, the page was a dead end and the
 * way on was the browser's back button.
 *
 * The code for it already existed twice — on /games/<slug>, under the board,
 * and on /champions/<slug>, under the ladder. The page every game name on this
 * site points at was the one page that did not have it.
 *
 * Through `GameName`, so a sibling leads to that sibling's FRONT DOOR rather
 * than straight onto a board. The two older copies each chose a different
 * destination — the board page sends you to a board, the ladder page sends you
 * to a ladder — and both are answering "what do I do about this game" on
 * behalf of a reader who has not said yet. Its own page is where it says what
 * it is and offers all of it.
 */
export async function GameFamily({ variant }: { variant: GameKey }) {
  const say = await currentSpeaker();
  const siblings = siblingsOf(variant);
  if (siblings === null) return null;
  const { family } = siblings;
  /*
   * A family of one — Numbers, while Number Place is its only puzzle — still
   * has a family: the head is drawn, with its picture and its blurb, and the
   * empty list says so rather than the panel disappearing. An empty table is
   * data (AGENTS.md, "Show The Data"), and a page that hides its family
   * panel for one game is a page with a hole where the family should be.
   */
  /*
   * A game alone at home on a shelf of guests — Dots and Boxes on Party games —
   * lists the guests instead, since they are what a reader opening its family
   * finds beside it. Anywhere else a family's own games are its rows.
   */
  const rows = siblings.games.length > 0 ? siblings.games : gamesShownIn(family).map((shown) => shown.variant).filter((game) => game !== variant);
  const alone = rows.length === 0;
  /* The other shelves it is shown on (`ALSO_LISTED_IN`), each leading to that family's page. */
  const shelves = (ALSO_LISTED_IN[variant] ?? []).flatMap((listing) => GAME_FAMILIES.filter((one) => one.key === listing.family));

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="game-family">
      <h2 className={SECTION_TITLE}>
        <Paired en={say.say(alone ? "gamepages.family" : siblings.games.length > 0 ? "gamepages.titleAlsoInFamily" : "gamepages.titleAlsoOnShelf")} kanji="同族" kanjiClassName="font-mincho normal-case tracking-normal" />
      </h2>
      <div className="flex items-center gap-3">
        <FamilyMark family={family.title} size="regular" />
        <span className="flex min-w-0 flex-col">
          <span className="flex items-baseline gap-2 text-sm font-semibold">
            {say.pairsWithKanji ? family.title : family.kanji}
            {say.pairsWithKanji ? <span className="font-mincho text-xs font-normal opacity-70">{family.kanji}</span> : null}
          </span>
          <span className="text-xs text-muted">{familyBlurb(family, say.locale)}</span>
        </span>
      </div>
      {/*
        Each row is the way into that game, not only the words of its name:
        the name is stretched over the row and the arrow says so, the same
        sign the catalogue's cards carry. Out to the panel's edge and back
        in, so the shaded row under the pointer is a row and not a word. The
        board beside the name is in flow under the stretched link, so it is
        part of the row's target and not a stop of its own.
      */}
      {alone ? (
        <p className="text-xs text-muted" data-testid="game-family-alone">
          {say.say("gamepages.familyAlone")}
        </p>
      ) : null}
      {shelves.length > 0 ? (
        <p className="text-xs text-muted" data-testid="game-family-shelves">
          {weave(say.say("gamepages.alsoShownUnder"), {
            shelves: say.listPieces(
              shelves.map((shelf) => (
                <Link key={shelf.key} href={familyPagePath(shelf)} className="underline underline-offset-2" data-testid="game-family-shelf">
                  {say.pairsWithKanji ? shelf.title : shelf.kanji}
                </Link>
              )),
            ),
          })}
        </p>
      ) : null}
      <ul className="-mx-2 flex flex-col text-sm">
        {rows.map((game) => (
          <li key={game} className={`${STRETCHED_ROW} flex items-center justify-between gap-2 rounded-md px-2 py-1`}>
            <span className="flex min-w-0 items-center gap-2">
              <GameThumb variant={game} size="small" />
              <GameName variant={game} kanji stretched />
            </span>
            <CardArrow className="size-6" />
          </li>
        ))}
      </ul>
    </section>
  );
}
