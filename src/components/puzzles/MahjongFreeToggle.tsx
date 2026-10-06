"use client";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";

import { mahjongCopy } from "./cardWords";
import { useMahjongFind, useMahjongFree, writeMahjongFind, writeMahjongFree } from "./mahjongFree";

/** Two chips for one remembered way of looking at the board, and the line saying what the chosen one does. */
function TwoChips({
  on,
  write,
  label,
  testId,
  words,
  kanji,
  blurb,
  withBlurb,
}: {
  on: boolean;
  write: (on: boolean) => void;
  label: string;
  testId: string;
  words: { on: string; off: string };
  kanji: { on: string; off: string };
  blurb: { on: string; off: string };
  withBlurb: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label={label} data-testid={testId}>
        {[true, false].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={on === each}
            className={`${PICK_WORD_CHIP} ${on === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => write(each)}
            data-testid={`${testId}-${each ? "on" : "off"}`}
          >
            <Paired en={each ? words.on : words.off} kanji={each ? kanji.on : kanji.off} kanjiClassName="opacity-70" inReadersLanguage />
          </button>
        ))}
      </div>
      {withBlurb ? (
        <p className="min-h-8 text-xs text-muted" data-testid={`${testId}-blurb`}>
          {on ? blurb.on : blurb.off}
        </p>
      ) : null}
    </>
  );
}

/**
 * FREE TILES LIT, OR THE CLASSIC LOOK: the same two chips on the set-up screen
 * and under the board, reading and writing the one choice (`mahjongFree.ts`),
 * so turning it off in play is what the next set-up opens on.
 */
export function MahjongFreeToggle({ withBlurb = false }: { withBlurb?: boolean }) {
  const say = useSpeaker();
  const MAHJONG_COPY = mahjongCopy(say.locale);
  return (
    <TwoChips
      on={useMahjongFree()}
      write={writeMahjongFree}
      label={say.say("pcard.mj.freeAria")}
      testId="mahjong-free"
      words={{ on: MAHJONG_COPY.freeOn, off: MAHJONG_COPY.freeOff }}
      kanji={{ on: "空牌", off: "素" }}
      blurb={MAHJONG_COPY.freeBlurb}
      withBlurb={withBlurb}
    />
  );
}

/** FIND, OR NOT: lights the matches of whatever tile is pointed at or chosen (`mahjongFree.ts`). */
export function MahjongFindToggle({ withBlurb = false }: { withBlurb?: boolean }) {
  const say = useSpeaker();
  const MAHJONG_COPY = mahjongCopy(say.locale);
  return (
    <TwoChips
      on={useMahjongFind()}
      write={writeMahjongFind}
      label={say.say("pcard.mj.findAria")}
      testId="mahjong-find"
      words={{ on: MAHJONG_COPY.findOn, off: MAHJONG_COPY.findOff }}
      kanji={{ on: "探す", off: "無" }}
      blurb={MAHJONG_COPY.findBlurb}
      withBlurb={withBlurb}
    />
  );
}
