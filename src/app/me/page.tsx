import { Paired } from "@/components/i18n/Paired";
import { redirect } from "next/navigation";

import { GameDefaultsForm } from "@/components/mine/GameDefaultsForm";
import { KEEP_FINISHED_DEFAULT } from "@/lib/history/retention";
import { MyPeople } from "@/components/mine/MyPeople";
import { MyRecord } from "@/components/mine/MyRecord";
import { MyXp } from "@/components/mine/MyXp";
import { NameForm } from "@/components/mine/NameForm";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { Page } from "@/components/layout/Page";
import { PhraseSetup } from "@/components/mine/PhraseSetup";
import { ProfileForm } from "@/components/mine/ProfileForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { fetchProfile } from "@/lib/auth/members";
import { gameDefaultsFrom } from "@/components/game/gameDefaults";
import { phraseStatus } from "@/lib/phrase/phraseStore";
import { safeDestination } from "@/lib/auth/redirect";
import { activeTab, type Tab } from "@/lib/ui/tabs";
import { allCountries } from "@/lib/social/countries";

export const metadata = { title: "You" };
export const dynamic = "force-dynamic";

/**
 * The time zones this deployment's Node recognises, for the picker; `PATCH
 * /api/me` checks whatever is actually chosen again regardless, since the
 * control next to it is free text and this is only ever a suggestion list.
 *
 * Computed here, once, on the server — and handed to `ProfileForm` as a prop
 * for the same reason `allCountries()` is. See the comment on `resolveCountry`
 * in `@/lib/social/countries`: a "use client" component re-running this in a
 * visitor's own browser during hydration cannot be trusted to agree with what
 * the server already rendered, because `Intl` does not promise it will.
 */
function supportedTimeZones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}

/*
 * Six things a member comes here for, so the page shows one at a time. They
 * were six panels stacked down one page, and the record — the part somebody
 * comes back to look at rather than sets once — was at the bottom of it.
 *
 * The record is first, because it is the one that is read rather than filled
 * in. The buddies and the ignored share a tab: both are lists of people this
 * member has said something about, the ignored roll is hidden entirely when
 * it is empty, and a tab that comes and goes with a list is a worse page than
 * one tab named for both.
 */
const TABS: Tab[] = [
  { key: "record", label: "Record", kanji: "戦績" },
  /*
   * The XP ledger, second: the other thing on this page that is READ rather
   * than filled in, and the only one of the two that grows every day. 経験 is
   * experience — the word the toasts and the leaderboard use for the same
   * ladder — and it is deliberately not 戦績 beside it, because a record says
   * how well you play and XP says you turned up and tried things. Two ladders,
   * kept apart on purpose; naming them the same thing would undo that.
   */
  { key: "xp", label: "XP", kanji: "経験" },
  { key: "profile", label: "Profile", kanji: "自己紹介" },
  /*
   * The four words, on a tab of their own. They sat at the very bottom of the
   * Profile, under the city and the time zone and the days off — a credential
   * among things other people see about you, and John called it ugly. 合言葉
   * (aikotoba) is a watchword: the words by which somebody else's device
   * recognises you as you, which is exactly what these are for. Third, and
   * not last, so it is still on screen where the strip scrolls on a phone.
   */
  { key: "words", label: "Words", kanji: "合言葉" },
  { key: "games", label: "New games", kanji: "既定" },
  /*
   * 人 rather than 仲間 for the tab: 仲間 is buddies specifically, and this tab
   * holds the buddies, the people shut out, and the way to bring somebody new
   * in — and the buddy roll inside it keeps 仲間 for itself. The directory's
   * own filter says "People 人" for the same set.
   */
  { key: "people", label: "People", kanji: "人" },
];

/**
 * The member's own page: the name others see, the record it has earned, game
 * by game, and the way to bring a friend in. A new member lands here first,
 * with a welcome, because the name is the one thing the site needs to ask.
 */
export default async function MePage({ searchParams }: PageProps<"/me">) {
  const params = await searchParams;
  const me = await currentSession();
  if (!me?.email) redirect("/join?next=%2Fme");

  /*
   * The member's own row, and nothing else, on every visit. Each tab asks for
   * what it alone needs — the record is four queries, and the page used to
   * run all four for somebody who had come to change their time zone.
   */
  const member = await fetchProfile(me.email);
  const name = member?.name ?? me.name ?? "";
  const welcome = params.welcome === "1";
  const next = welcome ? safeDestination(typeof params.next === "string" ? params.next : null) : null;
  const open = activeTab(TABS, params.view);

  /*
   * Read only for the tab that shows it — the same rule the record and the
   * game defaults already follow above. Mapped to the API's own shape rather
   * than the store's (`setAt` as a date, `mayRemovePhrase`), so the client
   * component reads exactly what it would get back from `GET /api/me/phrase`.
   *
   * By id, from `currentMemberId`, and not from `member` above: `MemberProfile`
   * is read by email and does not carry the id, and a phrase is a credential on
   * a specific row — the one thing this must never be tempted to look up by
   * name or address instead.
   */
  const myId = open === "words" ? await currentMemberId() : null;
  const phraseFacts = myId !== null ? await phraseStatus(myId) : null;
  const phraseInitial = {
    set: phraseFacts?.set ?? false,
    setAt: phraseFacts?.setAt?.toISOString() ?? null,
    hasEmail: phraseFacts?.hasEmail ?? true,
    mayRemove: phraseFacts?.mayRemovePhrase ?? false,
  };

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      {welcome ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-2 border-moss/50 bg-moss-soft`} data-testid="welcome">
          <h1 className="flex items-baseline gap-2 text-lg font-semibold">
            <Paired en="Welcome" kanji="ようこそ" kanjiClassName="text-sm font-normal opacity-70" />
          </h1>
          <p className="text-sm text-ink-soft">
            You are in. One question before the board: what should the other players call you? Google&apos;s name is
            filled in; change it if you like.
          </p>
        </section>
      ) : null}

      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <div className="flex items-center gap-3">
          {member?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element -- a Google avatar
            <img src={member.picture} alt="" className="size-12 rounded-full" referrerPolicy="no-referrer" />
          ) : null}
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold" data-testid="me-name">{name || "Unnamed"}</h1>
            <span className="text-xs text-muted">{me.email}</span>
          </div>
        </div>
        <NameForm initial={name} next={next} />
      </section>

      {/*
        Nothing else during the welcome. A new member is asked one question —
        what to call them — and a row of tabs under it is the rest of the site
        arriving before they have answered.
      */}
      {welcome ? null : (
        <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
          <Tabs tabs={TABS} active={open} base="/me" label="Which part of your account" />

          {open === "record" ? <MyRecord name={name} /> : null}

          {/*
            The ledger. Handed the address and nothing else: the total and the
            level ride `memberRowFor`, which this render has already run and
            cached, so the standing costs no query and the level is a lookup over
            the curve. `fetchProfile`'s row above could not answer it —
            `MemberProfile` is declared over a session-shaped `Member` that knows
            nothing about XP — and that is worth knowing before reaching for it.
          */}
          {open === "xp" ? <MyXp email={me.email} params={params} /> : null}

          {open === "profile" ? (
            <div className="flex flex-col gap-3" data-testid="my-profile">
              <ProfileForm
                initial={{
                  awayFrom: member?.awayFrom ? member.awayFrom.toISOString().slice(0, 10) : "",
                  awayUntil: member?.awayUntil ? member.awayUntil.toISOString().slice(0, 10) : "",
                  city: member?.city ?? "",
                  country: member?.country ?? "",
                  timeZone: member?.timeZone ?? "",
                  bio: member?.bio ?? "",
                  showOnline: member?.showOnline ?? true,
                  emailNotify: member?.emailNotify ?? true,
                  keepFinishedDays: member?.keepFinishedDays ?? KEEP_FINISHED_DEFAULT,
                  daysOff: member?.daysOff ?? [],
                }}
                countries={allCountries()}
                timeZones={supportedTimeZones()}
              />
            </div>
          ) : null}

          {open === "words" && myId !== null ? <PhraseSetup initial={phraseInitial} /> : null}

          {open === "games" ? (
            <div className="flex flex-col gap-3" data-testid="game-defaults-panel">
              {/*
                A line rather than a heading. The tab is already called "New
                games 既定"; what it does not say is that these hold across
                every device somebody signs in on, which is the whole reason
                for setting them here rather than on each board.
              */}
              <p className="text-sm text-muted">
                What a new board is set out with, here and on every device you sign in on.
              </p>
              <GameDefaultsForm initial={gameDefaultsFrom(member?.gameDefaults)} />
            </div>
          ) : null}

          {open === "people" ? <MyPeople email={me.email} /> : null}
        </section>
      )}
    </Page>
  );
}
