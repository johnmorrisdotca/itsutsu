import { SECTION_TITLE } from "@/components/ui/ui.constants";
import { currentRelease, type Release } from "@/lib/backlog/releases";

import { ReleaseEntry } from "./ReleaseEntry";

/** How many releases stand open before the rest are folded away. */
const SHOWN = 12;

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
