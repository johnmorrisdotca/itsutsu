import { SECTION_TITLE } from "@/components/ui/ui.constants";
import type { Release } from "@/lib/backlog/releases";

/** How many releases stand open before the rest are folded away. */
const SHOWN = 12;

/** One release: its number, whether it is the edition being served, and what changed. */
function ReleaseEntry({ release, current }: { release: Release; current: boolean }) {
  return (
    <li className="flex flex-col gap-0.5 border-t border-rule py-2 first:border-t-0" data-testid="release">
      <span className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums">{release.version}</span>
        {current ? (
          <span className="rounded-full bg-moss-soft px-2 py-0.5 text-[0.65rem] font-semibold text-moss">
            This edition 現行
          </span>
        ) : null}
      </span>
      <ul className="flex flex-col gap-0.5">
        {release.notes.map((note) => (
          <li key={note} className="max-w-prose text-sm text-muted">
            {note}
          </li>
        ))}
      </ul>
    </li>
  );
}

/**
 * What has shipped, newest first.
 *
 * Read from CHANGELOG.md rather than kept a second time: the changelog is
 * written in the same commit as the work it describes, so it is the only list
 * of releases that cannot fall behind. The board above says what the site is
 * not yet; this says what it already is.
 */
export function Releases({ releases, current }: { releases: Release[]; current: string }) {
  if (releases.length === 0) {
    return (
      <p className="text-sm text-muted" data-testid="releases-empty">
        The release history could not be read.
      </p>
    );
  }
  const recent = releases.slice(0, SHOWN);
  const older = releases.slice(SHOWN);

  return (
    <div className="flex flex-col gap-2" data-testid="releases">
      <span className={SECTION_TITLE}>{releases.length} releases</span>
      <ul className="flex flex-col">
        {recent.map((release) => (
          <ReleaseEntry key={`${release.version}-${release.notes[0]}`} release={release} current={release.version === current} />
        ))}
      </ul>
      {older.length === 0 ? null : (
        <details data-testid="older-releases">
          <summary className="cursor-pointer text-sm font-medium">Older releases ({older.length})</summary>
          <ul className="flex flex-col pt-2">
            {older.map((release) => (
              <ReleaseEntry
                key={`${release.version}-${release.notes[0]}`}
                release={release}
                current={release.version === current}
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
