"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/Controls";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { PDN_MIME, pdnFileName, pdnOffered, writePdn } from "@/lib/record/pdn";

/** The day a game was played in this reader's calendar, worked out in the click handler as `SgfDownload`'s is. */
function calendarDate(iso: string): string | null {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const pad = (value: number, width = 2) => String(value).padStart(width, "0");
  return `${pad(at.getFullYear(), 4)}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/**
 * A finished draughts game as a .pdn file (`pdn.ts`), made in the browser from
 * the record the replay already holds, beside the SGF download the other
 * families have — SGF has no number for the draughts family, so where one of
 * the two is offered the other is not. Nothing at all for any other game.
 */
export function PdnDownload({ game }: { game: GameDetail }) {
  const speaker = useSpeaker();
  if (!pdnOffered(game.variant)) return null;

  function download() {
    const playedOn = calendarDate(game.playedAt);
    const written = writePdn(game, playedOn);
    if (written.kind !== "written") return;
    const url = URL.createObjectURL(new Blob([written.text], { type: PDN_MIME }));
    const link = document.createElement("a");
    link.href = url;
    link.download = pdnFileName(game, playedOn);
    document.body.append(link);
    link.click();
    link.remove();
    // Revoked once the browser has taken the file; revoking in the same tick cancels it in some browsers.
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return (
    <Button onClick={download} data-testid="download-pdn">
      {speaker.say("record.downloadPdn")}
    </Button>
  );
}
