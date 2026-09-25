import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { MyGame } from "@/lib/history/myGames";
import type { NameTag } from "@/lib/xp/nameTagsOf";
import { GroupHeading } from "./GroupHeading";
import { MY_GAMES_COPY } from "./mine.constants";
import { Row } from "./MyGameRow";

/**
 * THE STARRED GAMES, FIRST ON THE COMPLETED TAB. John, 2026-09-25: "ability to
 * favourite your game, it moves to the top". The rows are the finished list's
 * own (`Row`), each with its star lit, newest star first (`favouriteGamesOf`).
 * Drawn empty too, saying how a game gets here: an empty table is data.
 */
export function FavouritesPanel({
  rows,
  total,
  now,
  tags,
  earned,
}: {
  rows: readonly MyGame[];
  /** How many are starred, which is more than the rows only past the panel's cap. */
  total: number;
  now: Date;
  tags: ReadonlyMap<string, NameTag>;
  earned: ReadonlyMap<string, number>;
}) {
  const copy = MY_GAMES_COPY.favourites;
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="my-games-favourites">
      <GroupHeading
        label={copy.label}
        kanji={copy.kanji}
        total={total}
        showing={total > rows.length ? rows.length : null}
        testId="my-games-favourites"
      />
      <p className="text-xs text-muted">{copy.hint}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted" data-testid="my-games-favourites-empty">
          {copy.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((item) => (
            <Row key={item.game.id} item={item} now={now} tags={tags} earned={earned.get(item.game.id)} starred />
          ))}
        </ul>
      )}
    </div>
  );
}
