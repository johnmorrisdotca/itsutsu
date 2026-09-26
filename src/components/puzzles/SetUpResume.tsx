import Link from "@/components/ui/Link";

import { START_PRESS } from "@/components/live/live.constants";
import { PressLabel } from "@/components/ui/PressLabel";
import { PLAY_BUTTON } from "@/components/ui/ui.constants";

/**
 * RESUME, FIRST, ON A PUZZLE'S SET-UP SCREEN when the reader has one of it
 * going. John, 2026-09-26 (BUG CRITICAL): a puzzle's front door led with
 * Resume, but its set-up page offered only Start, as though nothing were kept.
 * The address is the one the front door and My games' Continue use; the Start
 * buttons stay beneath it, for a new one.
 */
export function SetUpResume({ href }: { href: string | null }) {
  if (href === null) return null;
  return (
    <Link href={href} className={PLAY_BUTTON} data-testid="set-up-resume">
      <PressLabel {...START_PRESS.resume} />
    </Link>
  );
}
