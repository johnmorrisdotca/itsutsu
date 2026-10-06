"use client";

import { useId, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { LocalTime } from "@/components/ui/LocalTime";
import { weave } from "@/lib/i18n/weave";

import type { Release } from "@/lib/backlog/releases";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/**
 * One release, in UmaKuma's shape (its 1.659.0, 2026-09-24): the number with
 * the date at the right, then the release's title — its first line, which is
 * the `--summary` the release tool was given — on a line of its own, so a
 * phone never cuts the title to fit it beside the number.
 *
 * THE DATE OPENS ONTO ITS TIME. John, 2026-09-30: "Allow times to be revealed
 * when the user touches the date… add a row below and display nice full
 * date." The date is a button; touching it adds a row under the number with
 * the date and time written out in the reader's own zone and the site's
 * language (`LocalTime` in its `full` style, only ever drawn after a click, so
 * never in a render the server shares), and touching it again takes the row
 * away. A release dated to the day alone (0.222.0 to 0.225.0, see
 * `Release.at`) has no time to reveal, so its date stays plain text rather
 * than a button that opens onto nothing.
 *
 * THE NOTES OPEN ONLY WHEN THERE IS MORE TO READ. John asked why an Itsutsu
 * release cannot be opened when an UmaKuma one can: most of ours are one
 * line, and the row already shows it. A patch carrying several fixes has the
 * rest folded under its title; a release with nothing more has no arrow,
 * rather than one that opens onto nothing. The fold is the title alone, not
 * the whole row, so the date's button is never a button inside a button.
 *
 * `running` is printed only when it differs from the release's own number —
 * that happens whenever a patch has shipped since, and saying so is more
 * honest than marking 0.64.0 as though nothing had followed it.
 */
export function ReleaseEntry({
  release,
  current,
  running,
}: {
  release: Release;
  current: boolean;
  running: string;
}) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const whenId = useId();
  const [open, setOpen] = useState(false);
  const [title = "", ...more] = release.notes;
  const edition = say.pair("pages.thisEdition", "現行");
  const titleLine = (
    <span className="text-sm font-medium" data-testid="release-title">
      {title}
    </span>
  );
  return (
    <li
      className="flex flex-col gap-0.5 border-t border-rule py-2 first:border-t-0"
      data-testid="release"
      data-version={release.version}
    >
      <span className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums">{release.version}</span>
        {current ? (
          <span className="min-w-0 truncate rounded-full bg-moss-soft px-2 py-0.5 text-[0.65rem] font-semibold text-moss">
            {edition.text}
            {edition.kanji === null ? null : <> {edition.kanji}</>}
          </span>
        ) : null}
        {current && running !== release.version ? (
          <span className="min-w-0 truncate font-mono text-xs text-muted" data-testid="running-version">
            {say.say("pages.running", { version: running })}
          </span>
        ) : null}
        {release.date === null ? null : release.at === null ? (
          <span className="ml-auto shrink-0 font-mono text-xs text-muted" data-testid="release-date">
            {release.date}
          </span>
        ) : (
          <button
            type="button"
            className="ml-auto shrink-0 cursor-pointer font-mono text-xs text-muted underline decoration-dotted underline-offset-4 hover:text-ink"
            data-testid="release-date"
            aria-expanded={open}
            aria-controls={whenId}
            title={say.say(open ? "pages.hideTime" : "pages.showTime")}
            onClick={() => setOpen(!open)}
            {...readyMark(hydrated)}
          >
            {release.date}
          </button>
        )}
      </span>
      {open && release.at !== null ? (
        <span id={whenId} className="text-xs text-muted" data-testid="release-when">
          {weave(say.say("pages.released"), { when: <LocalTime at={release.at} style="full" /> })}
        </span>
      ) : null}
      {more.length === 0 ? (
        titleLine
      ) : (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-baseline gap-2">
            {titleLine}
            <span aria-hidden="true" className="ml-auto shrink-0 text-muted transition group-open:rotate-90">
              ›
            </span>
          </summary>
          <ul className="flex flex-col gap-0.5 pt-1.5" data-testid="release-more">
            {more.map((note) => (
              <li key={note} className="text-sm text-muted">
                {note}
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}
