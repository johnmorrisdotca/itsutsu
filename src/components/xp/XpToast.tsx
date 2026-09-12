"use client";

import type { KeyboardEvent, MouseEvent } from "react";

import { Paired } from "@/components/i18n/Paired";

import { XP_TOAST_COPY as copy, XP_TOAST_STYLE as style } from "./xp.constants";
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
 * It is a notice, not a modal. The card takes a tap anywhere to go, the
 * button in its corner is the same thing for a keyboard and a screen reader,
 * and Escape works while focus is on it. Resting a pointer or focus on it
 * holds it still, which is how a screenshot gets taken.
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
  const level = item.level;
  const reached = level?.reached === true;

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
      onClick={() => onDismiss(item.id)}
      onKeyDown={onKeyDown}
      onPointerEnter={() => onHold(item.id, "pointer")}
      onPointerLeave={() => onRelease(item.id, "pointer")}
      onFocus={() => onHold(item.id, "focus")}
      onBlur={() => onRelease(item.id, "focus")}
    >
      <span className={style.points}>
        <span className={style.amount} data-testid="xp-toast-points">
          {copy.amount(item.points)}
        </span>
        <span className={style.unit}>{copy.unit}</span>
      </span>
      <span className={style.body}>
        <span className={style.label} data-testid="xp-toast-label">
          <Paired en={item.label} kanji={item.kanji} kanjiClassName={style.kanji} />
        </span>
        <span className={style.sentence}>{item.sentence}</span>
        {level === undefined ? null : reached ? (
          <span className={style.levelReached} data-testid="xp-toast-level">
            <span className={style.levelEyebrow}>
              <Paired en={copy.levelUp.en} kanji={copy.levelUp.kanji} kanjiClassName={style.levelKanji} />
            </span>
            <span className={style.levelName}>{level.name}</span>
          </span>
        ) : (
          <span className={style.levelNext} data-testid="xp-toast-level">
            {copy.nextLevel(level.name)}
          </span>
        )}
      </span>
      <button
        type="button"
        aria-label={copy.dismiss}
        className={style.dismiss}
        data-testid="xp-toast-dismiss"
        onClick={onButton}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
