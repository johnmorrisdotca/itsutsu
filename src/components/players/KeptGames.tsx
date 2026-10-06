import Link from "@/components/ui/Link";
import { ResultMark } from "@/components/game/ResultMark";
import { markOfOutcome } from "@/components/game/resultMarks";

import { GameReplay } from "@/components/history/GameReplay";
import { appearanceFrom } from "@/components/board/appearance";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import type { Appearance } from "@/components/board/board.types";
import { currentMemberId } from "@/lib/auth/currentSession";
import { appearanceFor } from "@/lib/auth/members";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { keptGameDetail, keptGameName, keptGamesFor } from "@/lib/legacy/legacyGames.data";
import type { LegacyGame } from "@/lib/legacy/legacyPlayers.types";
import { boardWords } from "@/lib/gomoku/boardWords";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { weave } from "@/lib/i18n/weave";

/**
 * The games kept in full — a board a reader can step through, not just a
 * result.
 *
 * A kept game belongs to the site it was played on, so it sits inside that
 * site's chapter rather than in a heap at the bottom of the page. Games from
 * the site being read are the only ones shown.
 */
export async function KeptGames({ slug, site }: { slug: string; site?: string }) {
  const games = keptGamesFor(slug).filter((game) => site === undefined || game.source === site);
  if (games.length === 0) return null;
  /*
   * The reader's own board, read here rather than handed down. These sit four
   * components below the page, and a board somebody chose is not worth
   * threading a prop through four files that have nothing else to do with how
   * a board looks. Of all the boards on this site these are the ones most
   * likely to be sat with: they are the games that were kept.
   */
  const say = await currentSpeaker();
  const appearance = appearanceFrom(await appearanceFor(await currentMemberId()));
  return (
    <section className="flex flex-col gap-4" data-testid="kept-games">
      <h3 className={SECTION_TITLE}>{say.say("players.keptTitle")}</h3>
      {games.map((game) => (
        <KeptGame key={game.id} game={game} viewedAs={slug} appearance={appearance} say={say} />
      ))}
    </section>
  );
}

function KeptGame({
  game,
  viewedAs,
  appearance,
  say,
}: {
  say: Speaker;
  game: LegacyGame;
  viewedAs: string;
  appearance: Appearance;
}) {
  const isBlack = game.black === viewedAs;
  const opponentSlug = isBlack ? game.white : game.black;
  const opponentName = keptGameName(opponentSlug);
  const colour = isBlack ? "black" : "white";
  const result = game.winner === null ? "drew" : game.winner === colour ? "won" : "lost";
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`}>
      {/*
        The board beside the sentence, at the small size a row's picture takes,
        rather than inside its first line, where it would make that one line
        taller than the rest of the sentence.
      */}
      <p className="flex items-center gap-3 text-sm text-muted">
        <GameThumb variant={game.variant} size="small" />
        <span>
          {weave(say.say("players.keptLine"), {
            date: game.playedAt,
            game: <GameName variant={game.variant} />,
            board: boardWords(game.variant, game.size, say),
            opponent: (
              <Link href={`/players/${opponentSlug}`} className="font-medium text-ink-soft underline-offset-2 hover:underline">
                {opponentName}
              </Link>
            ),
            colour: <span className="font-medium text-ink-soft">{say.say(colour === "black" ? "players.colourBlack" : "players.colourWhite")}</span>,
            result: (
              <span className="inline-flex items-center gap-1 font-medium text-ink-soft" data-testid="kept-game-result">
                <ResultMark kind={markOfOutcome(result === "drew" ? "draw" : result)} />
                {say.say(result === "won" ? "players.outcomeWon" : result === "lost" ? "players.outcomeLost" : "players.outcomeDrawn")}
              </span>
            ),
            source: game.source,
          })}
        </span>
      </p>
      <GameReplay
        game={keptGameDetail(game)}
        appearance={appearance}
        // Not ours: a kept record is credited to the site it was played on.
        story={{
          kind: say.say("gamepages.gameReview"),
          kanji: say.pairsWithKanji ? "棋譜" : "",
          title: say.say("players.keptStoryTitle", { date: game.playedAt, opponent: opponentName }),
          source: say.say("players.keptStorySource", { site: game.source }),
        }}
      />
    </div>
  );
}
