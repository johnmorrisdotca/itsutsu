import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import type { TimeControlName } from "./clock.constants";

/**
 * The names of the preset clocks: each an English label beside its own kanji,
 * which a Japanese reader is shown instead (`Speaker.pairName`), and a
 * description that is a phrase. Apart from `clock.constants.ts` so the names
 * are one pure table the i18n gate allows and the numbers beside them are not.
 */

export const TIME_CONTROL_DISPLAY: Record<
  TimeControlName,
  { label: string; kanji: string; description: PhraseKey }
> = {
  none: {
    label: "No clock",
    kanji: "無制限",
    description: "clock.noneDescription",
  },
  blitz: {
    label: "Blitz",
    kanji: "早碁",
    description: "clock.blitzDescription",
  },
  rapid: {
    label: "Rapid",
    kanji: "速碁",
    description: "clock.rapidDescription",
  },
  classical: {
    label: "Classical",
    kanji: "持ち時間",
    description: "clock.classicalDescription",
  },
};

