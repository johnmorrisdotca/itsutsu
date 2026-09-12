import type { SiteSettingKey, SiteSettingSpec, SiteSettings } from "./site.types";

/**
 * The registry: every site-level setting the operator can change from the
 * panel, everything it may be, and what it is until they say otherwise.
 *
 * The same design as `PREFERENCE_SPECS`, one level up. That one keeps what a
 * member chose about their own board; this keeps what the operator chose about
 * the whole site. Both are registries rather than bags for the same reason:
 * reading gives the fallback wherever nothing valid is stored, writing refuses
 * what is not declared here, and a value a later version stops offering
 * degrades to that ONE setting's default instead of taking the others with it.
 *
 * A setting is added by adding a row here and a row of copy below. Nothing
 * else has to change for it to be read, written through `/api/site`, and shown
 * on the panel.
 *
 * EVERY ROW HERE IS ENFORCED SOMEWHERE, and that is a rule rather than an
 * observation. WazaDB has `SiteConfig.maintenanceMode`, which both of its admin
 * pages write and nothing whatsoever reads, plus two `FeatureFlag` rows named
 * `MAINTENANCE_MODE` and `REGISTRATION_OPEN` that gate nothing at all — three
 * switches that look exactly like the real one from the operator's side. A
 * setting that cannot be enforced does not belong in this registry; it belongs
 * where it can be, and `MAINTENANCE_ENV` below is that case stated honestly.
 *
 * WHAT IS DELIBERATELY NOT HERE. UmaKuma keeps three more signup settings, all
 * about a signup form this site does not have — Google has proved the address
 * already and there is nothing left to ask. Its `open_pending` approval queue
 * is not copied either; see `REGISTRATION_MODES`.
 */

/**
 * How a Google identity with no member row behind it is treated.
 *
 * ONE NAMED MODE, not a handful of booleans. WazaDB spreads this across
 * `registrationOpen`, `registrationInviteOnly` and `registrationApprovalRequired`
 * — three booleans, eight states, four of which mean anything — and then has a
 * function that decodes the live ones back into four names for its admin page.
 * UmaKuma keeps one enum. An enum is what this is: the states are exclusive,
 * and a shape that can express "open and closed at once" will eventually be
 * asked what that means.
 *
 * `invite-only` IS TODAY'S BEHAVIOUR AND THE DEFAULT, and it stays the default
 * for the reason a missing row is the default at all: the safe answer is the
 * one that is already true when nothing has been said. A deployment that never
 * touches this table behaves exactly as it did before the table existed.
 *
 * `closed` is the mode neither sibling has under this name, and it is here
 * because it is the state a beta actually reaches — the people in it are enough
 * for now — and because it is the clickable lockdown. Shutting the door is not
 * the same act as shutting the site, and a beta needs the first far more often
 * than the second.
 *
 * IT GATES SIGNING UP, NEVER SIGNING IN. A member already admitted is admitted;
 * no mode here is ever consulted about them, and the invite codes in
 * circulation are untouched by all three. UmaKuma's backlog records the
 * near-miss this avoids: a lockdown setting that, deployed without its row
 * seeded, would have shut out every account already holding an invite. Nothing
 * is seeded here, and nothing reads this except the one branch that decides
 * whether a STRANGER becomes a member.
 *
 * UmaKuma's `open_pending` — sign up, wait, an operator admits or turns you
 * away — IS NOT COPIED, because this site could not finish the conversation it
 * would start. Nothing here sends mail, and a Google identity that is not yet a
 * member is bounced to `/join`, so somebody left waiting has nowhere to be told
 * they were admitted and no reason to come back and find out. The queue's
 * answer would never reach the person waiting for it, which is a rule that
 * cannot report what it decided. The want behind it — "open the door, but let
 * me see who is coming" — is already answered by minting one code per person,
 * which the invite store has supported from the start.
 */
export const REGISTRATION_MODES = ["invite-only", "open", "closed"] as const;

export const SITE_SETTING_SPECS = {
  registration: { kind: "choice", options: REGISTRATION_MODES, fallback: "invite-only" },
  /*
   * A line on the door, in the operator's own words — "Beta, ask John for a
   * code", "Open to all this weekend". 280 characters because it is a notice
   * and not a page; a longer explanation belongs on /about, which is open.
   * WazaDB's announcement banner is the same idea sitewide; the door is where
   * this site needs it, because the door is the page that currently explains
   * nothing about why it is asking.
   */
  joinNotice: { kind: "note", maxLength: 280, fallback: "" },
} as const satisfies Record<string, SiteSettingSpec>;

/** Every declared key, in registry order — which is the order the panel shows. */
export const SITE_SETTING_KEYS = Object.keys(SITE_SETTING_SPECS) as readonly SiteSettingKey[];

/** How the site behaves when nothing at all has been written: each setting at its fallback. */
export const DEFAULT_SITE_SETTINGS = Object.fromEntries(
  SITE_SETTING_KEYS.map((key) => [key, SITE_SETTING_SPECS[key].fallback]),
) as SiteSettings;

/**
 * MAINTENANCE: THE ONE CONTROL THAT IS NOT A ROW IN THE TABLE ABOVE, and the
 * reason is worth reading before anybody tries to make it one.
 *
 * It is enforced in `src/proxy.ts`, which is the only place that can refuse
 * every request before a line of the app runs. So whatever the gate reads, it
 * reads on EVERY request — and that rules the database out twice over:
 *
 *  - It is the cost rule. A query per request is what this project's one real
 *    cost spike was made of, and it is latency on every page besides. WazaDB
 *    reached the same conclusion the expensive way round: its maintenance check
 *    used to live in middleware and was taken out of it, with the commit
 *    comment naming "2-3 extra serverless invocations per request". Its
 *    surviving gate-level control, `SITE_LOCKDOWN_ENABLED`, is an environment
 *    variable read with no query and no cache, exactly as this is.
 *  - It is the honesty rule. Maintenance mode exists FOR the hour the database
 *    is being worked on. A shutter that has to ask the database whether to
 *    close cannot answer in the one situation it was built for — and would
 *    answer by locking out the one person who must get in to reopen the site.
 *
 * A module-level cache is not the way round it either: the Next 16 proxy
 * documentation says in as many words that Proxy "is meant to be invoked
 * separately of your render code and in optimized cases deployed to your CDN",
 * and that you "should not attempt relying on shared modules or globals".
 *
 * So: set `SITE_MAINTENANCE=on` and every request but the operator's is
 * refused at the gate. Unset, or set to anything else, and the gate does
 * nothing at all. Flipping it is a deployment setting, which is the true cost
 * of this design and is stated on the panel rather than hidden: the clickable
 * lockdown a beta reaches for most days is `registration: closed` above, which
 * is a row, is written from the panel, and takes effect at once.
 */
export const MAINTENANCE_ENV = "SITE_MAINTENANCE";

/** The one value that shuts the site. Anything else, including nothing, does not. */
export const MAINTENANCE_ON = "on";

/**
 * The words. Separate from the rules above, the way `RULE_VARIANT_DISPLAY` is
 * separate from `VARIANT_SPECS`: the panel is built from this, so a setting
 * with no copy has no control, and a control never invents its own labels.
 */
export const SITE_SETTING_COPY: Record<
  SiteSettingKey,
  {
    label: string;
    kanji: string;
    /** What the setting is, in one sentence, above the control. */
    blurb: string;
    /** One per option, for a `choice`. Empty for a `note`. */
    options: Record<string, { label: string; blurb: string; confirm?: string }>;
    /** Shown in an empty `note` field. */
    placeholder?: string;
  }
> = {
  registration: {
    label: "Signing up",
    kanji: "登録",
    blurb:
      "What happens when somebody Google knows, and this site does not, arrives at the door. Members already here are unaffected by all three, and so are the codes in circulation.",
    options: {
      "invite-only": {
        label: "Invite code needed",
        blurb:
          "They are asked once for the three words you gave them; after that Google alone lets them in. This is how the site has always worked.",
      },
      open: {
        label: "Open to anyone",
        blurb:
          "Google alone makes them a member, with no code at all. Anybody who can sign in to Google can join.",
        confirm:
          "Open signing up to anyone? From now on anybody with a Google account becomes a member the moment they sign in — no code, no approval. You can shut it again here at any time, but whoever joined stays joined.",
      },
      closed: {
        label: "Nobody new",
        blurb:
          "No new members, code or no code. Everybody already in carries on exactly as before.",
        confirm:
          "Stop new members? Anybody holding a code will be turned away until you set this back — including somebody you gave one to this morning. Everybody already a member is unaffected.",
      },
    },
  },
  joinNotice: {
    label: "A line on the door",
    kanji: "掲示",
    blurb:
      "Shown on the join page, above the buttons. Leave it empty and the door says only what it always says.",
    options: {},
    placeholder: "Beta — ask John for a code",
  },
};
