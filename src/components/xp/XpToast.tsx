"use client";

import type { KeyboardEvent, MouseEvent } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Paired } from "@/components/i18n/Paired";

import { xpAmount, XP_LEVEL_UP_KANJI, XP_TOAST_STYLE as style } from "./xp.constants";
import type { XpToastItem, XpToastPhase } from "./xp.types";

/** Why a toast's clock is stopped. */
export type XpToastHold = "pointer" | "focus" | "hidden";

/**
 * One award, said once.
 *
 * The points are the biggest thing on it; the label sits beside them with
 * its kanji where every heading on the site keeps one; the sentence saying
 * why runs under, quieter. A level reached gets its own line and its own
 * tint, because that is the one a player will want to show somebody.
 *
 * It is a notice, not a modal, and it takes no press meant for the page: a
 * press anywhere on the card reaches whatever is under it (see
 * `XP_TOAST_STYLE.host`). The button in its corner closes it, for a pointer, a
 * keyboard and a screen reader alike, and Escape works while focus is on it.
 * Resting the pointer on that button, or focus anywhere in the card, holds it
 * still, which is how a screenshot gets taken.
 */
export function XpToast({
  item,
  phase,
  name,
  onDismiss,
  onHold,
  onRelease,
}: {
  item: XpToastItem;
  phase: XpToastPhase;
  /** The card's name for a screen reader: the announcement, already worded. */
  name: string;
  onDismiss: (id: string) => void;
  onHold: (id: string, why: XpToastHold) => void;
  onRelease: (id: string, why: XpToastHold) => void;
}) {
  const say = useSpeaker();
  const level = item.level;
  const reached = level?.reached === true;
  /*
   * "Level up" is a heading, so it keeps its kanji the way every heading on
   * the site does: the English half switches with the reader's language and
   * 昇級 stays beside it — and for a reader whose own script that is, the
   * pairing collapses to the one word, as `SectionTitle` does.
   */
  const levelUp = say.pair("xp.levelUp", XP_LEVEL_UP_KANJI);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    onDismiss(item.id);
  }

  function onButton(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onDismiss(item.id);
  }

  return (
    <div
      role="group"
      aria-label={name}
      className={`${style.card} ${reached ? style.cardLevel : style.cardPlain}`}
      data-testid="xp-toast"
      data-id={item.id}
      data-phase={phase}
      data-level={level === undefined ? undefined : reached ? "reached" : "next"}
      onKeyDown={onKeyDown}
      onFocus={() => onHold(item.id, "focus")}
      onBlur={() => onRelease(item.id, "focus")}
    >
      <span className={style.points}>
        <span className={style.amount} data-testid="xp-toast-points">
          {xpAmount(item.points)}
        </span>
        <span className={style.unit}>{say.say("xp.unit")}</span>
      </span>
      <span className={style.body}>
        <span className={style.label} data-testid="xp-toast-label">
          <Paired en={item.label} kanji={item.kanji} kanjiClassName={style.kanji} />
        </span>
        <span className={style.sentence}>{item.sentence}</span>
        {level === undefined ? null : reached ? (
          <span className={style.levelReached} data-testid="xp-toast-level">
            <span className={style.levelEyebrow}>
              {levelUp.kanji === null ? (
                <span className="font-mincho normal-case tracking-normal">{levelUp.text}</span>
              ) : (
                <>
                  {levelUp.text} <span className={`font-mincho ${style.levelKanji}`}>{levelUp.kanji}</span>
                </>
              )}
            </span>
            <span className={style.levelName}>{level.name}</span>
          </span>
        ) : (
          <span className={style.levelNext} data-testid="xp-toast-level">
            {say.say("xp.nextLevel", { name: level.name })}
          </span>
        )}
      </span>
      <button
        type="button"
        aria-label={say.say("xp.dismiss")}
        className={style.dismiss}
        data-testid="xp-toast-dismiss"
        onClick={onButton}
        onPointerEnter={() => onHold(item.id, "pointer")}
        onPointerLeave={() => onRelease(item.id, "pointer")}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
