import { Paired } from "@/components/i18n/Paired";
import { RowActions } from "@/components/ui/Controls";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { HereNow } from "@/lib/social/presence";
import { ChallengeButton } from "./ChallengeButton";
import { START_COPY } from "./mine.constants";
import { RecencyLegend } from "./Recency";
import { MemberTag } from "@/components/players/MemberTag";

/**
 * Who is in the room, beside the seats they might take. The players page
 * carries the same list; here it sits next to the board because on a small
 * site the answer to "who can I play" is usually "whoever is about".
 */
export function HereNowPanel({
  here,
  me,
}: {
  here: HereNow[];
  /**
   * The reader's member id, or null for a reader with no account.
   *
   * By id: this compared the room against the reader's ADDRESS, which is
   * null for an invite holder — and a null address matched every kept record
   * in the room, so they were left off the list as though each were the
   * reader. An id is who somebody is. And only an account can challenge, so
   * the same null is what keeps the button off for an invite holder, whose
   * challenge the route would refuse.
   */
  me: string | null;
}) {
  const others = here.filter((entry) => entry.id !== me);
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="here-panel">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        <Paired en={START_COPY.hereNow.label} kanji={START_COPY.hereNow.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
        {others.length > 0 ? <span className="font-normal tracking-normal">{others.length}</span> : null}
      </h2>
      {others.length === 0 ? (
        <p className="text-xs text-muted" data-testid="here-empty">
          {START_COPY.nobodyHere}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-1">
            {others.slice(0, HERE_SHOWN).map((entry) => (
              <HereRow key={entry.id} entry={entry} me={me} />
            ))}
          </ul>
          {/*
            THE REST FOLD, AND THE FOLD SAYS HOW MANY. On a phone this panel
            was 5,230 pixels of /games — six screens — because every member
            seen lately got a full row with a 44-pixel button, and there were
            ninety-nine of them. The first few answer "is anybody about"; a
            fold that prints "91 more" answers "how many", which is the other
            question, and nothing is hidden that the summary does not count.
          */}
          {others.length > HERE_SHOWN ? (
            <details className="group" data-testid="here-more">
              <summary className="cursor-pointer list-none text-xs text-muted underline-offset-4 hover:underline">
                <span className="group-open:hidden">{START_COPY.hereNow.more(others.length - HERE_SHOWN)}</span>
                <span className="hidden group-open:inline">{START_COPY.hereNow.fewer}</span>
              </summary>
              <ul className="mt-1 flex flex-col gap-1">
                {others.slice(HERE_SHOWN).map((entry) => (
                  <HereRow key={entry.id} entry={entry} me={me} />
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
      <RecencyLegend />
    </section>
  );
}

/** How many are shown before the rest fold: enough to answer "is anybody about", on one phone screen. */
const HERE_SHOWN = 6;

function HereRow({ entry, me }: { entry: HereNow; me: string | null }) {
  return (
    <li className="flex items-center gap-2 py-0.5 text-sm">
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2">
        <MemberTag
          name={entry.name}
          memberId={entry.id}
          marks={entry.marks}
          recency={entry.recency}
          you={entry.id === me}
          fallback={entry.email ?? ""}
        />
        {entry.localTime !== null ? <span className="text-xs text-muted">{entry.localTime} there</span> : null}
      </span>
      <RowActions>
        {/* Everybody here is a member seen lately — a person, with or without an address. */}
        {me !== null ? <ChallengeButton memberId={entry.id} /> : null}
      </RowActions>
    </li>
  );
}
