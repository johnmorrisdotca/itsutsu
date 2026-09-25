import { SECTION_TITLE } from "@/components/ui/ui.constants";
import { currentRelease, type Release } from "@/lib/backlog/releases";

/** How many releases stand open before the rest are folded away. */
const SHOWN = 12;

/**
 * One release: its number, whether it is the edition being served, and what
 * changed. `running` is printed only when it differs from the release's own
 * number — that happens whenever a patch has shipped since, and saying so is
 * more honest than marking 0.64.0 as though nothing had followed it.
 */
/**
 * One release, in UmaKuma's shape (its 1.659.0, 2026-09-24): the number with
 * the date at the right, then the release's title — its first line, which is
 * the `--summary` the release tool was given — on a line of its own, so a
 * phone never cuts the title to fit it beside the number.
 *
 * IT OPENS ONLY WHEN THERE IS MORE TO READ. John asked why an Itsutsu release
 * cannot be opened when an UmaKuma one can: most of ours are one line, and the
 * row already shows it. A patch carrying several fixes has the rest folded
 * under it; a release with nothing more has no arrow, rather than one that
 * opens onto nothing.
 */
function ReleaseEntry({
  release,
  current,
  running,
}: {
  release: Release;
  current: boolean;
  running: string;
}) {
  const [title = "", ...more] = release.notes;
  const row = (
    <>
      <span className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums">{release.version}</span>
        {current ? (
          <span className="min-w-0 truncate rounded-full bg-moss-soft px-2 py-0.5 text-[0.65rem] font-semibold text-moss">
            This edition 現行
          </span>
        ) : null}
        {current && running !== release.version ? (
          <span className="min-w-0 truncate font-mono text-xs text-muted" data-testid="running-version">
            running {running}
          </span>
        ) : null}
        {release.date === null ? null : (
          <span className="ml-auto shrink-0 font-mono text-xs text-muted" data-testid="release-date">
            {release.date}
          </span>
        )}
        {more.length > 0 ? (
          <span aria-hidden="true" className="shrink-0 text-muted transition group-open:rotate-90">
            ›
          </span>
        ) : null}
      </span>
      <span className="text-sm font-medium" data-testid="release-title">
        {title}
      </span>
    </>
  );
  return (
    <li className="border-t border-rule py-2 first:border-t-0" data-testid="release" data-version={release.version}>
      {more.length === 0 ? (
        <div className="flex flex-col gap-0.5">{row}</div>
      ) : (
        <details className="group">
          <summary className="flex cursor-pointer list-none flex-col gap-0.5">{row}</summary>
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

export function Releases({ releases, current }: { releases: Release[]; current: string }) {
  if (releases.length === 0) {
    return (
      <p className="text-sm text-muted" data-testid="releases-empty">
        The release history could not be read.
      </p>
    );
  }
  // Not an exact match: a patch has no entry of its own, so the edition being
  // served is the newest release at or below the running version.
  const marked = currentRelease(releases, current);
  const recent = releases.slice(0, SHOWN);
  const older = releases.slice(SHOWN);

  return (
    <div className="flex flex-col gap-2" data-testid="releases">
      <span className={SECTION_TITLE}>{releases.length} releases</span>
      <ul className="flex flex-col">
        {recent.map((release) => (
          <ReleaseEntry
            key={`${release.version}-${release.notes[0]}`}
            release={release}
            current={release.version === marked}
            running={current}
          />
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
                current={release.version === marked}
                running={current}
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
