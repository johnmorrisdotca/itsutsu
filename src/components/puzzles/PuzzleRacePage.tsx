import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { currentReader } from "@/lib/auth/currentReader";
import { requestOrigin } from "@/lib/requestOrigin";
import { gamePath, seatPath, setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { RACE_SEATS, type RaceSeat, type SeatState } from "@/lib/puzzles/raceState";
import { raceFor, readRace, seatOf } from "@/lib/puzzles/server/puzzleRaces";

import { PuzzlePlayClient } from "./PuzzlePlayClient";
import { RaceControls } from "./RaceControls";
import { sizeWord } from "./puzzles.constants";
import { clockText } from "@/lib/puzzles/clockText";

/**
 * A race, at /games/<slug>/match/<id>: two seats, two clocks, one puzzle.
 *
 * Read once per request from the race's stamps (`readRace`), never polled:
 * the page reads again when the reader's browser comes back to it, presses
 * Refresh, or hands a finish in (`RaceControls`). The reader's own seat is
 * live — Start, then the solve, then their time — and the other seat is
 * words. The answer is never on this page; the guest's browser makes the
 * puzzle again from the seed, as the host's did.
 */
export async function PuzzleRacePage({ kind, id }: { kind: PuzzleKind; id: string }) {
  const race = await raceFor(id);
  if (race === null || race.kind !== kind) notFound();
  const reader = await currentReader();
  const seat = seatOf(race, reader.memberId);
  const read = readRace(race);
  const copy = PUZZLE_DISPLAY[kind];
  const level = race.level as PuzzleLevel;
  const names: Record<RaceSeat, { name: string; memberId: string | null }> = {
    host: { name: race.hostName, memberId: race.hostMemberId },
    guest: { name: race.guestName, memberId: race.guestMemberId },
  };
  const mine = seat === null ? null : read[seat];
  // The guest's seat, to send, while only the host has sat down: the address and its QR code, made here as a match page makes them.
  const invite =
    seat === "host" && race.guestMemberId === null
      ? await (async () => {
          const url = `${await requestOrigin()}${seatPath(kind, id, race.guestToken)}`;
          return { url, qr: await QRCode.toDataURL(url, { width: 320, margin: 1 }) };
        })()
      : null;

  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={`Race at ${copy.label}`}
        kanji="競解"
        crumb={
          <>
            <Link href={gamePath(kind)} className="underline-offset-2 hover:underline" data-testid="race-up">
              {copy.label}
            </Link>{" "}
            / Race
          </>
        }
        lead={`${sizeWord(race.size, kind)}, ${PUZZLE_LEVEL_DISPLAY[level].label.toLowerCase()}${race.checksAllowed === null ? "" : ` · ${race.checksAllowed === 1 ? "one check" : `${race.checksAllowed} checks`} each`} · № ${race.seed} · the faster correct solve wins.`}
        testId="puzzle-race"
      />

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="race-seats">
        <h2 className={SECTION_TITLE}>
          The two seats <span className="font-mincho normal-case tracking-normal">両席</span>
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {RACE_SEATS.map((each) => (
            <li key={each} className="flex flex-col gap-0.5 rounded-lg border border-rule px-3 py-2 text-sm" data-testid={`race-seat-${each}`} data-state={read[each].state}>
              <span className="font-medium">
                {names[each].memberId === null ? (
                  <span className="text-muted">The other seat, still open</span>
                ) : (
                  <PlayerName name={names[each].name} memberId={names[each].memberId} fallback={each === "host" ? "The host" : "The guest"} />
                )}
                {seat === each ? <span className="ml-1 text-xs text-muted">(you)</span> : null}
              </span>
              <span className="text-muted">{seatWords(read[each], names[each].memberId === null)}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium" data-testid="race-outcome">
          {outcomeWords(read.outcome, names)}
        </p>
        <RaceControls
          id={id}
          seat={seat}
          canStart={mine !== null && mine.state === "waiting"}
          invite={invite}
          label={copy.label}
        />
      </section>

      {seat !== null && mine !== null && mine.state === "solving" ? (
        <div className="mx-auto w-full max-w-xl" data-width-reason="a puzzle grid wider than a hand is a grid nobody can reach across">
          <PuzzlePlayClient
            kind={kind}
            size={race.size}
            level={level}
            seed={race.seed}
            hasAccount={reader.hasAccount}
            race={{ id, since: mine.since.getTime(), givens: race.givens, checksAllowed: race.checksAllowed }}
          />
        </div>
      ) : null}

      {seat === null ? (
        <p className="text-sm text-muted" data-testid="race-not-yours">
          This race is between the two people above. Start one of your own from{" "}
          <Link href={setUpPath(kind)} className="underline underline-offset-2">
            the set-up
          </Link>
          .
        </p>
      ) : null}
    </Page>
  );
}

function seatWords(state: SeatState, empty: boolean): string {
  if (empty) return "Nobody has taken it yet.";
  switch (state.state) {
    case "waiting":
      return "Not started.";
    case "solving":
      return `Solving since ${state.since.toISOString().slice(11, 16)} UTC.`;
    case "finished":
      return `Solved in ${clockText(state.elapsedMs)}.`;
    case "gaveUp":
      return "Gave up: the sitting ran out with no finish.";
  }
}

function outcomeWords(
  outcome: ReturnType<typeof readRace>["outcome"],
  names: Record<RaceSeat, { name: string; memberId: string | null }>,
): string {
  if (!outcome.over) return "Not over yet.";
  if (outcome.winner === null) return "Nobody won: a tie, or nobody finished.";
  return `${names[outcome.winner].name || (outcome.winner === "host" ? "The host" : "The guest")} won.`;
}
