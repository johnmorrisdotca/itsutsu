import { Paired } from "@/components/i18n/Paired";
import { MEMBER_KINDS, MEMBER_KIND_DISPLAY, worthShowing, type MemberKind } from "@/lib/auth/memberKind";

/**
 * What sort of member somebody is, in a word.
 *
 * Drawn on the unusual rows only. An ordinary member has no badge, because a
 * badge on every row is a badge on none and the whole point is that the
 * operator, the robots and the kept records stand out from the people.
 *
 * Being shut is not a kind and has its own badge: somebody can be a shut
 * operator, and folding the two together would lose one of them.
 */
const TONE: Record<MemberKind, string> = {
  [MEMBER_KINDS.operator]: "border-moss bg-moss-soft text-ink",
  [MEMBER_KINDS.robot]: "border-ochre/50 bg-ochre-soft text-ink",
  [MEMBER_KINDS.remembered]: "border-rule-strong bg-ivory text-muted",
  [MEMBER_KINDS.honorary]: "border-rule-strong bg-ivory text-muted",
  [MEMBER_KINDS.keptRecord]: "border-rule-strong bg-ivory text-muted",
  [MEMBER_KINDS.seed]: "border-rule bg-ivory text-muted",
  [MEMBER_KINDS.member]: "border-rule bg-ivory text-muted",
};

export function MemberKindBadge({ kind }: { kind: MemberKind }) {
  if (!worthShowing(kind)) return null;
  const copy = MEMBER_KIND_DISPLAY[kind];
  return (
    <span
      title={copy.note}
      data-testid="member-kind"
      data-kind={kind}
      className={`inline-flex shrink-0 items-baseline gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.06em] uppercase ${TONE[kind]}`}
    >
      <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-[0.7rem] font-normal normal-case tracking-normal opacity-70" />
    </span>
  );
}
