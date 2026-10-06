import type { ReactNode } from "react";

import { phraseWith } from "@/components/i18n/phraseWith";
import type { Speaker } from "@/lib/i18n/i18n";

/** "<strong>12</strong> points", or "<strong>12</strong>点": a score drawn bold, with its noun in the reader's language. */
export function pointsWith(say: Speaker, total: number): ReactNode {
  return phraseWith(say.say(say.form("puzzle.count.point", total), { count: "{count}" }), { count: <strong className="tabular-nums">{total}</strong> });
}
