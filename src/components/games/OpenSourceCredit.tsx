import { OPEN_SOURCE_PACKAGES, openSourceOf, openSourceVersion, type OpenSourcePackage } from "@/lib/catalogue/openSource";
import type { GameKey } from "@/lib/catalogue/gameKeys";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { weave } from "@/lib/i18n/weave";

/**
 * A GAME'S OPEN-SOURCE PACKAGE, said quietly: "Runs on Kyuubu 1.5.0, open
 * source", the name leading to its repository. Under a game's board and on its
 * rules page, for a game a package plays; nothing for one whose rules are this
 * site's own.
 */
export async function OpenSourceCredit({ game, pkg }: { game?: GameKey; pkg?: OpenSourcePackage }) {
  const which = pkg ?? (game === undefined ? null : openSourceOf(game));
  if (which === null) return null;
  const say = await currentSpeaker();
  const { name, repo } = OPEN_SOURCE_PACKAGES[which];
  const version = openSourceVersion(which);
  return (
    <p className="text-xs text-muted" data-testid="open-source" data-package={which} data-version={version ?? ""}>
      {weave(say.say("gamepages.openSourceCredit"), {
        package: (
          <a href={repo} className="underline underline-offset-2 hover:text-ink">
            {name}
            {version === null ? "" : ` ${version}`}
          </a>
        ),
      })}
    </p>
  );
}
