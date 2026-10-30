"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import { countries, countryByName, fold } from "@johnmorrisdotca/kuni";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { KUNIATE_GUESSES } from "@/lib/puzzles/kuniate/pool.constants";

import { placeName } from "./KuniateClue";

/** How many names the list shows: enough to choose from without pushing the page about. */
const MOST_SHOWN = 5;

/**
 * THE GUESS: a box to type a name in and a list of the places that match, in the reader's
 * language with the English also found, and a few other spellings through Kuni's lookup ("Holland"
 * finds the Netherlands). A guess is always a place on the list, so nothing typed can be
 * refused for spelling: Enter takes the first, a press takes any. The list opens over the foot of
 * the clue, so nothing on the page moves as it is typed.
 */
export function KuniateGuess({ guessed, disabled, onGuess }: { guessed: readonly string[]; disabled: boolean; onGuess: (code: string) => void }) {
  const say = useSpeaker();
  const [typed, setTyped] = useState("");
  const names = useMemo(
    () =>
      countries()
        .filter((place) => KUNIATE_GUESSES.has(place.alpha2))
        .map((place) => ({ code: place.alpha2, shown: placeName(place.alpha2, say.locale), read: `${fold(place.name.en)} ${place.name.ja} ${fold(placeName(place.alpha2, "en"))}` })),
    [say.locale],
  );
  const query = fold(typed.trim());
  const matches = useMemo(() => {
    if (query === "") return [];
    const open = names.filter((name) => !guessed.includes(name.code));
    const starts = open.filter((name) => fold(name.shown).startsWith(query) || name.read.split(" ").some((word) => word.startsWith(query)));
    const within = open.filter((name) => name.read.includes(query) && !starts.includes(name));
    const alias = countryByName(typed.trim())?.alpha2;
    const byAlias = alias === undefined ? [] : open.filter((name) => name.code === alias && !starts.includes(name) && !within.includes(name));
    return [...byAlias, ...starts, ...within].slice(0, MOST_SHOWN);
  }, [names, guessed, query, typed]);

  const take = (code: string) => {
    setTyped("");
    onGuess(code);
  };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && matches[0] !== undefined) {
      event.preventDefault();
      take(matches[0].code);
    }
  };

  return (
    <div className="relative" data-testid="kuniate-guess">
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={typed}
        disabled={disabled}
        placeholder={say.say("pword.kuniate.placeholder")}
        aria-label={say.say("pword.kuniate.placeholder")}
        onChange={(event) => setTyped(event.target.value)}
        onKeyDown={onKey}
        className={`${TAP_HEIGHT} w-full rounded-md border border-rule-strong bg-transparent px-3 text-base`}
        data-testid="kuniate-input"
      />
      {/* Two short rows of names at the most, over the foot of the clue, so the clue is still there to look at and a phone's keyboard cannot hide them. */}
      {matches.length > 0 ? (
        <ul className="absolute right-0 bottom-full left-0 z-20 mb-1 flex max-h-24 flex-wrap gap-1 overflow-hidden rounded-md border border-rule-strong bg-ivory p-1 shadow-lg" data-testid="kuniate-matches">
          {matches.map((match) => (
            <li key={match.code}>
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => take(match.code)} data-testid="kuniate-match" data-code={match.code}>
                {match.shown}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
