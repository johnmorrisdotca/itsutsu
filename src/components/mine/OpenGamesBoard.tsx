import { Paired } from "@/components/i18n/Paired";
import Link from "@/components/ui/Link";

import { ComputerPoolMark } from "@/components/players/ComputerPoolMark";
import { CountryMark } from "@/components/players/CountryMark";
import { CELL, HEAD, ROW_CLASS, TABLE_CLASS, TABLE_HEAD_CLASS } from "@/components/players/PlayerRecord";
import { IpCell, XpCell, ipHeadTitle } from "@/components/players/recordTrailing";
import { BUTTON_BASE, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { LevelName } from "@/components/xp/LevelName";
import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { seatName } from "@/lib/gomoku/seatWords";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { weave } from "@/lib/i18n/weave";
import { rulesPath } from "@/lib/gomoku/slugs";
import { describeClock } from "@/lib/history/deadline";
import type { GameSummary } from "@/lib/history/gameHistory.types";
import { posterOf, type OpenSeatFilter } from "@/lib/history/openSeatsFilter";
import { posterKeyOf } from "@/lib/history/posterStanding";
import type { PosterStanding } from "@/lib/history/posterStanding.types";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { RATING_POOLS } from "@/lib/rating/pools";
import { myGamesCopy, openSeatsFilterCopy } from "./mine.copy";
import { OpenSeatsFilters } from "./OpenSeatsFilters";
import { PlayerName } from "@/components/players/PlayerName";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { byGameName, sitDownHref, waitingRoomSays } from "./waitingRoom";
import { boardWords } from "@/lib/gomoku/boardWords";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { MEMBER_KINDS } from "@/lib/auth/memberKind";

/** How many columns the table has, for the span of its one empty row. */
const COLUMNS = 8;

/**
 * THE WAITING ROOM: every seat somebody has posted, across every game, in one
 * table — John, pointing at ItsYourTurn's: "We don't have a specific waiting room
 * do we?" A waiting room is "let me choose my opponent", so every row is a real
 * person: the game and its rules, the time limit in words, the player with their
 * level, rating, XP and country, and a Sit down that states the seat's game
 * before anybody is sat at it. Sorted by game name, so one game's seats sit
 * together. See `waitingRoom.ts` for the three decisions and why.
 *
 * `games` is the page the board shows — narrowed by the filter and cut to
 * `OPEN_GAMES_SHOWN`, newest first. `shown` is how many seats matched the filter
 * before that cut, and `total` how many were on offer before the filter itself,
 * so the count beside the filters can say what narrowed the list rather than
 * only what fits on screen. A seat of the reader's own, or of somebody they
 * ignore, is never here (the page takes both out by member id).
 *
 * THE EMPTY ROOM KEEPS ITS HEADINGS. Nobody waiting is a fact about the site and
 * the table says it, with the way to post the first seat; a filter that leaves
 * nothing says that instead, with the way to take the filter off. The room is
 * only drawn for somebody signed in — a stranger's /games shows the catalogue —
 * so its invitation is the signed-in one.
 */
export async function OpenGamesBoard({
  games,
  shown,
  filter,
  total,
  standings,
}: {
  games: GameSummary[];
  /** Seats matching the filter, before the board's own display cap. */
  shown: number;
  filter: OpenSeatFilter;
  total: number;
  /** Each poster's rating, level, XP and country, by `posterKeyOf`. */
  standings: ReadonlyMap<string, PosterStanding>;
}) {
  const say = await currentSpeaker();
  const copy = myGamesCopy(say).openBoard;
  const OPEN_SEATS_FILTER_COPY = openSeatsFilterCopy(say);
  const says = waitingRoomSays({ total, shown });

  return (
    <section id="open-seats" className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="open-games">
      <h2 className={`flex items-baseline gap-2 ${SECTION_TITLE}`}>
        <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
        {games.length > 0 ? <span className="font-normal tracking-normal">{games.length}</span> : null}
      </h2>
      {total > 0 ? <OpenSeatsFilters filter={filter} shown={shown} total={total} /> : null}
      {says === "seats" ? <p className="text-xs text-muted">{copy.hint}</p> : null}

      <div className={TABLE_SCROLL}>
        <table className={TABLE_CLASS} data-testid="waiting-room">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className={HEAD} scope="col">
                {say.say("players.colGame")}
              </th>
              <th className={HEAD} scope="col">
                {say.say("mine.colTimeLimit")}
              </th>
              <th className={HEAD} scope="col">
                {say.say("players.colPlayer")}
              </th>
              <th className={HEAD} scope="col">
                {say.say("players.colRating")}
              </th>
              <th className={HEAD} scope="col">
                {say.say("players.colXp")}
              </th>
              <th className={HEAD} scope="col" title={ipHeadTitle(say)}>
                IP
              </th>
              <th className={HEAD} scope="col">
                {say.say("mine.colLocation")}
              </th>
              <th className={HEAD} scope="col">
                <span className="sr-only">{copy.sitDown}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {says !== "seats" ? (
              <tr className={ROW_CLASS}>
                <td className="py-3 pr-3 text-sm" colSpan={COLUMNS} data-testid="waiting-room-empty">
                  {says === "nobody-waiting" ? (
                    <>
                      {copy.nobodyWaiting}{" "}
                      {weave(copy.postFirstSentence, {
                        link: (
                          <Link href="/games/new" className="underline underline-offset-4" data-testid="waiting-room-post-first">
                            {copy.postFirst}
                          </Link>
                        ),
                      })}
                    </>
                  ) : (
                    <>
                      {OPEN_SEATS_FILTER_COPY.empty}
                      {say.sentences(["", ""])}
                      <Link href="/play#open-seats" className="underline underline-offset-4" data-testid="open-seats-clear">
                        {OPEN_SEATS_FILTER_COPY.clear}
                      </Link>
                      {say.sentence("")}
                    </>
                  )}
                </td>
              </tr>
            ) : (
              byGameName(games).map((game) => (
                <SeatRow key={game.id} game={game} standing={standings.get(posterKeyOf(posterOf(game))) ?? null} say={say} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** One person waiting, and the way to sit down with them. */
function SeatRow({ game, standing, say }: { game: GameSummary; standing: PosterStanding | null; say: Speaker }) {
  const copy = myGamesCopy(say).openBoard;
  const poster = posterOf(game);
  const rating = standing?.rating ?? null;
  return (
    <tr className={ROW_CLASS} data-testid="open-game" data-member={poster.memberId ?? undefined}>
      <td className="py-1.5 pr-3">
        {/*
          * The name and the time limit never wrap: on an iPhone WebKit gave this
          * cell less room than its words, "Gomoku" ran under "1 day a move" and
          * "Tic-tac-toe" took three lines. Kept whole, each column is as wide as
          * what it says and the table scrolls sideways inside its panel.
          */}
        <span className="flex w-max items-center gap-2 whitespace-nowrap">
          {/* Which game the seat is in, at a glance — the same board /play shows. */}
          <GameThumb variant={game.variant} size="small" />
          <span className="flex flex-col">
            <GameName variant={game.variant} raised />
            <Link href={rulesPath(game.variant)} className="text-xs text-muted underline underline-offset-4" data-testid="open-game-rules">
              {copy.rules}
            </Link>
          </span>
        </span>
      </td>
      <td className="py-1.5 pr-3 text-xs whitespace-nowrap" data-testid="open-game-clock">
        {describeClock(game.clockMode, game.moveTimeMs, say)}
        <span className="block text-muted">
          {boardWords(game.variant as RuleVariant, game.size, say)}
          {game.allowResign ? "" : ` · ${say.say("mine.noResigning")}`}
        </span>
      </td>
      <td className="py-1.5 pr-3">
        {/* By id, so the link carries no surname the line itself shortened away. */}
        <PlayerName
          name={poster.name}
          memberId={poster.memberId}
          fallback={game.openSeat === "black" ? seatName(say, "two") : seatName(say, "one")}
          // Flag beside the name as on every list; the level is drawn after it, below, as it always was here.
          tag={standing === null || poster.memberId === null ? undefined : { country: standing.country, kind: MEMBER_KINDS.member, level: null }}
        />
        {standing?.level != null ? (
          <LevelName level={standing.level} compact className="ml-2 text-muted" testId="open-game-level" />
        ) : null}
        <span className="block text-xs text-muted">
          {copy.youPlay(say.pairName(STONE_DISPLAY[game.openSeat === "black" ? "black" : "white"].label, STONE_DISPLAY[game.openSeat === "black" ? "black" : "white"].kanji).text)}
        </span>
      </td>
      <td className={CELL} data-testid="open-game-rating">
        {rating === null ? say.pairName(TIER_DISPLAY.unrated.label, TIER_DISPLAY.unrated.kanji).text : `${rating.rating} · ${say.pairName(TIER_DISPLAY[rating.tier].label, TIER_DISPLAY[rating.tier].kanji).text}`}
        {rating !== null && rating.pool === RATING_POOLS.computer ? (
          <ComputerPoolMark say={say} title={copy.computerPool} testId="rating-pool-computer" />
        ) : null}
      </td>
      <XpCell say={say} xp={standing?.xp ?? null} />
      <IpCell say={say} ip={standing?.ip == null || poster.memberId === null ? null : { ip: standing.ip, memberId: poster.memberId, game: null }} />
      <td className="py-1.5 pr-3 text-xs" data-testid="open-game-location">
        {standing?.country != null ? <CountryMark country={standing.country} showName /> : <span className="text-muted">—</span>}
      </td>
      <td className="py-1.5 text-right">
        {/* The doorstep for this seat: its game is stated before anybody sits down. */}
        <Link href={sitDownHref(game)} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-2 py-1 text-xs whitespace-nowrap`} data-testid="sit">
          {copy.sitDown}
        </Link>
      </td>
    </tr>
  );
}
