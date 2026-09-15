/**
 * The words the operator's own pages use.
 *
 * One module for the group rather than one per component, as the pattern says.
 * The two things that needed copy of their own are the Words modal on the
 * Members list and the Bots tab beside it; the older panels here hold their
 * sentences inline and are left alone.
 *
 * WHERE THE WORDS-MODAL COPY DELIBERATELY ECHOES `WORDS_COPY`. The modal is the
 * member's own Words tab, opened by somebody else, so every line inside the
 * picker — tap a word to keep it, arrange them, write them down — comes from
 * `WORDS_COPY` by import and is not restated here. What is here is only the
 * half that is different BECAUSE it is the operator: whose account this is, that
 * the words must be handed to that person, and the question asked before
 * anybody's existing words are taken away.
 */

export const ADMIN_WORDS_COPY = {
  link: "Words",
  linkKanji: "合言葉",
  linkTitle: "Choose four words for this member and set them",
  /** On the row, when there are already words. Says the date, which is all that can be known. */
  rowSet: (date: string) => `Words set ${date}`,
  rowUnset: "No words",
  title: "Four words for",
  lead: (name: string) =>
    `Choose four words and give them to ${name}. They let ${name} play as themselves on somebody else's device, without anybody signing out.`,
  /*
   * THE ONE WARNING THAT IS ONLY TRUE HERE. On the member's own tab, the person
   * who picks the words is the person who needs them. Here they are two people,
   * so the words leaving this screen without being written down loses them for
   * somebody who was never shown them.
   */
  handOver: (name: string) =>
    `Write them down and hand them to ${name}. Once they are set they cannot be shown again — not to ${name}, not to you, not to anybody. If they are lost, the fix is to set four new ones.`,
  acknowledge: "I have written these four words down to give to this member.",
  save: "Set these four words",
  /** The replace question. The date is what makes it answerable. */
  replaceTitle: "This member already has four words",
  /*
   * The question in two halves around its date, because the date is drawn by
   * `LocalTime` and a component cannot sit inside a string. It used to be
   * `wordsDate`, `toLocaleDateString("en-GB")` with no zone, which promised
   * "the zone they are reading it in" and kept that promise only in a browser.
   */
  replaceSetOn: "Four words were set on this account ",
  replaceTakesAway:
    ". Setting new ones takes those away, and whoever is using them will not be able to sit down with them again until somebody tells them the new four.",
  replaceYes: "Replace them",
  replaceNo: "Leave them alone",
  savedFor: (name: string) => `Four words are set for ${name}.`,
  savedKept: "They cannot be shown again. If they were not written down, set four new ones now.",
  done: "Done",
  close: "Close",
  cannot:
    "This row is not an account anybody signs in to, so four words would be a way into nobody's account.",
  drawFailed: "Could not offer any words.",
  saveFailed: "Could not set those words.",
} as const;

export const ADMIN_BOTS_COPY = {
  /*
   * What the tab is FOR, in the operator's terms. The players page already says
   * what the computer players are to a player looking for a game; this says what
   * they are to whoever runs the site — seven member rows, written by the site
   * itself, that hold seats and carry ratings like anybody else.
   */
  lead:
    "The computer players, which are member rows like anybody else: they hold seats, their games count, and their ratings move when somebody beats them. They never sign in, so they are never seen and never late — and they cannot hold four words, because there is nobody to hand them to.",
  /** Why their rating is a different number from everybody else's. */
  ratingNote:
    "The rating is the one earned against the computer players, which is the only pool they play in — a program never plays a person-against-person game, so its ordinary rating would sit at its starting value for ever.",
  empty: "No computer players are set up on this site yet.",
  /** The heading over the column that names the player. */
  player: "Player",
  lastPlayed: (date: string) => `last played ${date}`,
  neverPlayed: "no games yet",
  /*
   * Where the two remembered players went, said on the page rather than only in
   * a commit message. The operator is the person most likely to wonder.
   */
  keptRecordsNote:
    "The kept records — the players whose history from elsewhere is kept here — stay under Members. They are people, not programs.",
} as const;

export const ADMIN_LOG_COPY = {
  heading: { label: "The operator log", kanji: "記録" },
  /*
   * What the tab keeps and what it never does, said where the operator reads it:
   * the four words are a password, and a record of setting them must not become
   * a way to learn them.
   */
  lead:
    "What has been done to members' accounts from this page, newest first: shutting one, opening it again, setting somebody's four words, starting a pick and attaching a kept record. It says who did it and when — never the words themselves, and never the name a record was kept under.",
  when: "When",
  who: "Who",
  what: "What",
  member: "Member",
  detail: "Detail",
  empty: "Nothing has been done to anybody's account yet.",
  /** An operator whose session named neither an address nor a member row. */
  unnamedActor: "an operator the session did not name",
  /** A member whose row has gone since: the act stands, and says whose id it was. */
  memberGone: (id: string) => `a member no longer here (${id})`,
} as const;

/**
 * The Attach-a-record modal on the Members list. See `claimRecord.ts` for what a
 * record is here: games, a rating and per-game standings kept under a name that
 * nobody had an account for.
 */
export const ADMIN_CLAIM_COPY = {
  link: "Attach a record",
  linkKanji: "引継",
  linkTitle: "Attach the games and rating kept under a name nobody had an account for",
  title: "Attach a record to",
  lead: (name: string) =>
    `Games played under a name with no account behind it — at one screen, or before accounts existed — can be attached to ${name}, with the rating and the per-game standings kept under that name. Type the name exactly as the games were played under, and look before attaching.`,
  nameLabel: "The name the games were played under",
  look: "Look",
  underName: (asked: string) => `Kept under “${asked}”:`,
  /** Said after the count, which is a link to exactly those games. */
  finished: (count: number) => (count === 1 ? " finished game" : " finished games"),
  seats: (count: number, name: string) =>
    count === 1
      ? `1 seat in them carries nobody's id yet, and will carry ${name}'s`
      : `${count} seats in them carry nobody's id yet, and will carry ${name}'s`,
  rating: (has: boolean) => (has ? "A rating, which becomes theirs" : "No rating"),
  standings: (count: number) => (count === 1 ? "1 per-game standing, which becomes theirs" : `${count} per-game standings, which become theirs`),
  whatStays:
    "The games keep the names they were played under. No XP comes with them, and the operator log keeps what moved, without the name.",
  attach: (name: string) => `Attach to ${name}`,
  done: (name: string) => `Attached. ${name}'s page counts these games now, and the operator log keeps what moved.`,
  close: "Close",
  lookFailed: "Could not look that name up.",
  attachFailed: "Could not attach that record.",
} as const;
