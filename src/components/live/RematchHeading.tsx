"use client";

import { Paired } from "@/components/i18n/Paired";

import { useRematchHeading } from "./setUpHeadingState";
import { rematchTitle, swapNote } from "./setUpHeadingWords";
import type { RematchSwapProps, RematchTitleProps } from "./setUp.types";

/**
 * The two parts of a rematch's heading that depend on the choices below it: the
 * title, and the swapped colour. Each follows the set-up screen's own decision as
 * it changes, in both directions — away from the rematch and back to it — without
 * a reload. See `setUpHeadingState`.
 */
export function RematchTitle({ id, againName, plain, initial }: RematchTitleProps) {
  const state = useRematchHeading(id, initial);
  const title = rematchTitle({ againName, state, plain });
  return <Paired en={title.en} kanji={title.kanji} kanjiClassName="text-lg font-normal opacity-70" />;
}

export function RematchSwap({ id, colour, initial }: RematchSwapProps) {
  const state = useRematchHeading(id, initial);
  const note = swapNote(state, colour);
  if (note === null) return null;
  return (
    <>
      {" · "}
      <span data-testid="set-up-swap">{note}</span>
    </>
  );
}
