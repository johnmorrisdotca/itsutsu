"use client";

import { useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { SET_UP_PREVIEW_BOX } from "@/components/live/live.constants";
import Link from "@/components/ui/Link";
import { PANEL_CLASS, PLAY_BUTTON, SECTION_TITLE } from "@/components/ui/ui.constants";
import { HOUSEKI_SPECS, campaignsOf, levelsIn, levelsOf } from "@/lib/houseki/houseki.constants";
import { WAY_KEYS } from "@/lib/houseki/housekiKeys";
import { housekiQuery } from "@/lib/houseki/housekiAddress";
import { marksOf } from "@/lib/houseki/housekiMarks.data";
import { dailyDone, latestRun, nextLevel, wonLevels, wonCount } from "@/lib/houseki/housekiProgress";
import type { HousekiCampaign, HousekiKind, HousekiRequest } from "@/lib/houseki/houseki.types";
import { housekiPlayPath } from "@/lib/gomoku/slugs";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { HousekiGameClient } from "./HousekiGameClient";
import { todayUtc } from "./housekiRuntime";
import { useHousekiSave } from "./housekiStore";
import { campaignName, requestWords } from "./housekiWords";

type Way = "levels" | "lessons" | "daily" | "free";

const TILE = "flex h-[4.5rem] min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-moss";
const chosenLook = (chosen: boolean) => (chosen ? "border-ink bg-ink text-paper" : "border-rule-strong bg-ivory hover:bg-rule/60");

/**
 * A HOUSEKI GAME'S SET-UP, at /games/<slug>/new: how to play it, and Start.
 *
 * Four ways in, each with its own choices: a level of a campaign, a lesson, today's
 * Daily (where the game has one), or a free game of a size and a number of colours.
 * Beside it the live board as the game would start, with nothing to touch, as every
 * set-up preview on this site is the board itself (`HousekiGameClient`, `readOnly`).
 * The level Start plays begins as the first not yet won, and a game left half way is
 * offered above Start, read from this browser (`housekiStore.ts`).
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): the preview is
 * one fixed box whatever shape the board is, the choices of every way live in one
 * box of one height (a hundred levels scroll inside it), each tile is one size with
 * a line for its state that is kept even when empty, and the line under Start does
 * not depend on the choice.
 */
export function HousekiSetUp({ kind, appearance }: { kind: HousekiKind; appearance: Appearance }) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const save = useHousekiSave();
  const spec = HOUSEKI_SPECS[kind];
  const campaigns = campaignsOf(kind);
  const ways: Way[] = ["levels", "lessons", ...(spec.daily ? (["daily"] as const) : []), "free"];
  const [way, setWay] = useState<Way>("levels");
  const [campaign, setCampaign] = useState<HousekiCampaign>("classic");
  const [chosenLevel, setChosenLevel] = useState<number | null>(null);
  const [lesson, setLesson] = useState(1);
  const [size, setSize] = useState(spec.sizes[0]!.id);
  const [colours, setColours] = useState<4 | 5 | 6>(spec.colours[0]!);
  const [arcade, setArcade] = useState(false);
  const levels = levelsIn(kind, campaign);
  const won = save === undefined ? [] : wonLevels(save, kind, campaign);
  const level = chosenLevel !== null && chosenLevel <= levels ? chosenLevel : save === undefined ? 1 : nextLevel(save, kind, campaign);
  const request: HousekiRequest =
    way === "levels" ? { kind: "level", campaign, number: level } : way === "lessons" ? { kind: "lesson", number: lesson } : way === "daily" ? { kind: "daily" } : { kind: "free", size, colours, arcade: spec.arcade && arcade };
  const waiting = save === undefined ? null : latestRun(save, kind);
  const today = todayUtc();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start" data-testid="houseki-set-up" data-kind={kind} {...readyMark(hydrated)}>
      <div className={SET_UP_PREVIEW_BOX} data-testid="houseki-preview">
        {/* One box for every board: a taller or wider one is fitted into it and the page does not move. */}
        <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-md border border-rule bg-ivory p-2" style={{ containerType: "size" }}>
          <HousekiGameClient key={JSON.stringify(request)} kind={kind} request={request} resume={null} run={0} appearance={appearance} readOnly />
        </div>
      </div>
      <div className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}>
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{say.say("gamepages.howToPlay")}</legend>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label={say.say("gamepages.howToPlay")}>
            {ways.map((each) => (
              <button
                key={each}
                type="button"
                role="radio"
                aria-checked={each === way}
                onClick={() => setWay(each)}
                data-testid={`houseki-way-${each}`}
                className={`${TILE} h-12 text-sm font-medium ${chosenLook(each === way)}`}
              >
                {say.say(WAY_KEYS[each])}
              </button>
            ))}
          </div>
        </fieldset>

        {/* The choices of whichever way is chosen: one box of one height, so the page never moves. */}
        <div className="h-[19.5rem] overflow-y-auto pr-1" data-testid="houseki-choices">
          {way === "levels" ? (
            <fieldset className="flex flex-col gap-2">
              {campaigns.length > 1 ? (
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={say.say("houseki.setup.campaign")}>
                  {campaigns.map((each) => (
                    <button key={each} type="button" role="radio" aria-checked={each === campaign} onClick={() => { setCampaign(each); setChosenLevel(null); }} data-testid={`houseki-campaign-${each}`} className={`${TILE} h-11 text-sm font-medium ${chosenLook(each === campaign)}`}>
                      {campaignName(say, each)}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-[repeat(5,minmax(0,1fr))]" role="radiogroup" aria-label={say.say("houseki.setup.levels")}>
                {Array.from({ length: levels }, (_, index) => index + 1).map((option) => {
                  const done = won.includes(option);
                  const marks = marksOf(kind, campaign, option) ?? 1;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={option === level}
                      aria-label={say.say("houseki.setup.levelLabel", { number: say.number(option), marks: String(marks), state: done ? say.say("houseki.setup.won") : "" })}
                      onClick={() => setChosenLevel(option)}
                      data-testid="houseki-level"
                      data-level={option}
                      data-state={done ? "won" : "fresh"}
                      className={`${TILE} h-14 ${chosenLook(option === level)}`}
                    >
                      <span className="text-lg leading-none font-semibold tabular-nums">{option}</span>
                      <span className="h-4 text-[0.65rem] leading-4" aria-hidden="true">
                        {"●".repeat(marks)}
                        <span className="opacity-30">{"●".repeat(5 - marks)}</span>
                      </span>
                      <span className="h-3 text-[0.6rem] leading-3" aria-hidden="true">
                        {done ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {way === "lessons" ? (
            <fieldset className="flex flex-col gap-2">
              <p className="text-sm text-muted">{say.say("houseki.setup.lessonsBlurb")}</p>
              <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={say.say("houseki.setup.lessons")}>
                {Array.from({ length: spec.lessons }, (_, index) => index + 1).map((option) => (
                  <button key={option} type="button" role="radio" aria-checked={option === lesson} onClick={() => setLesson(option)} data-testid="houseki-lesson-tile" data-lesson={option} className={`${TILE} ${chosenLook(option === lesson)}`}>
                    <span className="text-sm font-medium">{say.say("houseki.what.lesson", { number: say.number(option) })}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {way === "daily" ? (
            <div className="flex flex-col gap-2" data-testid="houseki-daily">
              <p className="text-sm">{say.say("houseki.setup.dailyBlurb", { day: today })}</p>
              <p className="text-sm font-medium" data-testid="houseki-daily-state">
                {save === undefined ? "" : say.say(dailyDone(save, kind, today) ? "houseki.setup.dailyDone" : "houseki.setup.dailyOpen")}
              </p>
            </div>
          ) : null}

          {way === "free" ? (
            <div className="flex flex-col gap-3">
              <fieldset className="flex flex-col gap-1.5">
                <legend className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{say.say("houseki.setup.size")}</legend>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label={say.say("houseki.setup.size")}>
                  {spec.sizes.map((each) => (
                    <button key={each.id} type="button" role="radio" aria-checked={each.id === size} onClick={() => setSize(each.id)} data-testid="houseki-size" data-size={each.id} className={`${TILE} h-14 ${chosenLook(each.id === size)}`}>
                      <span className="text-sm font-medium tabular-nums">{each.width} × {each.height}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="flex flex-col gap-1.5">
                <legend className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{say.say("houseki.setup.colours")}</legend>
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={say.say("houseki.setup.colours")}>
                  {[...spec.colours].sort().map((each) => (
                    <button key={each} type="button" role="radio" aria-checked={each === colours} onClick={() => setColours(each)} data-testid="houseki-colours" data-colours={each} className={`${TILE} h-11 ${chosenLook(each === colours)}`}>
                      <span className="text-sm font-medium tabular-nums">{each}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              {spec.arcade ? (
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{say.say("houseki.setup.pace")}</legend>
                  <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={say.say("houseki.setup.pace")}>
                    {[false, true].map((each) => (
                      <button key={String(each)} type="button" role="radio" aria-checked={each === arcade} onClick={() => setArcade(each)} data-testid="houseki-pace" data-pace={each ? "arcade" : "relaxed"} className={`${TILE} h-14 ${chosenLook(each === arcade)}`}>
                        <span className="text-sm font-medium">{say.say(each ? "houseki.setup.arcade" : "houseki.setup.relaxed")}</span>
                        <span className="px-1 text-[0.65rem] leading-tight opacity-80">{say.say(each ? "houseki.setup.arcadeBlurb" : "houseki.setup.relaxedBlurb")}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <p className="text-xs text-muted">{say.say("houseki.setup.noClock")}</p>
              )}
            </div>
          ) : null}
        </div>

        <Link href={housekiPlayPath(kind, housekiQuery(request))} className={PLAY_BUTTON} data-testid="houseki-start">
          {say.say("houseki.setup.start", { what: requestWords(say, request) })}
        </Link>
        <div className="flex min-h-12 flex-col gap-1 text-xs text-muted" data-testid="houseki-kept">
          {waiting === null ? null : (
            <Link href={housekiPlayPath(kind, housekiQuery(waiting.request))} className="text-sm font-semibold underline underline-offset-4" data-testid="houseki-continue">
              {say.say("houseki.setup.continue", { what: requestWords(say, waiting.request) })}
            </Link>
          )}
          <span>
            {say.sentences([
              ...(save === undefined ? [] : [say.sentence(say.say("houseki.card.wonOf", { won: say.number(wonCount(save, kind)), levels: say.number(levelsOf(kind)) }))]),
              say.say("houseki.setup.points"),
            ])}
          </span>
        </div>
      </div>
    </div>
  );
}
