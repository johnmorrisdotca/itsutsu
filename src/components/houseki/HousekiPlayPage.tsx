import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { BoardMasthead } from "@/components/board/BoardMasthead";
import { BoardScaled } from "@/components/board/BoardScaled";
import { GameTrailNav } from "@/components/games/GameTrail";
import { OpenSourceCredit } from "@/components/games/OpenSourceCredit";
import { RulesModal } from "@/components/games/RulesModal";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { currentReader } from "@/lib/auth/currentReader";
import { appearanceFor } from "@/lib/auth/members";
import { housekiRequestKey } from "@/lib/houseki/housekiAddress";
import { housekiRulesPage } from "@/lib/houseki/housekiRulesPage";
import type { HousekiKind, HousekiRequest } from "@/lib/houseki/houseki.types";
import { gamePath, setUpPath } from "@/lib/gomoku/slugs";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

import { HousekiPlay } from "./HousekiPlay";
import { requestWords } from "./housekiWords";

/**
 * /games/<slug>/play for a Houseki game: the game at what the address asks for
 * (`housekiRequestOf`). The server reads what the address asks for and who is
 * here (for the wood the board is drawn on); the game itself is made, played and
 * kept in the browser (`HousekiPlay`).
 */
export async function HousekiPlayPage({ kind, request }: { kind: HousekiKind; request: HousekiRequest }) {
  const say = await currentSpeaker();
  const rules = housekiRulesPage(kind, say);
  const reader = await currentReader();
  const appearance = (await appearanceFor(reader.memberId)) ?? DEFAULT_APPEARANCE;
  return (
    <Page board="play">
      <SiteHeader />
      {/* Just the board's header (`BoardMasthead`), drawn only in that mode. */}
      <div data-bare-only>
        <BoardMasthead story={{ kind: say.say("houseki.card.label"), kanji: rules.kanji, title: rules.title, source: say.say("houseki.play.masthead") }} />
      </div>
      <GameTrailNav
        game={{ label: rules.title, href: gamePath(kind), testId: "play-up" }}
        steps={[{ label: say.say("pset.crumb.setUp"), href: setUpPath(kind) }, { label: requestWords(say, request) }]}
      />
      <BoardScaled>
        <HousekiPlay key={housekiRequestKey(request)} kind={kind} request={request} appearance={appearance} />
      </BoardScaled>
      <footer data-chrome className="border-t border-rule pt-5 text-sm text-muted">
        <p>
          {rules.tagline} <RulesModal rules={{ title: rules.title, kanji: rules.kanji, object: rules.object, board: rules.board, play: rules.play, house: rules.house }} />.
        </p>
        <OpenSourceCredit game={kind} />
      </footer>
    </Page>
  );
}
