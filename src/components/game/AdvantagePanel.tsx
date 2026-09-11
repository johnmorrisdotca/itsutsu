"use client";

import { Paired } from "@/components/i18n/Paired";
import {
  LEAD_DISPLAY,
  MEASURE_DISPLAY,
  OUTLOOK_SIDE_DISPLAY,
  THREATS_NOTE,
  UNREADABLE_DISPLAY,
} from "@/lib/gomoku/advantage.constants";
import { STONE_DISPLAY, STONES } from "@/lib/gomoku/gomoku.constants";
import { SectionTitle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { Advantage } from "@/lib/gomoku/advantage.types";
import type { GameSession } from "./game.types";
import type { Stone } from "@/lib/gomoku/gomoku.types";

/**
 * Who is ahead, while the game is on.
 *
 * Three shapes, because the site plays three kinds of game and only one of
 * them can be read by threats. The panel never invents a figure to fill the
 * space: a game that cannot be weighed says so, in a sentence about that game.
 */
export function AdvantagePanel({ session }: { session: GameSession }) {
  const { advantage } = session;

  return (
    <section className="flex flex-col gap-2" data-testid="advantage" data-kind={advantage.kind}>
      <SectionTitle kanji={GAME_COPY.advantage.kanji}>{GAME_COPY.advantage.label}</SectionTitle>
      {advantage.kind === "unreadable" ? (
        <Unreadable advantage={advantage} />
      ) : advantage.kind === "count" ? (
        <Count advantage={advantage} />
      ) : (
        <Threats advantage={advantage} />
      )}
    </section>
  );
}

/** The name of a colour, as this game's seat labels have it. */
function SideName({ stone }: { stone: Stone }) {
  return (
    <span>
      <Paired en={STONE_DISPLAY[stone].label} kanji={STONE_DISPLAY[stone].kanji} kanjiClassName="text-muted" />
    </span>
  );
}

/** A row per colour, marked where the reading favours one of them. */
function Sides({
  lead,
  black,
  white,
}: {
  lead: Stone | null;
  black: React.ReactNode;
  white: React.ReactNode;
}) {
  return (
    <dl className="flex flex-col gap-1">
      {([STONES.black, STONES.white] as const).map((stone) => (
        <div
          key={stone}
          data-testid={`advantage-${stone}`}
          data-lead={lead === stone ? "true" : undefined}
          className={`flex items-baseline justify-between gap-3 rounded-lg px-2 py-1 text-sm ${
            lead === stone ? "bg-ochre-soft font-semibold text-ink" : "text-muted"
          }`}
        >
          <dt>
            <SideName stone={stone} />
          </dt>
          <dd className="text-right">{stone === STONES.black ? black : white}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The line games. Words, never a percentage — and the two sides side by side,
 * which is the question the panel is answering and the one the banner over the
 * board, which speaks only to the player to move, does not.
 */
function Threats({ advantage }: { advantage: Extract<Advantage, { kind: "threats" }> }) {
  const { outlook, lead, decided } = advantage;
  const heading = decided
    ? LEAD_DISPLAY.decided
    : lead === null
      ? LEAD_DISPLAY.level
      : null;

  return (
    <>
      {heading !== null ? (
        <p className="text-sm font-semibold text-ink">
          <Paired en={heading.label} kanji={heading.kanji} kanjiClassName="text-muted" />
        </p>
      ) : null}
      <Sides
        lead={lead}
        black={
          <>
            <Paired en={OUTLOOK_SIDE_DISPLAY[outlook[STONES.black]].label} kanji={OUTLOOK_SIDE_DISPLAY[outlook[STONES.black]].kanji} kanjiClassName="" />
          </>
        }
        white={
          <>
            <Paired en={OUTLOOK_SIDE_DISPLAY[outlook[STONES.white]].label} kanji={OUTLOOK_SIDE_DISPLAY[outlook[STONES.white]].kanji} kanjiClassName="" />
          </>
        }
      />
      <p className="text-[0.7rem] leading-snug text-muted">{THREATS_NOTE}</p>
    </>
  );
}

/**
 * The games that can be counted. A number each, and a note saying what the
 * number is and — as much to the point — what it is not.
 */
function Count({ advantage }: { advantage: Extract<Advantage, { kind: "count" }> }) {
  const copy = MEASURE_DISPLAY[advantage.measure];

  return (
    <>
      <p className="text-sm font-semibold text-ink">
        <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-muted" />
      </p>
      <Sides
        lead={advantage.lead}
        black={<span className="tabular-nums">{advantage.black}</span>}
        white={<span className="tabular-nums">{advantage.white}</span>}
      />
      <p className="text-[0.7rem] leading-snug text-muted">
        {advantage.fewer ? copy.fewerNote : copy.note}
      </p>
    </>
  );
}

/**
 * The games that cannot be read. This is the row that used to be an even bar,
 * which looked like information and was a claim — that the sides were level,
 * made without looking at the board.
 */
function Unreadable({ advantage }: { advantage: Extract<Advantage, { kind: "unreadable" }> }) {
  const copy = UNREADABLE_DISPLAY[advantage.reason];

  return (
    <div className="flex items-start gap-3 rounded-xl border border-rule px-3 py-2.5">
      <span aria-hidden="true" className="mt-0.5 font-mincho text-xl leading-none text-muted">
        {copy.kanji}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-ink">{copy.label}</span>
        <span className="text-xs leading-snug text-muted">{copy.sentence}</span>
      </span>
    </div>
  );
}
