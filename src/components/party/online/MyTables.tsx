import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { GroupHeading } from "@/components/mine/GroupHeading";
import { MY_PUZZLE_ROW } from "@/components/mine/mine.constants";
import { PlayerName } from "@/components/players/PlayerName";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { CardArrow } from "@/components/ui/CardArrow";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS, RAISED_LINK, STRETCHED_HOST } from "@/components/ui/ui.constants";
import { ONLINE_SEAT_KINDS } from "@/lib/party/online/online.constants";
import { tablePath } from "@/lib/party/online/onlinePaths";
import type { MyTable } from "@/lib/party/online/server/myTables";
import type { NameTag } from "@/lib/xp/nameTag.types";
import { onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import { onlineSeatName } from "./onlineSeatName";


/**
 * THE PARTY TABLES A MEMBER SITS AT ON SEVERAL DEVICES, on My games: under
 * Going the ones being played, those waiting on the reader first; under
 * Completed the newest twenty finished, each with how it went for the reader.
 * Read once by `myTables`, two indexed reads for both tabs; each row names the
 * game (its picture and its page), everybody at the table (each leading to
 * their page) and whose move it is, and opens the table.
 *
 * Its own panel rather than rows in the two-player columns: a table's turn
 * goes round several people, which "Your move" and "Their move" do not say.
 * An empty panel keeps its heading and says so.
 */
export function MyTables({ tables, finished, tags }: { tables: readonly MyTable[]; finished: boolean; tags: ReadonlyMap<string, NameTag> }) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const heading = finished ? ONLINE_COPY.myFinishedHeading : ONLINE_COPY.myHeading;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid={finished ? "tables-finished" : "tables-going"}>
      <GroupHeading label={heading} kanji={ONLINE_COPY.kanji} total={tables.length} waiting={!finished && tables.some((table) => table.yourMove)} testId={finished ? "tables-finished" : "tables-going"} />
      <p className="text-xs text-muted">{finished ? ONLINE_COPY.myFinishedHint : ONLINE_COPY.myHint}</p>
      {tables.length === 0 ? (
        <p className="text-sm text-muted" data-testid="tables-empty">
          {finished ? ONLINE_COPY.myNoneFinished : ONLINE_COPY.myNone}{" "}
          <Link href="/games/party" className="font-medium text-ink underline underline-offset-4">
            {ONLINE_COPY.myFind} →
          </Link>
        </p>
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {tables.map((table) => (
          <TableRow key={table.id} table={table} finished={finished} tags={tags} />
        ))}
      </ul>
    </section>
  );
}

/** One table on My games: under Going, how it stands; on Completed, among every other kind of finished game (`completed.ts`), how it went. */
export function TableRow({ table, finished, tags }: { table: MyTable; finished: boolean; tags: ReadonlyMap<string, NameTag> }) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const href = tablePath(table.game, table.id);
  const toPlay = table.toPlay === null ? undefined : table.seats[table.toPlay];
  return (
    <li
      className={`${STRETCHED_HOST} ${MY_PUZZLE_ROW}`}
      data-testid="my-table"
      data-table={table.id}
      data-game={table.game}
      data-your-move={table.yourMove ? "true" : undefined}
      data-result={table.result ?? undefined}
    >
      <Link href={href} data-card-link="" className="absolute inset-0 rounded-lg" aria-label={say.say("party.online.openTable")} />
      <GameThumb variant={table.game} size="small" />
      <span className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
        <span className="truncate font-medium">
          <GameName variant={table.game} raised />
        </span>
        <span className="flex flex-wrap gap-x-1 text-xs text-muted">
          {table.seats.map((seat, index) => (
            <span key={seat.seat} className={RAISED_LINK}>
              {seat.kind === ONLINE_SEAT_KINDS.member || (seat.kind === ONLINE_SEAT_KINDS.computer && seat.memberId !== null) ? (
                <PlayerName name={seat.name} memberId={seat.memberId} fallback={playerNumberName(say, seat.seat + 1)} tag={seat.memberId === null ? undefined : tags.get(seat.memberId)} testId="my-table-player" />
              ) : seat.kind === ONLINE_SEAT_KINDS.computer ? (
                ONLINE_COPY.computerSeat
              ) : (
                ONLINE_COPY.openSeat
              )}
              {index < table.seats.length - 1 ? "," : ""}
            </span>
          ))}
        </span>
        <span className="text-xs font-semibold" data-testid="my-table-state">
          {/* A shared win is still a win; a table nobody won is a bar. */}
          {table.result === null ? null : (
            <ResultMark
              kind={table.result === "won" || table.result === "shared" ? RESULT_MARKS.success : table.result === "lost" ? RESULT_MARKS.failure : RESULT_MARKS.other}
              className="mr-1"
            />
          )}
          {table.result !== null
            ? ONLINE_COPY.result[table.result]
            : table.retired
              ? ONLINE_COPY.myRetired
              : table.yourMove
              ? ONLINE_COPY.myYourMove
              : toPlay?.kind === ONLINE_SEAT_KINDS.open
                ? ONLINE_COPY.myOpen
                : ONLINE_COPY.myTheirMove(toPlay === undefined ? say.say("party.online.nextPlayer") : onlineSeatName(toPlay, say.say("party.online.nextPlayer"), ONLINE_COPY.computerSeat))}
        </span>
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} ${RAISED_LINK} shrink-0`} data-testid="my-table-open">
          {finished ? ONLINE_COPY.myLook : ONLINE_COPY.myOpenTable} →
        </Link>
        <CardArrow />
      </span>
    </li>
  );
}
