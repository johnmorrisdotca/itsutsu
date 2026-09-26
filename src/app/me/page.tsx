import { redirect } from "next/navigation";

import { GameDefaultsForm } from "@/components/mine/GameDefaultsForm";
import { KEEP_FINISHED_DEFAULT } from "@/lib/history/retention";
import { KeepThisAccount } from "@/components/mine/KeepThisAccount";
import { MyPeople } from "@/components/mine/MyPeople";
import { MyRecord } from "@/components/mine/MyRecord";
import { MyXp } from "@/components/mine/MyXp";
import { NameForm } from "@/components/mine/NameForm";
import { AgeBandForm } from "@/components/mine/AgeBandForm";
import { AGE_COPY } from "@/components/mine/mine.constants";
import { ageBandOf } from "@/lib/auth/ageBandStore";
import { isAgeBand } from "@/lib/social/ageBand";
import { isChild } from "@/lib/social/childRules";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { PageTitle, SectionHeading } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { PhraseSetup } from "@/components/mine/PhraseSetup";
import { DayZoneNote } from "@/components/mine/DayZoneNote";
import { ProfileForm, type ProfileFields } from "@/components/mine/ProfileForm";
import { SettingsForm } from "@/components/mine/SettingsForm";
import { RemoveAccount } from "@/components/mine/RemoveAccount";
import { WhatWeHold } from "@/components/mine/WhatWeHold";
import { signedInRecently } from "@/lib/auth/removeAccountRules";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { currentMemberRow, currentSession } from "@/lib/auth/currentSession";
import { fetchProfile } from "@/lib/auth/members";
import { isGoogleAuthConfigured } from "@/lib/auth/google";
import { PLAYER_SESSION_DAYS } from "@/lib/auth/session";
import { gameDefaultsFrom } from "@/components/game/gameDefaults";
import { phraseStatus } from "@/lib/phrase/phraseStore";
import { safeDestination } from "@/lib/auth/redirect";
import { activeTab, type Tab } from "@/lib/ui/tabs";
import { allCountries } from "@/lib/social/countries";
import { TurnFlowForm } from "@/components/mine/TurnFlowForm";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { NOTICES } from "@/lib/mail/mail.constants";
import { mailKindsFrom } from "@/lib/mail/mailStop";
import { WelcomeMail } from "@/components/mine/WelcomeMail";

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
  /*
   * HOW THE SITE BEHAVES FOR YOU, where Profile is who you are: the pair the
   * account menu on both sites names (the privacy plan's menu contract). It
   * took in the "New games" tab — a board's defaults and how a turn works are
   * settings too — and the holiday, days off, email and retention that sat at
   * the foot of the Profile form.
   */
  { key: "settings", label: "Settings", kanji: "設定" },
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
 *
 * ANY MEMBER, BY ID. It sent anybody without an address back to the door —
 * which was everybody who came in with an invite code, who then had nowhere to
 * choose a name, set a board or see their XP.
 */
export default async function MePage({ searchParams }: PageProps<"/me">) {
  const params = await searchParams;
  const [me, row] = await Promise.all([currentSession(), currentMemberRow()]);
  if (me === null || row === null) redirect("/join?next=%2Fme");

  /*
   * The member's own row, and nothing else, on every visit. Each tab asks for
   * what it alone needs — the record is four queries, and the page used to
   * run all four for somebody who had come to change their time zone.
   */
  const member = await fetchProfile(row.id);
  const preferences = await preferencesFor();
  const name = member?.name ?? row.name;
  const welcome = params.welcome === "1";
  /*
   * THE AGE QUESTION COMES FIRST. On a first visit with no band on the row,
   * the welcome asks it and nothing else; the name question waits behind it.
   * A member who joined before the question existed meets it on the Profile
   * tab, not as a gate, and the operator can answer for a family by hand.
   */
  const age = await ageBandOf(row.id);
  const band = isAgeBand(age.band) ? age.band : null;
  const askAge = welcome && band === null;
  const next = welcome ? safeDestination(typeof params.next === "string" ? params.next : null) : null;
  const open = activeTab(TABS, params.view);
  /* The stored answers both halves of the account start from: Profile's form and Settings'. */
  const profileFields: ProfileFields = {
    awayFrom: member?.awayFrom ? member.awayFrom.toISOString().slice(0, 10) : "",
    awayUntil: member?.awayUntil ? member.awayUntil.toISOString().slice(0, 10) : "",
    city: member?.city ?? "",
    country: member?.country ?? "",
    timeZone: member?.timeZone ?? "",
    bio: member?.bio ?? "",
    showOnline: member?.showOnline ?? true,
    emailNotify: member?.emailNotify ?? true,
    mailKinds: mailKindsFrom(preferences),
    keepFinishedDays: member?.keepFinishedDays ?? KEEP_FINISHED_DEFAULT,
    daysOff: member?.daysOff ?? [],
  };
  /* No address: in by invite code, and this browser is their only way back until they add one. */
  const addressless = !member?.email;

  /*
   * Read only for the tab that shows it — the same rule the record and the
   * game defaults already follow above. Mapped to the API's own shape rather
   * than the store's (`setAt` as a date, `mayRemovePhrase`), so the client
   * component reads exactly what it would get back from `GET /api/me/phrase`.
   *
   * By id — a phrase is a credential on a specific row, the one thing this must
   * never be tempted to look up by name or address instead.
   */
  const myId = open === "words" ? row.id : null;
  const phraseFacts = myId !== null ? await phraseStatus(myId) : null;
  const phraseInitial = {
    set: phraseFacts?.set ?? false,
    setAt: phraseFacts?.setAt?.toISOString() ?? null,
    hasEmail: phraseFacts?.hasEmail ?? true,
    mayRemove: phraseFacts?.mayRemovePhrase ?? false,
  };

  return (
    <Page>
      <SiteHeader />

      {/*
        The member's own name is the page's title, drawn as every page's is,
        with the welcome — a notice, not the page's name — as a section under
        it on a first visit.
      */}
      <PageTitle
        testId="me-name"
        title={
          <>
            {member?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element -- a Google avatar
              <img src={member.picture} alt="" className="size-8 self-center rounded-full" referrerPolicy="no-referrer" />
            ) : null}
            {name || "Unnamed"}
          </>
        }
        lead={member?.email ? member.email : undefined}
      />

      {askAge ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-3 border-moss/50 bg-moss-soft`} data-testid="welcome">
          <SectionHeading title="Welcome" kanji="ようこそ" />
          <p className="text-sm text-ink-soft">{AGE_COPY.welcomeLead}</p>
          <AgeBandForm band={null} consented={false} place="welcome" />
        </section>
      ) : null}

      {welcome && !askAge ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-2 border-moss/50 bg-moss-soft`} data-testid="welcome">
          <SectionHeading title="Welcome" kanji="ようこそ" />
          <p className="text-sm text-ink-soft">
            You are in. One question before the board: what should the other players call you?{" "}
            {addressless
              ? "Your account has a name to be going on with; change it to the one you want."
              : "Google’s name is filled in; change it if you like."}
          </p>
          {addressless ? (
            /*
             * THE ONE THING AN ACCOUNT MADE BY A CODE IS MISSING, SAID BEFORE THE
             * WELCOME CLOSES. It has no address, so this browser's cookie is the only
             * way back in — lost with the browser, or when the cookie runs out. It
             * used to say four words fixed that; nothing turns four words into a
             * session, so linking Google is the remedy, and the words are offered for
             * what they do. Both are controls here, not a tab to find later.
             */
            <KeepThisAccount days={PLAYER_SESSION_DAYS} googleReady={isGoogleAuthConfigured()} />
          ) : isChild(band) ? null : (
            /* With an address to write to, and not a child: what to hear about, kept as it is pressed. */
            <WelcomeMail all={profileFields.emailNotify} kinds={profileFields.mailKinds} sending={NOTICES.sending} />
          )}
        </section>
      ) : null}

      {askAge ? null : (
        <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
          <NameForm initial={name} next={next} />
        </section>
      )}

      {/*
        THE REMINDER, AFTER THE WELCOME HAS CLOSED. The welcome says it once;
        a member who read past it and never came back lost the account with the
        browser, and nothing on the site said so again. So for as long as the
        account has no address, it says so here, on every visit, quietly and
        under the name rather than above it.

        Until Google is linked, not until four words are set. The words let a
        member play as themselves on a device somebody else is signed in on;
        they do not sign a browser in, so they do not keep the account — which
        the control's own note already says.
      */}
      {!welcome && addressless ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="keep-reminder">
          <KeepThisAccount days={PLAYER_SESSION_DAYS} googleReady={isGoogleAuthConfigured()} place="reminder" />
        </section>
      ) : null}

      {/*
        Nothing else during the welcome. A new member is asked one question —
        what to call them — and a row of tabs under it is the rest of the site
        arriving before they have answered.
      */}
      {welcome ? null : (
        <>
          {/* Bare, under the title, as every page's tabs are; the open tab's content is the panel. */}
          <Tabs tabs={TABS} active={open} base="/me" label="Which part of your account" />
          <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
            {open === "record" ? <MyRecord name={name} /> : null}

            {/*
              The ledger. The total and the level ride the member row this render
              has already read and cached, so the standing costs no query and the
              level is a lookup over the curve.
            */}
            {open === "xp" ? <MyXp params={params} /> : null}

            {open === "profile" ? (
              <div className="flex flex-col gap-3" data-testid="my-profile">
                {/*
                  WHICH ZONE IS IN FORCE, AND WHETHER ANYBODY CHOSE IT. Above the
                  form rather than inside it: a guess from the country is only
                  harmless while it is visibly a guess, and the control that
                  corrects it is the very next thing on the page.
                */}
                <AgeBandForm band={band} consented={age.consented} place="profile" />
                <DayZoneNote
                  timeZone={member?.timeZone ?? ""}
                  country={member?.country ?? ""}
                  preferences={member?.preferences ?? null}
                />
                <ProfileForm
                  initial={profileFields}
                  child={isChild(band)}
                  countries={allCountries()}
                  timeZones={supportedTimeZones()}
                />
                {/* What we keep, then the way to have none of it kept: the privacy page's promise, as two panels (PRIV-04). */}
                {member !== null ? <WhatWeHold member={member} band={band} consented={age.consented} /> : null}
                <RemoveAccount name={name} google={Boolean(member?.email)} fresh={signedInRecently(me)} />
              </div>
            ) : null}

            {open === "words" && myId !== null ? <PhraseSetup initial={phraseInitial} /> : null}

            {open === "settings" ? (
              <div className="flex flex-col gap-3" data-testid="game-defaults-panel">
                <SettingsForm initial={profileFields} child={isChild(band)} mailSending={NOTICES.sending} />
                <p className="border-t border-rule pt-4 text-sm text-muted">
                  What a new board is set out with, here and on every device you sign in on.
                </p>
                <GameDefaultsForm initial={gameDefaultsFrom(member?.gameDefaults)} />

                {/*
                  How a turn works, beside what a board is set out with: both are
                  answers somebody gives once and finds on every device.
                */}
                <p className="text-sm text-muted">How a turn works, on every board you play.</p>
                <TurnFlowForm
                  initial={{
                    moveConfirm: preferences.moveConfirm,
                    moveConfirmComputer: preferences.moveConfirmComputer,
                    afterMove: preferences.afterMove,
                  }}
                />
              </div>
            ) : null}

            {open === "people" ? <MyPeople memberId={row.id} /> : null}
          </section>
        </>
      )}
    </Page>
  );
}
