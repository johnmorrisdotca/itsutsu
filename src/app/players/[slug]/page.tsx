import { notFound, redirect } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CountryMark } from "@/components/players/CountryMark";
import { MemberKindBadge } from "@/components/auth/MemberKindBadge";
import { memberKind } from "@/lib/auth/memberKind";
import { SnapshotWarning, WholeRecordPanel } from "@/components/players/WholeRecord";
import { wholeRecord } from "@/lib/legacy/wholeRecord";
import { Whereabouts } from "@/components/players/Whereabouts";
import { ItsutsuRecord } from "@/components/players/ItsutsuRecord";
import { KEPT_RECORD_COPY, PlayedEverywhere } from "@/components/players/LegacyRecord";
import { LegacySourcePanel } from "@/components/players/LegacySource";
import { Figures } from "@/components/ui/Figures";
import { Tabs } from "@/components/ui/Tabs";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { findMemberById, findMemberByName, findMembersByNames } from "@/lib/auth/members";
import { currentSession } from "@/lib/auth/currentSession";
import { PlayerActions } from "@/components/players/PlayerActions";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { fetchBuddies } from "@/lib/social/buddies";
import { ignoredEmails } from "@/lib/social/ignores";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
import { fetchTimeGiftRecord } from "@/lib/history/timeGifts";
import { findLegacyPlayer, foldedInto, legaciesForName } from "@/lib/legacy/legacyPlayers.data";
import { ITSUTSU_TAB, legacyTabs } from "@/lib/legacy/legacyTabs";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { PlayedFigure, RecordFigure } from "@/components/players/PlayerRecord";
import { GameCount } from "@/components/games/GameCount";
import { figuresOf, winRateText } from "@/lib/rating/figures";
import { playerKey, playerKeysFromSlug } from "@/lib/rating/playerKey";
import { shownName } from "@/lib/rating/shownName";
import { RECORD_SCOPES, SCOPE_PARAM, readRecordScope, scopeWorthAsking } from "@/lib/rating/recordScope";
import { RecordScopeBar } from "@/components/players/RecordScopeBar";
import { fetchPlayer } from "@/lib/rating/players";
import { RATING_POOLS } from "@/lib/rating/pools";
import { ratingShown } from "@/lib/rating/shownRecord";
import { activeTab, type Tab } from "@/lib/ui/tabs";

export const metadata = { title: "Player" };

export default async function PlayerPage({ params, searchParams }: PageProps<"/players/[slug]">) {
  const { slug } = await params;
  const asked = await searchParams;
  const view = asked.view;
  const scope = readRecordScope(asked[SCOPE_PARAM]);

  const legacyBySlug = findLegacyPlayer(slug);
  /*
   * A folded record has no page of its own — one person, one page. Its
   * contents are not gone: they are a tab on the live member's page, which is
   * where this sends anybody who still has the old address, rather than
   * leaving them at a second page with the same name at the top of it.
   */
  if (legacyBySlug !== null) {
    const home = foldedInto(legacyBySlug);
    if (home !== null) redirect(home);
  }
  /*
   * The address holds a folded name with hyphens for spaces, and folding
   * cannot be undone: "anne-marie" is either one hyphenated name or two
   * words. So both readings are looked for, and whichever finds somebody is
   * the player this address means.
   */
  /*
   * AN ID FIRST, A NAME AFTER. Every link to a person now builds
   * `/players/<id>` — see `playerPath` — because a link built from the name
   * put a member's whole surname in the markup of every page that named them,
   * under a screen that was carefully showing only "Hanako M.".
   *
   * The name reading stays underneath and is not a fallback in the apologetic
   * sense: a kept record from another site, or a name typed into a game at one
   * screen, has no member and its address is its name. Both are real addresses
   * and this resolves either.
   */
  const byId = await findMemberById(slug);
  const looked = byId !== null
    ? [
        await (async () => {
          const key = playerKey(byId.name);
          const [player, record] = await Promise.all([
            fetchPlayer(key, byId.id ?? null),
            fetchPlayerRecord(key, byId.id ?? null),
          ]);
          return { key, player, record, member: byId };
        })(),
      ]
    : await Promise.all(
    playerKeysFromSlug(slug).map(async (key) => {
      /*
       * The MEMBER is looked up first and the record is then asked for as
       * theirs. A rating and a record are keyed by the folded name they were
       * earned under, and that name does not move when somebody renames — so
       * asking by today's name alone answered zero for a member with seven
       * games. The member is findable by their current name; everything else
       * hangs off their id from here.
       */
      const member = await findMemberByName(key);
      const [player, record] = await Promise.all([
        fetchPlayer(key, member?.id ?? null),
        fetchPlayerRecord(key, member?.id ?? null),
      ]);
      return { key, player, record, member };
    }),
  );

  const found =
    looked.find((one) => one.player !== null || one.record.games > 0 || one.member !== null) ?? looked[0];
  const { key: decoded, player, record, member } = found;
  const gifts = await fetchTimeGiftRecord(decoded);
  /*
   * Who is reading, and what they have already said about this player. The
   * directory knows both and the page a directory row leads to did not, which
   * is why it could offer nothing.
   */
  const me = await currentSession();
  const [myBuddies, myIgnored] = await Promise.all([
    me?.email ? fetchBuddies(me.email) : Promise.resolve([]),
    me?.email ? ignoredEmails(me.email) : Promise.resolve(new Set<string>()),
  ]);
  // A member has a page from the day they join, before they have finished a
  // game: every list that prints their name links to it, and a link that
  // leads nowhere is worse than no page.
  const hasLiveData = player !== null || record.games > 0 || member !== null;
  /*
   * Every record kept under this name, however it is attached.
   *
   * One lookup where there were three, and that is the reshape rather than a
   * tidy-up. A record from before this site used to arrive by two different
   * routes — pointing at a live member, or carrying the person's own name —
   * and each caller remembered whichever route it had been written for. The
   * directory knew one and read Chibi as nought; this page knew both, and paid
   * for it by being two pages.
   */
  const linked = legaciesForName(decoded);
  /*
   * A record somebody is remembered BY rather than one they brought with them.
   * The only thing about them the page still treats differently, and only
   * because it is true: nobody is on the other end of it.
   */
  const keptRecord = linked.find((one) => one.kind !== "elsewhere") ?? null;

  if (!hasLiveData && linked.length === 0) notFound();

  /*
   * Whether there is anybody here to ask. A kept record has no address and no
   * id — Chibi never signed in — so there is nobody on the other end of an
   * invitation, and offering one would be offering a game that cannot happen.
   */
  const askable =
    Boolean(me?.email) &&
    me?.email !== member?.email &&
    (member?.botTier ? member.id !== undefined : Boolean(member?.email));

  /*
   * The name this page is about, decided once. It is what the heading prints
   * and what every count under it filters the record by, and those two
   * drifting apart would be a page whose links quietly ask about somebody
   * else.
   */
  const wholeName = player?.name ?? member?.name ?? keptRecord?.name ?? decoded;
  /*
   * Who the recent opponents are, in one query rather than one per row, and
   * only for a reader who could act on the answer. "Every opponent you are
   * shown offers what you would want to do about them" is on this repo's own
   * checklist, and this list named ten people and offered nothing about any
   * of them.
   */
  const opponents = me?.email
    ? {
        members: await findMembersByNames(record.recent.map((one) => one.opponent)),
        buddies: new Set(myBuddies.map((buddy) => buddy.email).filter((one): one is string => Boolean(one))),
        ignored: myIgnored,
        mine: me.email,
        signedIn: true,
      }
    : undefined;
  const tier = player === null ? null : TIER_DISPLAY[player.tier];
  /*
   * THE SAME RULE `Directory.tsx` APPLIES TO THE SAME PROFILE. `player.rating`
   * is the people-pool column alone, and it defaults to the untouched schema
   * value the moment nobody has settled it — every one of the seven computer
   * players printed "Rating 1600" beside their real computer-pool figure,
   * because none of them has ever played a person-versus-person game.
   * `ratingShown` is silence where nothing has been earned, and falls back to
   * the computer rating, marked, where that is the only one there is.
   */
  const rating = ratingShown(player);
  const figures = figuresOf({ won: record.wins, lost: record.losses, drawn: record.draws });
  const whole = wholeRecord(linked, { won: record.wins, lost: record.losses, drawn: record.draws });

  /*
   * One tab per site somebody played on, and this site is one of them.
   *
   * Ordered by what they have rather than by what sort of row they are. A
   * person who has played here opens on that, because it is the live chapter
   * and the one another member came to read; a person who never did opens on
   * the sites where their playing actually happened, rather than on an empty
   * table with their real record a click away.
   *
   * That used to be the difference between two page components — a kept record
   * had its own, with the order reversed. It is one line of ordering, which is
   * all it ever was.
   */
  const elsewhere = legacyTabs(linked);
  const tabs: Tab[] =
    record.games > 0 || elsewhere.length === 0
      ? [ITSUTSU_TAB, ...elsewhere]
      : [...elsewhere, ITSUTSU_TAB];
  const open = activeTab(tabs, view);
  const shown = elsewhere.find((tab) => tab.key === open) ?? null;

  /*
   * How much the headline figures are counting, and whether asking is worth
   * anything here. Independent of which tab is open: which chapter somebody is
   * reading is a different question from how much the summary above it counts,
   * and answering one by resetting the other loses their place.
   */
  const openTab = open === ITSUTSU_TAB.key ? undefined : open;
  const offered = scopeWorthAsking(whole.sources.length);
  const counted = offered && scope === RECORD_SCOPES.everywhere ? whole.figures : figures;

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="player-profile">
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          {shownName(wholeName)}
          {/*
            Where they are, said in full here because there is room for it —
            the directory has only the flag. The profile form has promised
            this for a long time and never showed it anywhere.
          */}
          <CountryMark
            country={member?.country}
            className="text-sm font-normal text-muted"
            showName
          />
          {/*
            The same badge the members list draws, rather than a second one
            worded differently for the same fact. It was a separate badge on a
            separate page, which is how "Remembered" and "KEPT RECORD" came to
            be two names for one thing.
          */}
          <MemberKindBadge
            kind={memberKind({
              email: member?.email ?? null,
              botTier: member?.botTier ?? null,
              unclaimableBecause: member?.unclaimableBecause ?? null,
              legacyKind: keptRecord?.kind ?? null,
            })}
          />
        </h1>
        {/*
          Where their playing happened, for somebody whose record was made
          before this site existed. It says the handles and the years, because
          that is how a reader checks a record they are being shown — and it
          stays out of the tabs so that a reader on the GoldToken tab can still
          see there is an ItsYourTurn chapter without moving.
        */}
        {keptRecord === null ? null : (
          <p className="text-sm text-muted" data-testid="kept-record-note">
            {keptRecord.location !== undefined ? `${keptRecord.location} · ` : ""}
            <PlayedEverywhere legacy={keptRecord} lead="Played as" />.{" "}
            {KEPT_RECORD_COPY[keptRecord.kind]?.tail ??
              "From before Itsutsu — kept alongside whatever they have since earned here."}
          </p>
        )}
        <Whereabouts city={member?.city} timeZone={member?.timeZone} />
        <PlayerActions
          email={member?.email ?? null}
          memberId={member?.id}
          isBuddy={myBuddies.some((buddy) => buddy.email === member?.email)}
          ignoring={member?.email !== null && member?.email !== undefined && myIgnored.has(member.email)}
          isComputer={Boolean(member?.botTier)}
          isYou={me?.email !== undefined && me.email !== null && me.email === member?.email}
          signedIn={Boolean(me?.email)}
        />
        {/*
          What somebody says about themselves. Written into the profile form
          since the form existed and shown on no page at all — including the
          computer players', whose bios explain what each of them
          actually does and were readable only in the source.
        */}
        {(member?.bio ?? "").trim() !== "" ? (
          <p className="max-w-prose text-sm whitespace-pre-line text-ink-soft" data-testid="player-bio">
            {member?.bio}
          </p>
        ) : null}
        {/*
          Two ratings, side by side, because there are two pools and hiding
          one behind the other is how a number stops meaning anything. The
          ladder rating is what somebody has earned against people; the
          computer one is earned against the programs and never touches
          it, which is the whole point of keeping them apart.

          Played and the record beside them count every finished game, of
          either kind — including a game somebody played against themselves,
          which is a game that happened and is not a game that counts. The
          note under the row says so rather than leaving the arithmetic to be
          reverse-engineered.
        */}
        {/*
          Which of somebody's playing the row below is counting. Everywhere by
          default: four thousand games on ItsYourTurn and twenty here is a life
          of playing, and leading with the twenty tells the smaller truth
          first. Drawn only where there is another site to count — otherwise
          the two answers are the same games.
        */}
        {offered ? <RecordScopeBar base={`/players/${slug}`} view={openTab} scope={scope} /> : null}
        <Figures
          testId="player-figures"
          figures={[
            {
              label: "Rating",
              value: (
                <>
                  {rating === null ? "—" : rating.rating}
                  {rating?.pool === RATING_POOLS.computer ? (
                    <span
                      className="ml-1 font-mincho text-[0.68rem] font-normal opacity-70"
                      title="Earned against the computer players, which are rated in a pool of their own."
                      data-testid="player-rating-computer"
                    >
                      機械
                    </span>
                  ) : null}
                </>
              ),
              testId: "player-rating",
            },
            ...(player !== null && player.computer.ratedGames > 0
              ? [{ label: "Vs computer", value: player.computer.rating, testId: "player-computer-rating" }]
              : []),
            /*
              Counting everywhere means counting games this site never saw, so
              those two figures lead nowhere; counting here means every one of
              them is a way into the games behind it. `here` carries that,
              rather than the page having two versions of the same row.
            */
            {
              label: "Played",
              value: (
                <PlayedFigure
                  record={{ wins: counted.won, losses: counted.lost, draws: counted.drawn }}
                  of={{ player: wholeName, here: !(offered && scope === RECORD_SCOPES.everywhere) }}
                />
              ),
              testId: "player-played",
            },
            {
              label: "Won · Lost · Drawn",
              value: (
                <RecordFigure
                  record={{ wins: counted.won, losses: counted.lost, draws: counted.drawn }}
                  of={{ player: wholeName, here: !(offered && scope === RECORD_SCOPES.everywhere) }}
                />
              ),
              testId: "player-record",
            },
            { label: "Win rate", value: winRateText(counted.winRate) },
          ]}
        />
        {offered && scope === RECORD_SCOPES.everywhere ? (
          <p className="text-xs text-muted" data-testid="counting-everywhere">
            {/*
              The ratings do NOT follow the scope and must not. Games and wins
              add up across sites; ratings do not — another site's is on
              another scale, against other players, and was never converted.
              Saying so here is cheaper than letting somebody read a rating as
              covering four thousand games it never saw.
            */}
            Counting every site, {whole.sources.length} of them, listed below. The ratings are
            Itsutsu&rsquo;s own: a rating earned elsewhere is on another scale and does not add.
          </p>
        ) : null}
        {/*
          Beside the figure it is about, not below the fold. Combined is what
          this page leads with now, so the warning that half of it was copied
          down by hand once and does not move has to lead with it — left where
          it was, it would have become fine print without anybody deciding to
          make it fine print.
        */}
        {offered && scope === RECORD_SCOPES.everywhere && whole.kept ? <SnapshotWarning /> : null}
        {player !== null && player.computer.ratedGames > 0 ? (
          <p className="text-xs text-muted" data-testid="two-pools">
            Played and the record beside it count every finished game. The ratings are kept in two:{" "}
            <GameCount count={player.ratedGames} player={wholeName} pool={RATING_POOLS.people} rated="yes"
              className="font-medium text-ink-soft" title="Rated games against other people" testId="player-rated-people" />{" "}
            against people, and{" "}
            <GameCount count={player.computer.ratedGames} player={wholeName} pool={RATING_POOLS.computer} rated="yes"
              className="font-medium text-ink-soft" title="Rated games against the computer players" testId="player-rated-computer" />{" "}
            against the computer players. A game against a program never moves where you stand among the people, and
            a game against yourself counts as neither.
          </p>
        ) : null}
        {tier !== null ? (
          <p className="text-xs text-muted">
            <span className="font-medium text-ink-soft">{tier.label}</span>{" "}
            <span className="font-mincho">{tier.kanji}</span> · {tier.note}
          </p>
        ) : null}
        {linked.length > 0 ? (
          <p className="text-sm text-muted" data-testid="legacy-elsewhere">
            {linked.map((legacy) => (
              <PlayedEverywhere key={legacy.slug} legacy={legacy} lead="Also played as" />
            ))}
            . Kept from before Itsutsu, in its own tab.
          </p>
        ) : null}
      </section>

      {/*
        Everything they have played, wherever they played it — beside the
        tabs rather than instead of them, so a life of playing shows as one
        figure and still breaks down into where each part came from.
      */}
      {whole.figures.played > 0 ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
          <WholeRecordPanel
            whole={whole}
            name={wholeName}
            showFigures={!(offered && scope === RECORD_SCOPES.everywhere)}
          />
        </section>
      ) : null}

      <Tabs tabs={tabs} active={open} base={`/players/${slug}`} label="Where this player's record was kept" />

      {shown === null ? (
        <>
          <ItsutsuRecord
            name={wholeName}
            record={record}
            opponents={opponents}
            gifts={gifts}
            /*
             * "No games yet" is the wrong word about somebody who has died,
             * in the one place it would be noticed. Their own wording says
             * this record was made elsewhere and is kept rather than added to.
             */
            emptyNote={keptRecord === null ? undefined : KEPT_RECORD_COPY[keptRecord.kind]?.here}
          />
          {/*
            The second way in, and the one somebody actually uses. A profile is
            read downwards — the figures, then the games, then how each went —
            and by the end the buttons at the top are off the screen. The
            decision is made here, so the offer belongs here; the elder sites
            put an invitation beside a player's games for the same reason.

            Only where there is a record to have read. On a page with no games
            the question answers itself, and the two offers sit an inch apart —
            one offer too many, about nothing.
          */}
          {askable && record.games > 0 ? (
            <p className="flex flex-wrap items-center gap-3 text-sm text-muted" data-testid="ask-after-record">
              Seen enough?{" "}
              {/*
                ONE OFFER, TWO WORDINGS. It was two components because a game
                against a program had to be asked for by id and a game against a
                person by address — and that was never a real difference, only
                the shape the creation route happened to take. Everything is
                asked for by id now, so the branch is a choice of words: "Play"
                is right about something that answers at once, and asking a
                person for a game is asking.

                And it leads to the setup screen rather than into a game, which
                is the whole of this change and the very button John was looking
                at when he asked for it a third time.
              */}
              {member === undefined || member === null ? null : (
                <ChallengeButton
                  memberId={member.id}
                  label={member.botTier ? "Play 対局" : "Ask for a game 対局を申し込む"}
                />
              )}
            </p>
          ) : null}
        </>
      ) : (
        <LegacySourcePanel legacy={shown.legacy} source={shown.source} keptFor={shown.legacy.slug} />
      )}
    </Page>
  );
}
