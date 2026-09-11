import { FamilyMark } from "@/components/games/FamilyMark";
import { GameName } from "@/components/games/GameName";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, SECTION_TITLE, STRETCHED_ROW } from "@/components/ui/ui.constants";
import { siblingsOf } from "@/lib/gomoku/families";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

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
export function GameFamily({ variant }: { variant: RuleVariant }) {
  const siblings = siblingsOf(variant);
  if (siblings === null || siblings.games.length === 0) return null;
  const { family } = siblings;

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="game-family">
      <h2 className={SECTION_TITLE}>
        Also in this family <span className="font-mincho normal-case tracking-normal">同族</span>
      </h2>
      <div className="flex items-center gap-3">
        <FamilyMark family={family.title} className="size-10 shrink-0 rounded-md" />
        <span className="flex min-w-0 flex-col">
          <span className="flex items-baseline gap-2 text-sm font-semibold">
            {family.title}
            <span className="font-mincho text-xs font-normal opacity-70">{family.kanji}</span>
          </span>
          <span className="text-xs text-muted">{family.blurb}</span>
        </span>
      </div>
      {/*
        Each row is the way into that game, not only the words of its name:
        the name is stretched over the row and the arrow says so, the same
        sign the catalogue's cards carry. Out to the panel's edge and back
        in, so the shaded row under the pointer is a row and not a word.
      */}
      <ul className="-mx-2 flex flex-col text-sm">
        {siblings.games.map((game) => (
          <li key={game} className={`${STRETCHED_ROW} flex items-center justify-between gap-2 rounded-md px-2 py-1`}>
            <GameName variant={game} kanji stretched />
            <CardArrow className="size-6" />
          </li>
        ))}
      </ul>
    </section>
  );
}
