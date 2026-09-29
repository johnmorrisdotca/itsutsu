/** What a party table on several devices says; see docs/plans/party-online/README.md. */
export const ONLINE_COPY = {
  /** The set-up's question, and its two answers. */
  where: "Where are you playing?",
  here: "This device",
  several: "Several devices",
  /** Under the answer chosen. */
  hereNote: "Pass one phone or tablet round the table.",
  severalNote: "Each player on their own phone or computer. Invite a buddy, send a link, or give a seat to a computer.",
  seats: "Who sits where",
  you: "You",
  link: "Anyone with the link",
  computer: "Computer",
  /** A computer in the seat chooser: a program by its name, or a game's one computer player plainly. */
  computerLabel: (name: string) => (name === "Computer" ? "Computer" : `Computer: ${name}`),
  buddyLabel: (name: string) => `Buddy: ${name}`,
  /** Under Start on several devices: where the table is kept, or why it cannot be set yet. */
  keptNote: (fillable: boolean) =>
    fillable
      ? "Kept on the site: it waits on everybody's My games, and nothing here is rated."
      : "Add buddies first: a member under 13 fills the other seats with people from their own buddy list.",
  start: "Start online game",
  starting: "Starting…",
  couldNotStart: "The game could not be started.",
  /** The page. */
  title: "Online table",
  kanji: "卓",
  lead: "Each player on their own device. Only the seat whose turn it is can move; everybody else sees it arrive.",
  seatsHeading: "Players",
  yours: "(you)",
  openSeat: "Open seat",
  openNote: "Waiting for somebody to open its link.",
  computerSeat: "Computer",
  yourTurn: "Your turn.",
  waitingOn: (name: string) => `Waiting on ${name}.`,
  waitingOpen: "Waiting for somebody to take the open seat.",
  sending: "Sending…",
  /** While this browser works out a computer's move, as the table's arrangement asks it to. */
  computerThinking: (name: string) => `${name} is thinking, in this browser…`,
  sendLink: "Send this link to whoever you want in the open seat. Whoever opens it, signed in, takes it.",
  linkName: { en: "The open seat", kanji: "空席" },
  linkMessage: (game: string, url: string) => `Sit at my table of ${game}: ${url}`,
  leave: "Leave the table",
  leaveConfirm: "Leave? Your seat opens for somebody else.",
  leaveYes: "Yes, leave",
  end: "End the table",
  endConfirm: "End the table for everybody, with nobody winning?",
  endYes: "Yes, end it",
  keep: "Keep playing",
  ended: (by: string | null) => (by === null ? "This table was ended. Nobody won." : `${by} ended this table. Nobody won.`),
  /** The "are you still there?" question, on the reader's own turn: nothing is timed, the table waits. */
  idleDetail: "It is your turn and nothing has happened for a couple of minutes. There is no clock at this table; it simply waits for you.",
  idleKept: "This table is kept on the site. It is on My games whenever you come back.",
  paused: "Stopped checking for moves while nothing was happening. Tap anywhere to check again.",
  full: "That seat was taken before you opened its link.",
  over: "That table is over.",
  refused: "You could not take that seat:",
  /** Where an ended or finished table's page points next. */
  about: "About the game and its rules",
  /** On My games. */
  myHeading: "Online tables",
  myHint: "Party games on several devices. Your move first.",
  myFinishedHeading: "Finished tables",
  myFinishedHint: "The newest twenty party tables you sat at.",
  myYourMove: "Your move",
  myTheirMove: (name: string) => `${name}’s move`,
  myOpen: "Waiting for the open seat",
  myNone: "No online tables.",
  myNoneFinished: "No tables finished yet.",
  myFind: "Find a party game",
  myOpenTable: "Open",
  myLook: "Look",
  result: { won: "You won.", shared: "You shared the win.", lost: "Somebody else won.", ended: "Ended, nobody won." },
} as const;
