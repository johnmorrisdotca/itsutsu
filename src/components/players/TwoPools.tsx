import { GameCount } from "@/components/games/GameCount";
import type { PlayerProfile } from "@/lib/rating/players";
import { RATING_POOLS } from "@/lib/rating/pools";

/**
 * The line under a player's figures that says their ratings are kept in two
 * pools, with each pool's rated-game count leading to those games.
 *
 * Its own component because it is its own job — explaining why one person has
 * two ratings — and because the player page reached the size gate when its
 * counts learned to carry a member's id. The page decides WHOSE games these are
 * (`wholeName`, and the member behind it); this words the two pools and links
 * each count to exactly the set it counted: rated games, in that pool, under
 * that name, asked for by id where there is one.
 *
 * It takes the profile rather than two bare numbers so that each count is read
 * where it is linked. Handed over as `peopleGames={player.ratedGames}`, the page
 * would print a count of games into an attribute with nothing behind it at that
 * spot — which `gameLinks.coverage.test.ts` rightly refused.
 */
export function TwoPools({
  name,
  memberId,
  profile,
}: {
  /** The name the record is counted under — the page's `wholeName`. */
  name: string;
  /** Their id, which is what the links carry. See `gamesHref`. */
  memberId?: string | null;
  /** The rating row both pools' counts come from. */
  profile: PlayerProfile;
}) {
  return (
    <p className="text-xs text-muted" data-testid="two-pools">
      Played and the record beside it count every finished game. The ratings are kept in two:{" "}
      <GameCount
        count={profile.ratedGames}
        player={name}
        memberId={memberId}
        pool={RATING_POOLS.people}
        rated="yes"
        className="font-medium text-ink-soft"
        title="Rated games against other people"
        testId="player-rated-people"
      />{" "}
      against people, and{" "}
      <GameCount
        count={profile.computer.ratedGames}
        player={name}
        memberId={memberId}
        pool={RATING_POOLS.computer}
        rated="yes"
        className="font-medium text-ink-soft"
        title="Rated games against the computer players"
        testId="player-rated-computer"
      />{" "}
      against the computer players. A game against a program never moves where you stand among the people, and a
      game against yourself counts as neither.
    </p>
  );
}
