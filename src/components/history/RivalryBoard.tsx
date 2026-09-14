"use client";

import { GameCount } from "@/components/games/GameCount";
import { GameName } from "@/components/games/GameName";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PlayerName } from "@/components/players/PlayerName";
import { LocalTime } from "@/components/ui/LocalTime";
import { LevelName } from "@/components/xp/LevelName";
import { NO_STREAK_TEXT } from "@/lib/rating/streak";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { lineWords, streakWords } from "./rivalryWords";
import type { RivalryBoardProps, RivalryCornerProps, RivalryStatProps } from "./rivalry.types";

/**
 * THE VERSUS SCREEN.
 *
 * John: "a big score to show this too. Above the List History of games. make
 * the site look more gaming oriented." So this is a scoreboard and not a table
 * row: two corners in the two colours the site already owns — moss for the
 * reader's side, shu for the other — meeting on a slant, a VS badge between two
 * numbers big enough to read across a room, and under them the one line worth
 * saying. It uses the site's tokens and nothing else, so it is right in both
 * themes, and its only motion is under `motion-safe:` and runs once.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * EVERY NUMBER OPENS EXACTLY ITS GAMES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Through `GameCount` and the record's pair filter, `?member=A&against=B`,
 * which reads the seats by id exactly as the score was counted:
 *
 *  - a player's wins → their games against the other, `outcome=won`, from
 *    THEIR side, so the chips on the page it opens name the winner;
 *  - draws → `outcome=drawn`; games → `outcome=decided`, because the record
 *    also lists abandoned games and the score never counted one;
 *  - and the game in the path when the score is one game's.
 *
 * Nought links nowhere, the way every count on the site does.
 *
 * `readyMark` because a browser test reads the line and the dates, and the
 * date is rewritten into the reader's zone once the browser takes over.
 */
export function RivalryBoard({ one, other, readerIsOne, all, game, line, testId = "rivalry" }: RivalryBoardProps) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const who = { one, other, readerIsOne };
  const variant = game?.variant;
  /* The big score is this game's when the page is about a game, and every game's otherwise. */
  const scope = game?.tally ?? all;
  const leader = scope.wins === scope.losses ? null : scope.wins > scope.losses ? "one" : "other";
  const streak = streakWords(say, who, scope);
  /* Every game beside this game's only where it is a longer list; the same set twice says nothing. */
  const showAll = game !== null && all.total > game.tally.total;
  const unnamed = say.say("rivalry.unnamed");
  const pair = { memberId: one.memberId, against: other.memberId };
  const mirrored = { memberId: other.memberId, against: one.memberId };
  /*
   * The site's sans, not its mono: the mono face slashes its zero, and a
   * slashed nought at this size reads as "Ø" — the one score every new pair
   * starts on. Tabular figures keep "10" and "11" the same width.
   */
  const bigNumber =
    "text-6xl font-black leading-none tabular-nums sm:text-7xl motion-safe:animate-[rivalry-rise_450ms_ease-out_both]";
  const smallLabel = "text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted";

  return (
    <section
      className="relative isolate overflow-hidden rounded-2xl border border-rule-strong bg-ivory shadow-sm"
      data-testid={testId}
      data-line={line.kind}
      {...readyMark(hydrated)}
    >
      {/*
        The two corners, meeting on a slant behind the score. Decoration only,
        drawn from the palette's own soft tints so a dark theme gets its own.
      */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,var(--moss-soft)_0%,var(--moss-soft)_46%,var(--ivory)_46%,var(--ivory)_54%,var(--shu-soft)_54%,var(--shu-soft)_100%)]"
      />
      <div className="flex flex-col gap-5 px-4 py-5 sm:px-8 sm:py-6">
        <h2 className={`${smallLabel} flex flex-wrap items-center justify-center gap-x-2 text-center`}>
          <span>{say.say("rivalry.title")}</span>
          {variant !== undefined ? (
            <>
              <span aria-hidden>·</span>
              <GameName variant={variant} />
            </>
          ) : null}
        </h2>

        <div className="grid grid-cols-2 items-start gap-x-3 gap-y-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <Corner seat={one} side="one" fallback={unnamed} testId={`${testId}-one`} />

          <div className="order-3 col-span-2 flex items-start justify-center gap-4 sm:order-2 sm:col-span-1 sm:gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <GameCount
                count={scope.wins}
                variant={variant}
                {...pair}
                outcome="won"
                className={`${bigNumber} text-moss ${leader === "other" ? "opacity-60" : ""}`}
                testId={`${testId}-one-wins`}
              />
              <span className={smallLabel}>{say.say("rivalry.wins")}</span>
            </div>
            <span
              className="mt-3 -rotate-6 rounded-md bg-ink px-2.5 py-1 font-mono text-sm font-black uppercase tracking-[0.2em] text-paper shadow-md sm:mt-5 motion-safe:animate-[rivalry-land_500ms_cubic-bezier(0.2,1.3,0.4,1)_both]"
              aria-hidden
            >
              {say.say("rivalry.versus")}
            </span>
            <div className="flex flex-col items-center gap-1.5">
              <GameCount
                count={scope.losses}
                variant={variant}
                {...mirrored}
                outcome="won"
                className={`${bigNumber} text-shu ${leader === "one" ? "opacity-60" : ""}`}
                testId={`${testId}-other-wins`}
              />
              <span className={smallLabel}>{say.say("rivalry.wins")}</span>
            </div>
          </div>

          <Corner seat={other} side="other" fallback={unnamed} testId={`${testId}-other`} />
        </div>

        <p
          className="text-balance text-center text-xl font-bold leading-snug sm:text-2xl"
          data-testid={`${testId}-line`}
        >
          {lineWords(say, who, line)}
        </p>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule pt-4 text-sm sm:flex sm:flex-wrap sm:justify-center sm:gap-x-10">
          <Stat label={say.say("rivalry.games")}>
            <GameCount count={scope.total} variant={variant} {...pair} outcome="decided" testId={`${testId}-games`} />
          </Stat>
          <Stat label={say.say("rivalry.draws")}>
            <GameCount count={scope.draws} variant={variant} {...pair} outcome="drawn" testId={`${testId}-draws`} />
          </Stat>
          <Stat label={say.say("rivalry.streak")}>
            <span data-testid={`${testId}-streak`}>{streak ?? NO_STREAK_TEXT}</span>
          </Stat>
          {/*
            The same game as the figures beside it. Every game's date here read
            as a date for this game — "Last played Sep 11" beside a tic-tac-toe
            score of 0–0 — and the all-time row below already speaks for every
            game. The LINE's gap still reads every game, because a sentence
            about not having played somebody is about them, not about a game.
          */}
          <Stat label={say.say("rivalry.lastPlayed")}>
            <span data-testid={`${testId}-last`}>
              {scope.lastPlayedAt === null ? say.say("rivalry.notYet") : <LocalTime at={scope.lastPlayedAt} style="date" />}
            </span>
          </Stat>
          {showAll ? (
            <Stat label={say.say("rivalry.allGames")}>
              <span className="tabular-nums" data-testid={`${testId}-all`}>
                <GameCount count={all.wins} {...pair} outcome="won" testId={`${testId}-all-one-wins`} />
                {" – "}
                <GameCount count={all.losses} {...mirrored} outcome="won" testId={`${testId}-all-other-wins`} />
                <span className="text-muted">
                  {" · "}
                  {say.say("rivalry.draws")}{" "}
                </span>
                <GameCount count={all.draws} {...pair} outcome="drawn" testId={`${testId}-all-draws`} />
              </span>
            </Stat>
          ) : null}
        </dl>
      </div>
    </section>
  );
}

/** A corner: the colour bar, the name that leads to them, and their level where they have one. */
function Corner({ seat, side, fallback, testId }: RivalryCornerProps) {
  const end = side === "other";
  return (
    <div
      className={`flex min-w-0 flex-col gap-1.5 ${end ? "order-2 items-end text-right sm:order-3" : "order-1 items-start text-left"}`}
    >
      <span aria-hidden className={`h-1.5 w-12 rounded-full ${end ? "bg-shu" : "bg-moss"}`} />
      <span className="max-w-full wrap-break-word text-lg font-bold leading-tight sm:text-2xl">
        <PlayerName name={seat.name} memberId={seat.memberId} fallback={fallback} testId={`${testId}-name`} />
      </span>
      {seat.level !== null ? <LevelName level={seat.level} testId={`${testId}-level`} /> : null}
    </div>
  );
}

function Stat({ label, children }: RivalryStatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}
