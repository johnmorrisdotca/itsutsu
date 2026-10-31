"use client";

import { useState, type ReactNode } from "react";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { CARD_GAME_RULES } from "@/lib/cardGames/cardGameRules";
import { CARD_GAME_SPECS } from "@/lib/cardGames/cardGames.constants";
import { PARTY_NAME_MOST, computerNumberName } from "@/lib/party/partyNames";
import { playerNumberName } from "@/lib/gomoku/seatWords";

import { MarbleChip } from "../MarbleChip";
import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "../online/OnlineSetUpParts";
import type { SeatChoice } from "../online/online.types";
import { CARD_ADAPTERS } from "./cardAdapters";
import { PREVIEW_SEED } from "./cardTable.constants";
import type { CardSetUpProps } from "./cardTable.types";
import { CardTableSurface } from "./CardTableParts";
import { freshCardSeed } from "./cardTableStores";
import { cardTableWords, onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";

/** What each game's length is called on its tiles. */
const LENGTH_WORDS: Record<CardSetUpProps["kind"], (size: number, say: Speaker) => string> = {
  hearts: (size, say) => say.say("ctable.length.to", { size: String(size) }),
  bigTwo: (size, say) => say.count("ctable.length.deals", size),
  president: (size, say) => say.say("ctable.length.rounds", { count: String(size) }),
  goFish: (_size, say) => say.say("ctable.length.oneDeal"),
  crazyEights: (size, say) => say.say("ctable.length.to", { size: String(size) }),
  spades: (size, say) => say.say("ctable.length.to", { size: String(size) }),
  ginRummy: (size, say) => say.say("ctable.length.to", { size: String(size) }),
  euchre: (size, say) => say.say("ctable.length.to", { size: String(size) }),
  cribbage: (size, say) => say.say(size === 61 ? "ctable.length.cribShort" : "ctable.length.cribLong"),
  ohHell: (size, say) => say.say(size === 7 ? "ctable.length.ohHellShort" : "ctable.length.ohHellLong"),
  war: (size, say) => say.say("ctable.length.turns", { count: String(size) }),
};

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={SECTION_TITLE}>{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * THE TABLE, BEFORE THE FIRST CARD: how many are playing, how long, and who
 * sits where — a person, named if they like, or a computer. The first seat is
 * whoever holds the device, and the rest open as computers, so one person can
 * start a game at once. Beside it the live table dealt for that many, with
 * nothing to press: every set-up preview on this site is the board itself.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): every tile
 * is one size, and all the seats a game could need are always laid out, those
 * nobody sits in kept in place and hidden.
 */
export function CardSetUp({ kind, appearance, onStart, ready, online }: CardSetUpProps) {
  const say = useSpeaker();
  const CARD_TABLE_COPY = cardTableWords(say.locale);
  const spec = CARD_GAME_SPECS[kind];
  const counts = Array.from({ length: spec.mostPlayers - spec.fewestPlayers + 1 }, (_, at) => spec.fewestPlayers + at);
  const [count, setCount] = useState(spec.defaultPlayers);
  const [size, setSize] = useState(spec.defaultSize);
  const [names, setNames] = useState<string[]>(() => new Array<string>(spec.mostPlayers).fill(""));
  const [computers, setComputers] = useState<boolean[]>(() => Array.from({ length: spec.mostPlayers }, (_, seat) => seat > 0));
  const ONLINE_COPY = onlineWords(say.locale);
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, spec.mostPlayers));
  const table = useStartTable(online);
  const severalOffer = several ? online : undefined;
  const seated = computers.slice(0, count);
  const nobody = severalOffer === undefined && seated.every(Boolean);
  const adapter = CARD_ADAPTERS[kind];
  const preview = CARD_GAME_RULES[kind].start(size, names.slice(0, count), undefined, PREVIEW_SEED, seated.map(() => true));
  const previewNames = names.slice(0, count).map((name, seat) => (name.trim() === "" ? (computers[seat] ? computerNumberName(say, seat + 1) : playerNumberName(say, seat + 1)) : name));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="cards-preview">
        <CardTableSurface appearance={appearance}>{preview === null ? null : <adapter.Centre game={preview} viewer={0} players={previewNames} />}</CardTableSurface>
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="cards-set-up"
        data-kind={kind}
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (nobody) return;
          if (severalOffer !== undefined) void table.start(size, choices.slice(0, count));
          else onStart(freshCardSeed(), size, names.slice(0, count), seated);
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        <Section legend={CARD_TABLE_COPY.howMany}>
          <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label={CARD_TABLE_COPY.howMany}>
            {counts.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === count} onClick={() => setCount(option)} data-testid="cards-count" data-count={option} className={`min-h-11 rounded-lg border text-base font-semibold ${option === count ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {option}
              </button>
            ))}
          </div>
        </Section>
        <Section legend={CARD_TABLE_COPY.length}>
          <div className={`grid gap-1.5 ${spec.sizes.length === 4 ? "grid-cols-2" : "grid-cols-3"}`} role="radiogroup" aria-label={CARD_TABLE_COPY.length}>
            {spec.sizes.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === size} onClick={() => setSize(option)} data-testid="cards-length" data-size={option} className={`min-h-11 rounded-lg border text-sm font-semibold ${option === size ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {LENGTH_WORDS[kind](option, say)}
              </button>
            ))}
          </div>
        </Section>
        <Section legend={CARD_TABLE_COPY.seats}>
          {names.map((name, seat) => {
            if (seat >= count) return null;
            return (
              <div key={seat} className="flex items-center gap-2 text-sm" data-testid="cards-seat-set-up" data-seat={seat}>
                <MarbleChip player={seat} />
                {severalOffer !== undefined ? (
                  <div className="min-w-0 flex-1">
                    <SeatChoiceSelect offer={severalOffer} seat={seat} choices={choices} onChoose={(at, choice) => setChoices((was) => was.map((one, where) => (where === at ? choice : one)))} />
                  </div>
                ) : (
                  <>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">{playerNumberName(say, seat + 1)}</span>
                  <input
                    type="text"
                    value={name}
                    maxLength={PARTY_NAME_MOST}
                    placeholder={computers[seat] ? computerNumberName(say, seat + 1) : playerNumberName(say, seat + 1)}
                    onChange={(event) => setNames((was) => was.map((one, at) => (at === seat ? event.target.value : one)))}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="cards-name"
                  />
                </label>
                <button
                  type="button"
                  aria-pressed={computers[seat]}
                  onClick={() => setComputers((was) => was.map((one, at) => (at === seat ? !one : one)))}
                  className={`min-h-11 shrink-0 rounded-lg border px-2.5 text-xs font-semibold ${computers[seat] ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                  data-testid="cards-computer"
                >
                  {CARD_TABLE_COPY.computer}
                </button>
                  </>
                )}
              </div>
            );
          })}
        </Section>
        <p className={`min-h-5 text-xs ${nobody ? "text-shu" : "text-muted"}`}>{nobody ? CARD_TABLE_COPY.onePerson : severalOffer === undefined ? CARD_TABLE_COPY.kept : ONLINE_COPY.severalNote}</p>
        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} disabled={nobody || table.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, count))} data-testid="cards-start">
          {severalOffer === undefined ? CARD_TABLE_COPY.start : table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
        </button>
        {table.problem !== null && severalOffer !== undefined ? (
          <p className="text-sm text-shu" role="alert" data-testid="online-start-problem">
            {table.problem}
          </p>
        ) : null}
      </form>
    </div>
  );
}
