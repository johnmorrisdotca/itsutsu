import { Diagram } from "@/components/about/Diagram";
import { EloCurve } from "@/components/about/EloCurve";
import { FigureTable as Table } from "@/components/about/FigureTable";
import { Paired } from "@/components/i18n/Paired";
import type { Speaker } from "@/lib/i18n/i18n";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { ACTIVE_GAME_LIMIT } from "@/lib/history/activeGames";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { MailTo, Out, rich } from "./about.links";
import type { AboutSection } from "./about.constants";
import { ABOUT_CHAPTERS } from "./about.chapters";
import { EXAMPLE_PLAYERS, OPENING_ROWS } from "./about.names.constants";

/** 花月, the direct opening: white beside black, black's third stone on the diagonal. */
const kagetsu = (say: Speaker) => (
  <Diagram
    rows={9}
    cols={9}
    grid="lines"
    label={say.say("about.openings.kagetsuLabel")}
    stones={[
      { row: 4, col: 4, colour: "black", label: "1" },
      { row: 4, col: 5, colour: "white", label: "2" },
      { row: 3, col: 5, colour: "black", label: "3" },
    ]}
    caption={rich(say, "about.openings.kagetsu")}
  />
);

/** Connect Four: the first player's winning first move, and a game a few stones in. */
const connectFour = (say: Speaker) => (
  <Diagram
    rows={6}
    cols={7}
    grid="cells"
    label={say.say("about.drop.label")}
    stones={[
      { row: 5, col: 3, colour: "black", label: "1", ring: true },
      { row: 5, col: 2, colour: "white", label: "2" },
      { row: 4, col: 3, colour: "black", label: "3" },
      { row: 5, col: 4, colour: "white", label: "4" },
      { row: 3, col: 3, colour: "black", label: "5" },
      { row: 2, col: 3, colour: "white", label: "6" },
    ]}
    caption={say.say("about.drop.caption")}
  />
);

const openings = (say: Speaker) => (
  <Table
    head={[
      <Paired key="d" en={say.say("about.openings.direct")} kanji="直接" kanjiClassName="" />,
      "",
      <Paired key="i" en={say.say("about.openings.indirect")} kanji="間接" kanjiClassName="" />,
      "",
    ]}
    rows={OPENING_ROWS.map((row) => [...row])}
    caption={say.say("about.openings.table")}
  />
);

const ladder = (say: Speaker) => {
  const tier = (key: "about.tiers.established" | "about.tiers.provisional" | "about.tiers.unrated", kanji: string) => (
    <Paired en={say.say(key)} kanji={kanji} kanjiClassName="" />
  );
  return (
    <Table
      head={[
        say.say("about.ladder.player"),
        say.say("about.ladder.rating"),
        say.say("about.ladder.games"),
        say.say("about.ladder.tier"),
        say.say("about.ladder.win"),
        say.say("about.ladder.loss"),
        say.say("about.ladder.draw"),
      ]}
      rows={[
        [EXAMPLE_PLAYERS[0], 1712, 31, tier("about.tiers.established", "確定"), 20, 9, 2],
        [EXAMPLE_PLAYERS[1], 1655, 24, tier("about.tiers.established", "確定"), 14, 8, 2],
        [EXAMPLE_PLAYERS[2], 1608, 9, tier("about.tiers.provisional", "仮"), 5, 4, 0],
        [EXAMPLE_PLAYERS[3], 1560, 12, tier("about.tiers.provisional", "仮"), 4, 7, 1],
        [EXAMPLE_PLAYERS[4], "–", 2, tier("about.tiers.unrated", "未定"), 1, 1, 0],
      ]}
      caption={say.say("about.ladder.caption")}
    />
  );
};

/**
 * Ours beside theirs.
 *
 * Two columns rather than a paragraph, because the danger in writing about
 * another site's rules is that a reader takes them for ours. A column heading
 * settles which is which in a way prose cannot: the left is what elo.ts does,
 * the right is what Pente.org's own FAQ says it does.
 */
const ratingRules = (say: Speaker) => (
  <Table
    head={["", say.say("about.rules.here"), "Pente.org"]}
    rows={[
      [say.say("about.rules.provisionalUntil"), say.say("about.rules.provisionalHere"), say.say("about.rules.provisionalThere")],
      [say.say("about.rules.kEstablished"), "20", say.say("about.rules.kEstablishedThere")],
      [say.say("about.rules.kProvisional"), "40", say.say("about.rules.kProvisionalThere")],
      [say.say("about.rules.facing"), say.say("about.rules.facingHere"), say.say("about.rules.facingThere")],
      [say.say("about.rules.floor"), say.say("about.rules.floorHere"), say.say("about.rules.floorThere")],
      [say.say("about.rules.favourite"), say.say("about.rules.favouriteHere"), say.say("about.rules.favouriteThere")],
    ]}
    caption={say.say("about.rules.caption")}
  />
);

const sites = (say: Speaker) => (
  <Table
    head={[
      say.say("about.sites.headSite"),
      say.say("about.sites.headSince"),
      say.say("about.sites.headGames"),
      say.say("about.sites.headFree"),
      say.say("about.sites.headPaid"),
      say.say("about.sites.headRatings"),
    ]}
    rows={[
      [<Out key="iyt" href="https://www.itsyourturn.com/">ItsYourTurn</Out>, say.say("about.sites.iytSince"), say.say("about.sites.iytGames"), say.say("about.sites.iytFree"), say.say("about.sites.iytPaid"), say.say("about.sites.iytRatings")],
      [<Out key="gt" href="https://www.goldtoken.com/">GoldToken</Out>, say.say("about.sites.gtSince"), say.say("about.sites.gtGames"), say.say("about.sites.gtFree"), say.say("about.sites.gtPaid"), say.say("about.sites.gtRatings")],
      [<Out key="lg" href="https://www.littlegolem.net/">Little Golem</Out>, say.say("about.sites.lgSince"), say.say("about.sites.lgGames"), say.say("about.sites.lgFree"), say.say("about.sites.lgPaid"), say.say("about.sites.lgRatings")],
      [<Out key="pente" href="https://pente.org/">Pente.org</Out>, say.say("about.sites.gtSince"), say.say("about.sites.penteGames"), say.say("about.sites.lgFree"), say.say("about.sites.pentePaid"), say.say("about.sites.penteRatings")],
      [<Out key="playok" href="https://www.playok.com/">PlayOK</Out>, say.say("about.sites.playokSince"), say.say("about.sites.playokGames"), say.say("about.sites.lgFree"), say.say("about.sites.playokPaid"), say.say("about.sites.playokRatings")],
    ]}
    caption={say.say("about.sites.caption", { site: SITE_NAME, games: String(RULE_VARIANT_LIST.length), limit: String(ACTIVE_GAME_LIMIT) })}
  />
);

/** The sections added after the founding story: the numbers, the openings, the drop game, and the elders. */
export const ratingsSection = (say: Speaker): AboutSection => ({
  id: "ratings",
  title: say.say("about.ratings.title"),
  chapter: ABOUT_CHAPTERS.numbers,
  kanji: "点数",
  paragraphs: [
    rich(say, "about.ratings.a"),
    rich(say, "about.ratings.b"),
    rich(say, "about.ratings.c"),
    rich(say, "about.ratings.d"),
    rich(say, "about.ratings.e"),
  ],
  figures: { 0: <EloCurve say={say} />, 1: ladder(say), 4: ratingRules(say) },
});

export const openingsSection = (say: Speaker): AboutSection => ({
  id: "openings",
  title: say.say("about.openings.title"),
  chapter: ABOUT_CHAPTERS.roots,
  kanji: "定石",
  paragraphs: [rich(say, "about.openings.a"), rich(say, "about.openings.b"), rich(say, "about.openings.c")],
  figures: { 0: kagetsu(say), 1: openings(say) },
});

export const connectFourSection = (say: Speaker): AboutSection => ({
  id: "connectFour",
  title: say.say("about.drop.title"),
  chapter: ABOUT_CHAPTERS.roots,
  kanji: "四目落とし",
  paragraphs: [rich(say, "about.drop.a"), rich(say, "about.drop.b")],
  figures: { 0: connectFour(say) },
});

export const sitesSection = (say: Speaker): AboutSection => ({
  id: "sites",
  title: say.say("about.sites.title"),
  chapter: ABOUT_CHAPTERS.story,
  kanji: "先達",
  paragraphs: [
    rich(say, "about.sites.a"),
    rich(say, "about.sites.b"),
    rich(say, "about.sites.c"),
    /*
      The one invitation on this page, and every clause is load-bearing
      (board: say-that-we-will-bring-your-record-over). It is done BY HAND,
      ONCE, so it is a snapshot and never a live feed — the player page says
      so under the figures (`SnapshotWarning`). And it is a combined RECORD,
      never a combined RATING: games and wins add across sites, ratings are
      each measured on their own site's scale and are never added. Here and
      not behind the gate, because the people it is for have no account yet.
    */
    rich(say, "about.sites.d", {}, { mail: <MailTo address={CONTACT_ADDRESS} /> }),
    /*
      This sentence names what is ACTUALLY open, and it had to change when
      the rules moved. A game's rules live at /games/<slug>/rules, and /games
      is not open — so naming them here would be the page telling a visitor
      they can read something the gate will turn them away from. Whether the
      rules SHOULD stay publicly readable at their new address is John's to
      decide; until then it says less rather than something untrue.
    */
    rich(say, "about.sites.e"),
  ],
  figures: { 2: sites(say) },
});
