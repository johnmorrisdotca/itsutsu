import Link from "@/components/ui/Link";
import { BoardScaled } from "@/components/board/BoardScaled";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { Paired } from "@/components/i18n/Paired";
import { phraseWith } from "@/components/i18n/phraseWith";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerName } from "@/components/players/PlayerName";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { markOfSeat } from "@/components/game/resultMarks";
import { BUTTON_BASE, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { currentReader } from "@/lib/auth/currentReader";
import { requestOrigin } from "@/lib/requestOrigin";
import { gamePath, seatPath, setUpPath } from "@/lib/gomoku/slugs";
import { levelName, puzzleCopy } from "@/lib/puzzles/puzzleCopy";
import { joinedWith } from "@/lib/puzzles/puzzleText";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import type { KumimojiLength } from "@/lib/puzzles/kumimoji/kumimoji.types";
import { RACE_SEATS, type RaceSeat, type SeatState } from "@/lib/puzzles/raceState";
import { raceFor, readRace, seatOf } from "@/lib/puzzles/server/puzzleRaces";
import { memberNamed } from "@/lib/auth/members";
import { fetchBuddies } from "@/lib/social/buddies";

import { PuzzlePlayClient } from "./PuzzlePlayClient";
import { RaceControls } from "./RaceControls";
import { RaceOffer } from "./RaceOffer";
import { clockText } from "@/lib/puzzles/clockText";
import type { Speaker } from "@/lib/i18n/i18n";
import { GameTrail } from "@/components/games/GameTrail";
import { PUZZLE_WIDTH_REASON } from "./paint.constants";

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
  const say = await currentSpeaker();
  const race = await raceFor(id);
  if (race === null || race.kind !== kind) notFound();
  const reader = await currentReader();
  const seat = seatOf(race, reader.memberId);
  const read = readRace(race);
  const copy = puzzleCopy(kind, say.locale);
  const level = race.level as PuzzleLevel;
  const dot = say.locale === "ja" ? "・" : " · ";
  const kumimojiParts =
    kind === "kumimoji"
      ? [
          say.say(race.language === "japanese" ? "pkumi.opts.japanese" : "pkumi.opts.english"),
          say.say(race.gameLength === "short" ? "pkumi.length.short" : race.gameLength === "medium" ? "pkumi.length.medium" : "pkumi.length.full"),
          say.count("puzzle.count.tile", race.givens.length),
          ...(race.doubleSet ? [say.say("pkumi.opts.double")] : []),
          ...(race.diagonals ? [say.say("pkumi.opts.diagOn")] : []),
        ]
      : [];
  const factsLine = [
    joinedWith(say, [sizeWordIn(race.size, kind, say), levelName(level, say.locale)]),
    ...kumimojiParts,
    ...(race.checksAllowed === null ? [] : [say.count("pset.race.checksEach", race.checksAllowed)]),
    `№ ${race.seed}`,
    say.say("pset.race.faster"),
  ].join(dot);
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

  // Offered by name (`offerRace`): who to, for the seat's words; the host's buddies to choose from; and, for the one it was offered to, the seat to take.
  const offeredTo = race.guestMemberId === null && race.offeredToMemberId !== null ? await memberNamed(race.offeredToMemberId) : null;
  const buddies = invite === null || reader.memberId === null ? [] : (await fetchBuddies(reader.memberId)).filter((buddy) => buddy.person).map((buddy) => ({ id: buddy.id, name: buddy.name }));
  const offeredHere = seat === null && offeredTo !== null && offeredTo.id === reader.memberId;

  return (
    // A board page whose play draws "Just the board" beside its size (`BoardScale`).
    <Page board="play">
      <SiteHeader />
      {/* Furniture, for just the board; the seats and their Start stay, being what starts the race. */}
      <div data-chrome>
      <PageTitle
        title={say.say("pset.race.title", { game: copy.label })}
        kanji="競解"
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind), testId: "race-up" }} steps={[{ label: say.say("pset.race.crumb") }]} />}
        lead={factsLine}
        testId="puzzle-race"
      />
      </div>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="race-seats">
        <h2 className={SECTION_TITLE}>
          <Paired en={say.say("pset.race.seats")} kanji="両席" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {RACE_SEATS.map((each) => (
            <li key={each} className="flex flex-col gap-0.5 rounded-lg border border-rule px-3 py-2 text-sm" data-testid={`race-seat-${each}`} data-state={read[each].state}>
              <span className="font-medium">
                {names[each].memberId === null && each === "guest" && offeredTo !== null ? (
                  <span className="text-muted" data-testid="race-offered-to">
                    {phraseWith(say.say("pset.race.offeredTo"), { name: <PlayerName name={offeredTo.name} memberId={offeredTo.id} fallback={say.say("pset.race.aBuddy")} tagged={false} /> })}
                  </span>
                ) : names[each].memberId === null ? (
                  <span className="text-muted">{say.say("pset.race.open")}</span>
                ) : (
                  <PlayerName name={names[each].name} memberId={names[each].memberId} fallback={say.say(each === "host" ? "pset.race.host" : "pset.race.guest")} />
                )}
                {seat === each ? <span className="ml-1 text-xs text-muted">{say.say("pset.race.you")}</span> : null}
              </span>
              <span className="text-muted">{seatWords(read[each], names[each].memberId === null, say)}</span>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-1.5 text-sm font-medium" data-testid="race-outcome">
          {/* A race won is a tick to a watcher; to a racer it is their win or their loss. */}
          <ResultMark kind={seat === null && read.outcome.over && read.outcome.winner !== null ? RESULT_MARKS.success : read.outcome.over ? markOfSeat(read.outcome.winner, seat ?? "", true) : RESULT_MARKS.other} />
          {outcomeWords(read.outcome, names, say)}
        </p>
        {offeredHere ? (
          /* A whole-page load, not a client navigation: the seat route claims and redirects back to this very address, which the router would otherwise answer from its cache, seatless. */
          <a href={seatPath(kind, id, race.guestToken)} className={`${BUTTON_BASE} ${BUTTON_STRONG} self-start px-5 py-2`} data-testid="race-take-seat">
            {say.say("pset.race.takeSeat")}
          </a>
        ) : null}
        <RaceControls
          id={id}
          seat={seat}
          canStart={mine !== null && mine.state === "waiting"}
          invite={invite}
          label={copy.label}
        />
        {invite !== null ? <RaceOffer id={id} buddies={buddies} offeredTo={offeredTo?.id ?? null} /> : null}
      </section>

      {seat !== null && mine !== null && mine.state === "solving" ? (
        <BoardScaled className="mx-auto w-full max-w-xl" widthReason={PUZZLE_WIDTH_REASON}>
          <PuzzlePlayClient
            kind={kind}
            size={race.size}
            level={level}
            seed={race.seed}
            language={race.language === "japanese" ? "japanese" : "english"}
            gameLength={race.gameLength as KumimojiLength}
            doubleSet={race.doubleSet}
            diagonals={race.diagonals}
            hasAccount={reader.hasAccount}
            race={{ id, since: mine.since.getTime(), givens: race.givens, checksAllowed: race.checksAllowed }}
          />
        </BoardScaled>
      ) : null}

      {seat === null && !reader.hasAccount ? (
        <p className="text-sm text-muted" data-testid="race-needs-account">
          {say.say("pset.race.needsAccount")}
        </p>
      ) : null}
      {seat === null && !offeredHere ? (
        <p className="text-sm text-muted" data-testid="race-not-yours">
          {phraseWith(say.say("pset.race.notYours"), {
            setup: (
              <Link href={setUpPath(kind)} className="underline underline-offset-2">
                {say.say("pset.race.setUp")}
              </Link>
            ),
          })}
        </p>
      ) : null}
    </Page>
  );
}

function seatWords(state: SeatState, empty: boolean, say: Speaker): string {
  if (empty) return say.say("pset.race.nobody");
  switch (state.state) {
    case "waiting":
      return say.say("pset.race.notStarted");
    case "solving":
      return say.say("pset.race.solvingSince", { time: state.since.toISOString().slice(11, 16) });
    case "finished":
      return say.say("pset.race.solvedIn", { time: clockText(state.elapsedMs) });
    case "gaveUp":
      return say.say(state.why === "outOfGuesses" ? "pset.race.outOfGuesses" : "pset.race.gaveUp");
  }
}

function outcomeWords(outcome: ReturnType<typeof readRace>["outcome"], names: Record<RaceSeat, { name: string; memberId: string | null }>, say: Speaker): string {
  if (!outcome.over) return say.say("pset.race.notOver");
  if (outcome.winner === null) return say.say("pset.race.tie");
  return say.say("pset.race.won", { name: names[outcome.winner].name || say.say(outcome.winner === "host" ? "pset.race.host" : "pset.race.guest") });
}
