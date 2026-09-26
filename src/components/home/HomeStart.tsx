import Link from "@/components/ui/Link";
import type { ReactNode } from "react";

import { PANEL_CLASS, SECTION_HEADING } from "@/components/ui/ui.constants";
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
export function HomeStart({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="grid gap-4 md:grid-cols-2" data-testid="front-start">
      <StartList title="New to these games" kanji="初めて" links={START_NEW} signedIn={signedIn} />
      <StartList title="Played them before" kanji="経験者" links={START_RETURNING} signedIn={signedIn}>
        {/*
          The invitation the About page makes, said where a player from the
          older sites is most likely to be standing. Copied by hand, once: a
          snapshot of a record, never a rating mixed into ours.
        */}
        <p className="text-sm text-muted">
          Played for years on ItsYourTurn or GoldToken? Write to{" "}
          <a href={`mailto:${CONTACT_ADDRESS}`} className="underline underline-offset-4">
            {CONTACT_ADDRESS}
          </a>{" "}
          with the site and the name you played under, and your record can be copied over, game by game, beside what
          you play here.
        </p>
      </StartList>
    </section>
  );
}

function StartList({
  title,
  kanji,
  links,
  signedIn,
  children,
}: {
  title: string;
  kanji: string;
  links: readonly StartLink[];
  signedIn: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <h2 className={SECTION_HEADING}>
        {title}
        <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">{kanji}</span>
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="font-medium underline underline-offset-4">
              {link.label}
            </Link>
            <span className="text-muted">
              {" "}
              — {link.note}
              {link.membersOnly && !signedIn ? ", once you have an invite" : ""}.
            </span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
