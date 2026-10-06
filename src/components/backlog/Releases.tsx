import { SECTION_TITLE } from "@/components/ui/ui.constants";
import { currentRelease, type Release } from "@/lib/backlog/releases";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

import { ReleaseEntry } from "./ReleaseEntry";

/** How many releases stand open before the rest are folded away. */
const SHOWN = 12;

export async function Releases({ releases, current }: { releases: Release[]; current: string }) {
  const say = await currentSpeaker();
  if (releases.length === 0) {
    return (
      <p className="text-sm text-muted" data-testid="releases-empty">
        {say.say("pages.releasesUnreadable")}
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
      <span className={SECTION_TITLE}>{say.count("pages.releases", releases.length)}</span>
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
          <summary className="cursor-pointer text-sm font-medium">{say.say("pages.releasesOlder", { count: say.number(older.length) })}</summary>
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
