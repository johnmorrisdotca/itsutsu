"use client";

import { botsFor } from "@/lib/bots/bots.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { BOT_PROFILES } from "@/lib/gomoku/opponent.constants";
import { shownName } from "@/lib/rating/shownName";
import type { Opponent } from "@/lib/social/opponents";
import { Field, Select } from "@/components/ui/Controls";
import type { SetUpOpponent } from "./setUp.types";
import { POST_FOR_ANYONE } from "./setUpWords";

/**
 * What the opponent choice means.
 *
 * BOTH FORMS NAME A MEMBER BY ID, which is a change: people used to be named
 * by their address here, because the creation route took a challenge as an
 * email and only a computer player needed an id. A computer player has no
 * address because it never signs in, so the id was always the form that works
 * for everybody — and it has the better property besides, since a member's
 * address was being written into the page's markup for every buddy on the list
 * whether or not anybody was going to play them.
 *
 * `c:` is kept apart from `m:` because the two are offered differently — a
 * program is offered only at a game it plays — and because which of the two you
 * are looking at is a thing a reader and a test both want to be able to see.
 */
export const ANYONE = "anyone";
const MEMBER = "m:";
const COMPUTER = "c:";

/** The select's value for somebody the address has already named. */
export function valueFor(opponent: SetUpOpponent): string {
  return `${opponent.computer ? COMPUTER : MEMBER}${opponent.id}`;
}

/** The member id a chosen value names, or null for a posted seat. */
export function idIn(value: string): string | null {
  if (value.startsWith(MEMBER)) return value.slice(MEMBER.length);
  if (value.startsWith(COMPUTER)) return value.slice(COMPUTER.length);
  return null;
}

/**
 * WHO THE GAME IS AGAINST.
 *
 * Its own component because the chooser has two jobs now rather than one. It is
 * still the list of everybody a game can be offered to — but every way of
 * starting a game that begins with a PERSON now arrives here with that person
 * already decided, and the screen has to show that without locking it.
 *
 * SO A NAMED OPPONENT IS AN OPTION LIKE ANY OTHER, selected, and added to the
 * list when they are not otherwise on it — a player met in the directory is
 * nobody's buddy and may not be here now, and a chooser that silently dropped
 * them would answer "Play" with a posted seat for anyone.
 *
 * It is a select rather than a fixed line of text on purpose. John's reason for
 * wanting this screen in front of every way in was that it is the place where
 * things can still be changed; a heading that says who this is against and a
 * control that will not let you change your mind is half a screen.
 */
export function OpponentChoice({
  value,
  onChange,
  variant,
  opponents,
  named,
  disabled = false,
  signedIn,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Which game, because a specialist program is offered at its own and nowhere else. */
  variant: string;
  opponents: Opponent[];
  /** Somebody the address named, so they are offered even when the list would not have them. */
  named: SetUpOpponent | null;
  disabled?: boolean;
  signedIn: boolean;
}) {
  const computers = botsFor(variant as RuleVariant);
  const here = opponents.filter((one) => one.here);
  const away = opponents.filter((one) => !one.here);
  /*
   * Only where the list does not already hold them. A buddy asked for from
   * their own page is in both, and the same person twice in one select is a
   * chooser that cannot say which of the two is chosen.
   */
  const extra =
    named === null ||
    (named.computer
      ? computers.some((bot) => bot.id === named.id)
      : opponents.some((one) => one.id === named.id))
      ? null
      : named;

  return (
    <Field label="Opponent">
      <Select
        value={value}
        disabled={disabled || !signedIn}
        onChange={(event) => onChange(event.target.value)}
        data-testid="set-up-with"
      >
        {/*
         * THE WORDS FROM `setUpWords.ts`, WHICH IS WHERE THEY ARE DECIDED. The
         * folded summary line stands in for this select while the drawer is
         * shut, so the two say the same thing a press apart — and this had the
         * sentence written out again, which made the constant's own promise
         * ("said once because it is said twice") false the day it was written.
         * The copy that drifts is always the summary, and the summary is the one
         * that has to be true.
         */}
        <option value={ANYONE}>{POST_FOR_ANYONE}</option>
        {extra !== null ? (
          <optgroup label="Asked for 指名">
            <option value={valueFor(extra)}>{shownName(extra.name)}</option>
          </optgroup>
        ) : null}
        {here.length > 0 ? (
          <optgroup label="Here now 在室">
            {here.map((one) => (
              <option key={one.id} value={`${MEMBER}${one.id}`}>
                {shownName(one.name)}
              </option>
            ))}
          </optgroup>
        ) : null}
        {away.length > 0 ? (
          <optgroup label="Players you know 知人">
            {away.map((one) => (
              <option key={one.id} value={`${MEMBER}${one.id}`}>
                {shownName(one.name)}
              </option>
            ))}
          </optgroup>
        ) : null}
        <optgroup label="The computer 対コンピュータ">
          {/* A specialist is offered at its own game and nowhere else. */}
          {computers.map((bot) => (
            <option key={bot.id} value={`${COMPUTER}${bot.id}`}>
              {[bot.name, BOT_PROFILES[bot.tier].native].filter(Boolean).join(" ")} ·{" "}
              {BOT_PROFILES[bot.tier].strength}
            </option>
          ))}
        </optgroup>
      </Select>
    </Field>
  );
}
