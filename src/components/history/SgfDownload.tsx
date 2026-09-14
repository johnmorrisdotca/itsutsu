"use client";

import { useMemo } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/Controls";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { sgfFileName, sgfRefusal, writeSgf } from "@/lib/record/sgf";
import { SGF_MIME } from "@/lib/record/sgf.constants";

/**
 * The day a game was played, in THIS reader's calendar.
 *
 * Called in the click handler and nowhere else. The server cannot know the
 * reader's zone, so a date worked out while rendering would be the server's
 * day drawn on the server and the browser's day drawn in the browser — the
 * 0.146.1 mismatch again. A handler runs after hydration, where there is only
 * the browser.
 */
function calendarDate(iso: string): string | null {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const pad = (value: number, width = 2) => String(value).padStart(width, "0");
  return `${pad(at.getFullYear(), 4)}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/**
 * A finished game as a .sgf file, made in the browser from the record the
 * replay already holds: no route, no request, nothing for the site to pay for.
 *
 * Nothing at all for a game SGF cannot describe. There is no disabled button
 * with an apology beside it, because a reader of a Connect6 game was never
 * going to get a file and does not need telling so beside every replay.
 */
export function SgfDownload({ game }: { game: GameDetail }) {
  const speaker = useSpeaker();
  const offered = useMemo(() => sgfRefusal(game) === null, [game]);
  if (!offered) return null;

  function download() {
    const playedOn = calendarDate(game.playedAt);
    const written = writeSgf(game, playedOn);
    if (written.kind !== "written") return;
    const url = URL.createObjectURL(new Blob([written.text], { type: SGF_MIME }));
    const link = document.createElement("a");
    link.href = url;
    link.download = sgfFileName(game, playedOn);
    document.body.append(link);
    link.click();
    link.remove();
    // Revoked once the browser has taken the file; revoking in the same tick cancels it in some browsers.
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return (
    <Button onClick={download} data-testid="download-sgf">
      {speaker.say("record.downloadSgf")}
    </Button>
  );
}
