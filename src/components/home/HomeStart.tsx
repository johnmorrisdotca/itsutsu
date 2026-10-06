import Link from "@/components/ui/Link";
import type { ReactNode } from "react";

import { PANEL_CLASS, SECTION_HEADING } from "@/components/ui/ui.constants";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { weave } from "@/lib/i18n/weave";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { START_NEW, START_RETURNING, type StartLink } from "./home.constants";

/**
 * WHERE TO START, FOR THE TWO PEOPLE WHO ARRIVE HERE.
 *
 * Somebody who has never played renju and somebody who played it for ten
 * years on ItsYourTurn want different first pages, and the buttons in the hero
 * cannot tell them apart. Two short lists, each a handful of places with a line
 * on what is there, so neither has to guess from a word in the navigation.
 */
export async function HomeStart({ signedIn }: { signedIn: boolean }) {
  const say = await currentSpeaker();
  return (
    <section className="grid gap-4 md:grid-cols-2" data-testid="front-start">
      <StartList say={say} title={say.pair("home.start.newTitle", "初めて")} links={START_NEW} signedIn={signedIn} />
      <StartList say={say} title={say.pair("home.start.returningTitle", "経験者")} links={START_RETURNING} signedIn={signedIn}>
        {/*
          The invitation the About page makes, said where a player from the
          older sites is most likely to be standing. Copied by hand, once: a
          snapshot of a record, never a rating mixed into ours.
        */}
        <p className="text-sm text-muted">
          {weave(say.say("home.start.older", { first: "ItsYourTurn", second: "GoldToken" }), {
            mail: (
              <a href={`mailto:${CONTACT_ADDRESS}`} className="underline underline-offset-4">
                {CONTACT_ADDRESS}
              </a>
            ),
          })}
        </p>
      </StartList>
    </section>
  );
}

function StartList({
  say,
  title,
  links,
  signedIn,
  children,
}: {
  say: Speaker;
  title: { text: string; kanji: string | null };
  links: readonly StartLink[];
  signedIn: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <h2 className={SECTION_HEADING}>
        {title.text}
        {title.kanji === null ? null : <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">{title.kanji}</span>}
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <span className="text-muted">
              {weave(say.say(link.membersOnly && !signedIn && link.lineInvite !== undefined ? link.lineInvite : link.line), {
                label: (
                  <Link href={link.href} className="font-medium text-ink underline underline-offset-4">
                    {say.say(link.label)}
                  </Link>
                ),
              })}
            </span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
