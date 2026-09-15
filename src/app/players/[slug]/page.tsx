import { notFound, redirect } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CountryMark } from "@/components/players/CountryMark";
import { MemberKindBadge } from "@/components/auth/MemberKindBadge";
import { MemberLevel } from "@/components/xp/MemberLevel";
import { memberKind } from "@/lib/auth/memberKind";
import { SnapshotWarning } from "@/components/players/WholeRecord";
import { wholeRecord } from "@/lib/legacy/wholeRecord";
import { Whereabouts } from "@/components/players/Whereabouts";
import { PlayerChapters } from "@/components/players/PlayerChapters";
import { PlayedEverywhere, keptRecordTail } from "@/components/players/LegacyRecord";
import { PlayerFigures } from "@/components/players/PlayerFigures";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { findMembersByNames } from "@/lib/auth/members";
import { currentReader } from "@/lib/auth/currentReader";
import { PlayerActions } from "@/components/players/PlayerActions";
import { buddyMemberIds } from "@/lib/social/buddies";
import { ignoredMemberIds } from "@/lib/social/ignores";
import { fetchTimeGiftRecord } from "@/lib/history/timeGifts";
import { findLegacyPlayer, foldedInto, legaciesForName } from "@/lib/legacy/legacyPlayers.data";
import { ITSUTSU_TAB, legacyTabs } from "@/lib/legacy/legacyTabs";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { TwoPools } from "@/components/players/TwoPools";
import { figuresOf } from "@/lib/rating/figures";
import { lookUpPlayer } from "@/lib/rating/playerPageLookup";
import { shownName } from "@/lib/rating/shownName";
import { RECORD_SCOPES, SCOPE_PARAM, readRecordScope, scopeWorthAsking } from "@/lib/rating/recordScope";
import { RecordScopeBar } from "@/components/players/RecordScopeBar";
import { ratingShown, tierShown } from "@/lib/rating/shownRecord";
import { activeTab, type Tab } from "@/lib/ui/tabs";
import { importedFactsFor } from "@/lib/xp/importedRecipients";
import { xpForBadge } from "@/lib/xp/xpScope";
import Link from "next/link";
import { XP_HISTORY_TAB_ENTRY, xpHistoryHref } from "@/lib/xp/xpHistoryDays";

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
   * Who this address names — by id first, then by either reading of a folded
   * name — with their rating row and their record. `lookUpPlayer` holds the
   * argument for that order.
   */
  const { key: decoded, player, record, member } = await lookUpPlayer(slug);
  const gifts = await fetchTimeGiftRecord(decoded);
  /*
   * Who is reading, and what they have already said about this player. The
   * directory knows both and the page a directory row leads to did not, which
   * is why it could offer nothing.
   */
  const reader = await currentReader();
  /*
   * BY MEMBER ID. The lists are kept by address and read with it, but whether
   * this player is on them — and whether this player is the reader — is decided
   * by id: an invite holder has no address, and an address is only how somebody
   * signs in, never who they are.
   */
  const mine = reader.hasAccount ? reader.email : null;
  const [myBuddies, myIgnored] = await Promise.all([
    mine === null ? Promise.resolve(new Set<string>()) : buddyMemberIds(mine),
    mine === null ? Promise.resolve(new Set<string>()) : ignoredMemberIds(mine),
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
    reader.hasAccount &&
    member?.id !== reader.memberId &&
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
  const opponents = reader.hasAccount
    ? {
        members: await findMembersByNames(record.recent.map((one) => one.opponent)),
        buddies: myBuddies,
        ignored: myIgnored,
        me: reader.memberId,
        canAsk: reader.hasAccount,
      }
    : undefined;
  /*
   * THE SAME RULE `Directory.tsx` APPLIES TO THE SAME PROFILE. `player.rating`
   * is the people-pool column alone, and it defaults to the untouched schema
   * value the moment nobody has settled it — every one of the seven computer
   * players printed "Rating 1600" beside their real computer-pool figure,
   * because none of them has ever played a person-versus-person game.
   * `ratingShown` is silence where nothing has been earned, and falls back to
   * the computer rating, marked, where that is the only one there is.
   *
   * AND THE TIER COMES FROM THE SAME POOL. `player.tier` is the people pool's
   * alone, so every program read "Unrated · Fewer than four rated games"
   * beside a computer-pool figure the Computers tab called Provisional.
   * `tierShown` is the tier of whichever pool the figure came from, and
   * unrated where there is no figure — which still says why.
   */
  const rating = ratingShown(player);
  const tier = player === null ? null : TIER_DISPLAY[tierShown(player)];
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
  const sites: Tab[] =
    record.games > 0 || elsewhere.length === 0
      ? [ITSUTSU_TAB, ...elsewhere]
      : [...elsewhere, ITSUTSU_TAB];
  /*
   * AND HOW THEIR XP WAS EARNED, last. John: "there is NO indication how I got
   * my XP". A tab rather than another panel down a long page, and only where a
   * member row exists to have earned anything — a person's or a program's.
   */
  const earner = member?.id ?? null;
  const tabs: Tab[] = earner === null ? sites : [...sites, XP_HISTORY_TAB_ENTRY];
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
        {/*
          THE NAME, AT THE SIZE A PAGE ABOUT A PERSON DESERVES. John asked for
          "a better header with the Name of the person, Stats/Record and XP +
          XP level Name", and the name led that list: it is the size a game's
          own page gives its title, above the record and the standing below.
        */}
        <h1 className="flex flex-wrap items-baseline gap-2 text-2xl font-semibold">
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
            {/*
              NOT the unconditional "never played on Itsutsu" this used to
              say — Chibi and Kyokosan share one real, finished game here,
              found by name because neither seat has a memberId, and the old
              copy said there was nothing to find on the very page about to
              show it. `record.games` is already read above for that table;
              this asks it the same question rather than assuming the answer.
            */}
            {keptRecordTail(keptRecord.kind, record.games)}
          </p>
        )}
        <Whereabouts city={member?.city} timeZone={member?.timeZone} />
        <PlayerActions
          email={member?.email ?? null}
          memberId={member?.id}
          isBuddy={member?.id !== undefined && myBuddies.has(member.id)}
          ignoring={member?.id !== undefined && myIgnored.has(member.id)}
          isComputer={Boolean(member?.botTier)}
          isYou={member?.id !== undefined && member.id === reader.memberId}
          canAsk={reader.hasAccount}
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
          Which of somebody's playing the row below is counting. Everywhere by
          default: four thousand games on ItsYourTurn and twenty here is a life
          of playing, and leading with the twenty tells the smaller truth
          first. Drawn only where there is another site to count — otherwise
          the two answers are the same games.
        */}
        {offered ? <RecordScopeBar base={`/players/${slug}`} view={openTab} scope={scope} /> : null}
        {/*
          The figures: the two pools' ratings, then played, the record and the
          rate, over whichever games the scope above says. Played and the
          record count every finished game, of either kind — including a game
          somebody played against themselves, which is a game that happened
          and is not a game that counts. `here` says whether those games are
          on this site to be opened, rather than the page having two versions
          of the same row; `PlayerFigures` has the rest of the argument.
        */}
        <PlayerFigures
          rating={rating}
          computer={player === null ? null : player.computer}
          counted={counted}
          of={{ player: wholeName, memberId: member?.id, here: !(offered && scope === RECORD_SCOPES.everywhere) }}
        />
        {/*
          THEIR STANDING, UNDER THE RECORD AND AS PROMINENT AS IT. The name,
          then the record, then the level and the XP — John's order for this
          header. It was a badge on the name's line; it is a block now, and
          `MemberLevel` holds the one argument about when there is nothing to
          draw: `undefined` is a kept record with no member row and is not a
          nought. A program's page draws it like anyone's — John: "i still
          don't see Levels for all equally and bots don't have XP".
        */}
        {/*
          The badge's total — Everywhere, other sites' credit included — decided
          in one place (`xpForBadge`), with the line saying how much of it came
          from elsewhere. A lookup that did not read both totals draws nothing
          rather than a guess.
        */}
        <MemberLevel
          xp={member?.xp === undefined || member.xpEverywhere === undefined ? undefined : xpForBadge({ xp: member.xp, xpEverywhere: member.xpEverywhere })}
          imported={member === null || member.xpImported === undefined ? null : importedFactsFor(member.name, member.xpImported)}
        />
        {earner === null ? null : (
          <Link href={xpHistoryHref(`/players/${slug}`, new URLSearchParams(), null)} className="self-start text-xs underline underline-offset-4" data-testid="xp-history-link">
            How this XP was earned
          </Link>
        )}
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
          <TwoPools name={wholeName} memberId={member?.id} profile={player} />
        ) : null}
        {tier !== null ? (
          <p className="text-xs text-muted" data-testid="player-tier">
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
        Everything below the header: the whole record across every site, the
        tabs, and the chapter the tabs have open — see `PlayerChapters`. Every
        decision it draws is made above.
      */}
      <PlayerChapters
        slug={slug}
        whole={whole}
        showWholeFigures={!(offered && scope === RECORD_SCOPES.everywhere)}
        wholeName={wholeName}
        member={member}
        tabs={tabs}
        open={open}
        shown={shown}
        earner={earner}
        reader={reader}
        asked={asked}
        record={record}
        opponents={opponents}
        gifts={gifts}
        keptRecord={keptRecord}
        askable={askable}
      />
    </Page>
  );
}
