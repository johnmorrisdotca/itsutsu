"use client";

import { MOVE_FORMAT_CHOICES, MOVE_FORMAT_DISPLAY } from "@/lib/record/moveFormats";

import { ViewTabs } from "@/components/ui/ViewTabs";

import { useMoveFormat } from "./MoveFormatContext";

/**
 * HOW THE MOVES ARE WRITTEN, a quiet control over a record: ours, or two a
 * line as ItsYourTurn and GoldToken print them, kept on the account
 * (`MoveFormatContext`). John, 2026-09-25: "a tertiary button that offers to
 * display in all the known formats we support. and save to memory." Then, on
 * a finished game with one format only: "Move list I thought I asked for
 * ability to be in multi-formats." So it is one control, over the record of a
 * game being played (`MoveHistory`) and of a finished one (`GameReplay`), and
 * the two cannot offer different choices.
 */
export function MoveFormatPicker() {
  const { format, setFormat } = useMoveFormat();
  // A choice of how the record reads: tabs, as every such choice is (`ViewTabs`).
  return (
    <ViewTabs
      label="How the moves are written"
      testId="move-format"
      items={MOVE_FORMAT_CHOICES.map((choice) => ({
        key: choice,
        onClick: () => setFormat(choice),
        current: format === choice,
        title: MOVE_FORMAT_DISPLAY[choice].example,
        testId: `move-format-${choice}`,
        label: MOVE_FORMAT_DISPLAY[choice].label,
      }))}
    />
  );
}
