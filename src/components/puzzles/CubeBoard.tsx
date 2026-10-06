"use client";

import type { Ref } from "react";
import type { CubeMove } from "@johnmorrisdotca/kyuubu";
import { Kyuubu, type KyuubuHandle } from "@johnmorrisdotca/kyuubu/react";

import { BoardFrame } from "@/components/board/BoardFrame";
import type { BoardThemeTokens } from "@/components/board/board.types";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { CUBE_FILL } from "./cube.constants";
import { cubeCopy } from "./mazeWords";
import { CubeZoom } from "./CubeZoom";

/** How far in from the wood's edge the cube's space starts: the rim of every board. */
const RIM = 0.03;

/**
 * THE CUBE ON THE READER'S OWN WOOD: a board like every board on the site
 * (`BoardFrame`), with the cube (Kyuubu, `@johnmorrisdotca/kyuubu`) turning in 3D in
 * the middle of it. Used by the solve, the set-up's preview, a finished
 * solve's replay and the picture of the game.
 */
export function CubeBoard({
  size,
  state,
  theme,
  interactive = false,
  keyboard = "none",
  onTurn,
  cube,
  hint = null,
  zoomable = false,
}: {
  size: number;
  state: string;
  theme: BoardThemeTokens;
  interactive?: boolean;
  /** Where its keys are listened for: the whole page while it is being solved, nowhere on a preview. */
  keyboard?: "page" | "none";
  onTurn?: (move: CubeMove, state: string) => void;
  cube?: Ref<KyuubuHandle>;
  /** A move to draw on the cube, the way to make it (Kyuubu's visual guide), or null. */
  hint?: readonly CubeMove[] | null;
  /** Offer to zoom the cube in and out inside its board (the solve and the replay do; a preview does not). */
  zoomable?: boolean;
}) {
  const say = useSpeaker();
  const kyuubu = (
      <Kyuubu
        ref={cube}
        size={size}
        state={state}
        interactive={interactive}
        keyboard={keyboard}
        fill={CUBE_FILL}
        label={cubeCopy(say.locale).label(size)}
        onTurn={onTurn}
        hint={hint}
        className="absolute inset-0"
        data-testid="cube"
        data-size={String(size)}
      />
  );
  return (
    <BoardFrame size={size} theme={theme} flipped={false} inset={RIM} lattice={false} shape="rhombus" coordinates={false}>
      {zoomable ? <CubeZoom>{kyuubu}</CubeZoom> : kyuubu}
    </BoardFrame>
  );
}
