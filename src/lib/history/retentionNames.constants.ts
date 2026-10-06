/**
 * How long a finished game stays on a person's list: each an English label
 * beside its own kanji, which a Japanese reader is shown instead
 * (`Speaker.pairName`). Apart from `retention.ts` so the names are one pure
 * table the i18n gate allows and the query beside them is not.
 */
export const KEEP_FINISHED_DISPLAY: Record<number, { label: string; kanji: string }> = {
  0: { label: "For ever", kanji: "無期限" },
  7: { label: "A week", kanji: "一週間" },
  14: { label: "A fortnight", kanji: "二週間" },
  30: { label: "A month", kanji: "一月" },
  90: { label: "Three months", kanji: "三月" },
};
