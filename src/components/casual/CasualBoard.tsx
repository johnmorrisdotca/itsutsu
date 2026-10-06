"use client";

import { mountKarakuri, type KarakuriGame, type StatusEvent } from "@johnmorrisdotca/karakuri/play";
import { useEffect, useRef, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { CasualKind } from "@/lib/casual/casual.types";
import { CASUAL_SPECS } from "@/lib/casual/casual.constants";

/**
 * The height a board may take: most of the window on the page, and in Just the
 * board the window less what the modal keeps round it (its header, the line
 * above the board, the row of presses under it and the padding of both: 18rem,
 * a rem more than a square board's 17 in globals.css, for the row of presses
 * and the line a casual game has). Asked again whenever the board is fitted,
 * which includes when the box it sits in changes size, as it does when the mode
 * is switched.
 */
function room(): number {
  const bare = document.documentElement.dataset.bare === "true";
  return bare ? window.innerHeight - 18 * 16 : window.innerHeight * 0.82;
}

/**
 * ONE CASUAL GAME'S BOARD, drawn by the package (`@johnmorrisdotca/karakuri`) on
 * a canvas in this element: the board alone (`ui: "board"`), because the
 * buttons, the result and the words round it are the site's own (the shared
 * controls of every play, `GameEnding`).
 *
 * Mounted after the browser takes over, and again when the game, the level or
 * `run` changes (Restart is a new `run`). The package's physics runs in the
 * browser only: nothing of a casual game is computed on the server, which is
 * the reason this file is loaded with `ssr: false` (`CasualBoardClient`).
 *
 * The package leaves the mounted game on its element (`element.karakuri`), which is how a browser spec reads where a piece is.
 *
 * `readOnly` is a preview: the same live board, with nothing to touch.
 * `onStatus` is told a level began, was won, or was lost, with the package's
 * own words for the result and for the line about the level.
 */
export function CasualBoard({
  kind,
  level,
  run = 0,
  readOnly = false,
  onStatus,
  testId = "casual-board",
}: {
  kind: CasualKind;
  level: number;
  run?: number;
  readOnly?: boolean;
  onStatus?: (event: StatusEvent) => void;
  testId?: string;
}) {
  const { locale } = useSpeaker();
  const host = useRef<HTMLDivElement>(null);
  const told = useRef(onStatus);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    told.current = onStatus;
  });
  useEffect(() => {
    const element = host.current;
    if (element === null) return;
    const mount = mountKarakuri(element, {
      game: CASUAL_SPECS[kind].id as KarakuriGame,
      level,
      ui: "board",
      // The package says its own words (the line about the level and the result) in the reader's language.
      lang: locale === "ja" ? "ja" : "en",
      room,
      onStatus: (event) => told.current?.(event),
      onChange: (event) => told.current?.(event),
    });
    // Just the board changes the room round the board without resizing the box it is in: fit it again then.
    const mode = new MutationObserver(() => mount.redraw());
    mode.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bare"] });
    // The mount is a handle to a canvas this effect made: telling the page it is there is the one thing it does with state.
    setMounted(true);
    return () => {
      mode.disconnect();
      mount.destroy();
    };
  }, [kind, level, run, locale]);
  return (
    <div
      ref={host}
      className={readOnly ? "pointer-events-none w-full select-none" : "w-full select-none"}
      data-testid={testId}
      data-kind={kind}
      data-level={level}
      data-ready={mounted ? "true" : "false"}
      aria-hidden={readOnly ? true : undefined}
    />
  );
}
