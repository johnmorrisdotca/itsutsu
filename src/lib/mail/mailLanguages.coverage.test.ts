import { describe, expect, it } from "vitest";

import { RESULT_REASONS } from "@/components/history/resultCard.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { PHRASE_KEYS } from "@/lib/i18n/i18n.constants";
import { speaker } from "@/lib/i18n/i18n";
import { englishWordsIn, hasJapanese } from "@/lib/i18n/leftoverEnglish";
import type { Locale } from "@/lib/i18n/i18n.types";
import type { GameResultFacts, ResultReason } from "@/lib/history/gameResult.types";

import { inviteMail } from "./inviteMail";
import { inviteRequestMail, readInviteRequest } from "./inviteRequest";
import { MAIL_REFUSAL_PHRASE } from "./mail.constants";
import type { GameOverSummary, MailRefusal, NoticeEvent, OutgoingMail } from "./mail.types";
import { STOP_KIND_LIST } from "./mailStop";
import { mailRefusalText } from "./mailWords";
import { noticeMail } from "./noticeMail";

/*
 * EVERY EMAIL, RENDERED IN BOTH LANGUAGES (ENJA-12).
 *
 * An email is the one place a member meets the site with no page around it, so nothing else would notice a phrase
 * that was never written in Japanese: `Speaker.say` falls back to the English, the email still sends, and a reader of
 * Japanese gets a sentence of English in the middle of their own language. This renders every notice (each kind, each
 * ending from each side, each way a game's length is told, each reason a game can end for), the invitation in each
 * of its three shapes, the problems the invite form reports and every refusal, in English and in Japanese, and fails
 * for a placeholder left unfilled, for a Japanese email with an English sentence in it, and for an English one that
 * has picked up Japanese. Nothing is sent: these are strings, and no provider, counter or database is reached.
 *
 * What a Japanese render may still hold of English is a name: the site's, a provider's, a person's (a name somebody
 * typed is theirs in any language), and a game whose own-script name is not Japanese (Caro is "Cờ ca-rô").
 */

const LOCALES: readonly Locale[] = ["en", "ja"];
const NAMES = ["Itsutsu", "Hanako", "Kuro", "Kenji", "Tanaka", "Morris", "ID", "retired-game", "Cờ ca-rô"];
const STOP = "https://itsutsu.com/stop/t0k3n";
const DAY = 24 * 60 * 60 * 1000;
const start = new Date("2026-09-21T10:00:00Z");

const base: GameOverSummary = {
  gameId: "k3m9-p2qx",
  variant: "reversi",
  facts: { outcome: "decided", winner: "black", reason: "count", score: { kind: "discs", black: 38, white: 26 } },
  names: { black: "Hanako Morris", white: "Kuro Tanaka" },
  moveCount: 60,
  startedAt: start,
  endedAt: new Date(start.getTime() + 2 * DAY),
  ratingChange: { black: 12, white: -12 },
};

const over = (stone: "black" | "white", winner: "black" | "white" | null = "black"): NoticeEvent => ({ kind: "game-over", gameId: base.gameId, winner, stone, memberId: "m" });

/** How long a game took, to reach each way of saying it: no end, seconds, minutes, one hour, hours, days, one move. */
const SPANS: { moves: number; ended: number | null }[] = [
  { moves: 12, ended: null },
  { moves: 1, ended: 20_000 },
  { moves: 23, ended: 25 * 60_000 },
  { moves: 40, ended: 60 * 60_000 },
  { moves: 40, ended: 30 * 60 * 60_000 },
  { moves: 90, ended: 9 * DAY },
  { moves: 1, ended: DAY },
];

/** Every email the site writes to a member, as the text a person would read, for one language. */
function everyNotice(locale: Locale): { name: string; mail: OutgoingMail }[] {
  const say = speaker(locale);
  const out: { name: string; mail: OutgoingMail }[] = [];
  for (const kind of STOP_KIND_LIST) {
    if (kind === "your-turn") out.push({ name: "your turn", mail: noticeMail({ kind, gameId: "g", stone: "white", memberId: "m" }, "a@example.test", null, STOP, say) });
  }
  // A game that ended and could not be read: only what the event knows.
  for (const winner of ["black", "white", null] as const) {
    out.push({ name: `unread, ${winner}`, mail: noticeMail(over("white", winner), "a@example.test", null, STOP, say) });
  }
  // A game that ended and was read: every reason, from each side, with and without a score and a rating change.
  const reasons = Object.keys(RESULT_REASONS) as ResultReason[];
  for (const reason of reasons) {
    for (const stone of ["black", "white"] as const) {
      const facts: GameResultFacts = { outcome: "decided", winner: RESULT_REASONS[reason].about === null ? null : "black", reason, score: null };
      out.push({ name: `${reason} as ${stone}`, mail: noticeMail(over(stone, facts.winner), "a@example.test", { ...base, facts, ratingChange: null }, STOP, say) });
    }
  }
  for (const stone of ["black", "white"] as const) {
    out.push({ name: `scored, rated, ${stone}`, mail: noticeMail(over(stone), "a@example.test", base, STOP, say) });
    out.push({ name: `a nameless seat, ${stone}`, mail: noticeMail(over(stone), "a@example.test", { ...base, names: { black: "", white: "" } }, STOP, say) });
  }
  for (const [at, span] of SPANS.entries()) {
    const ended = span.ended === null ? null : new Date(start.getTime() + span.ended);
    out.push({ name: `length ${at}`, mail: noticeMail(over("black"), "a@example.test", { ...base, moveCount: span.moves, endedAt: ended }, STOP, say) });
  }
  // A game this site has no name for (an old one, read back from storage) is named as it was stored.
  out.push({ name: "an old variant", mail: noticeMail(over("black"), "a@example.test", { ...base, variant: "retired-game" }, STOP, say) });
  // Every game the site offers, once: each is named by its kanji for a reader of Japanese.
  for (const variant of Object.keys(RULE_VARIANT_DISPLAY)) {
    out.push({ name: variant, mail: noticeMail(over("black"), "a@example.test", { ...base, variant }, STOP, say) });
  }
  return out;
}

const text = (mail: OutgoingMail) => `${mail.subject}\n${mail.text}`;

describe.each(LOCALES)("every notice in %s", (locale) => {
  const notices = everyNotice(locale);

  it("renders, with no placeholder left unfilled and no line missing", () => {
    expect(notices.length).toBeGreaterThan(60);
    for (const { name, mail } of notices) {
      expect(text(mail), `${name}: an unfilled placeholder`).not.toMatch(/\{\w+\}|undefined|NaN|\[object/);
      expect(mail.subject.trim(), `${name}: no subject`).not.toBe("");
      expect(mail.subject, `${name}: a subject is one line`).not.toMatch(/[\r\n]/);
      expect(mail.text, `${name}: no way to stop it`).toContain(STOP);
      expect(mail.text, `${name}: no way to the reader's games`).toContain("https://itsutsu.com/play");
    }
  });

  it(locale === "ja" ? "has no English sentence in it, and is Japanese from its subject to its footer" : "has no Japanese in it", () => {
    for (const { name, mail } of notices) {
      if (locale === "ja") {
        expect(hasJapanese(mail.subject), `${name}: the subject is not Japanese`).toBe(true);
        expect(englishWordsIn(text(mail), NAMES), `${name}: English left in a Japanese email`).toEqual([]);
      } else {
        expect(hasJapanese(text(mail)), `${name}: Japanese in an English email`).toBe(false);
      }
    }
  });
});

describe("a notice in each language", () => {
  const ja = everyNotice("ja");
  const en = everyNotice("en");

  it("is the same email: the same lines, the same links, the same number of each", () => {
    expect(ja.map((one) => one.name)).toEqual(en.map((one) => one.name));
    ja.forEach((one, at) => {
      const links = (mail: OutgoingMail) => mail.text.split("\n").filter((line) => line.startsWith("https://"));
      expect(links(one.mail), one.name).toEqual(links(en[at]!.mail));
      // A blank line is a blank line in both, so the two read as the same shape.
      expect(one.mail.text.split("\n").filter((line) => line === "").length, one.name).toBe(en[at]!.mail.text.split("\n").filter((line) => line === "").length);
    });
  });

  it("names the footer's kind of email in the reader's language, so it matches the stop page", () => {
    const turn = noticeMail({ kind: "your-turn", gameId: "g", stone: "white", memberId: "m" }, "a@example.test", null, STOP, speaker("ja"));
    expect(turn.text).toContain(speaker("ja").say("auth.stop.wordsYourTurn"));
    const finished = noticeMail(over("black"), "a@example.test", base, STOP, speaker("ja"));
    expect(finished.text).toContain(speaker("ja").say("auth.stop.wordsGameOver"));
  });

  it("says what each ending was, to each side, in Japanese", () => {
    const say = speaker("ja");
    const won = noticeMail(over("black"), "a@example.test", base, STOP, say);
    expect(won.subject).toBe("リバーシでKuro T.さんに勝ちました");
    expect(won.text).toContain("レーティングが12上がりました。");
    expect(won.text).toContain("60手、2日間かかって終わりました。");
    const lost = noticeMail(over("white"), "a@example.test", base, STOP, say);
    expect(lost.subject).toBe("リバーシの対局はHanako M.さんの勝ちでした");
    expect(lost.text).toContain("レーティングが12下がりました。");
    const draw = noticeMail(over("white", null), "a@example.test", { ...base, facts: { outcome: "decided", winner: null, reason: "boardFull", score: null }, ratingChange: null }, STOP, say);
    expect(draw.subject).toBe("リバーシの対局はHanako M.さんとの引き分けでした");
    // A colour is nobody's name and takes no polite ending.
    const nameless = noticeMail(over("black"), "a@example.test", { ...base, names: { black: "", white: "" } }, STOP, say);
    expect(nameless.subject).toBe("リバーシで白に勝ちました");
  });
});

describe("the invitation to somebody with no account", () => {
  const input = { to: "friend@example.test", inviterName: "Kenji", joinUrl: "https://itsutsu.com/join?code=hoshi-kuma-nami", days: 30 };

  it("is English alone when the inviter reads English, or has no language to name", () => {
    for (const locale of [undefined, "en"] as const) {
      const mail = inviteMail({ ...input, locale });
      expect(mail.subject).toBe("Kenji has invited you to play on Itsutsu");
      expect(hasJapanese(text(mail))).toBe(false);
      expect(mail.text).toContain(input.joinUrl);
    }
  });

  it("is both languages, English first, when the inviter reads Japanese", () => {
    const mail = inviteMail({ ...input, locale: "ja" });
    expect(mail.subject).toBe("Kenji has invited you to play on Itsutsu / Kenjiさんから、Itsutsuへのご招待です");
    expect(mail.subject).not.toMatch(/[\r\n]/);
    const [english, japanese] = mail.text.split("\n\n- - -\n\n");
    expect(japanese, "the second half is missing").toBeDefined();
    expect(hasJapanese(english!)).toBe(false);
    expect(hasJapanese(japanese!)).toBe(true);
    expect(englishWordsIn(japanese!, NAMES)).toEqual([]);
    // Each half carries the link, how long it lasts, why it came and how to ask.
    for (const half of [english!, japanese!]) {
      expect(half).toContain(input.joinUrl);
      expect(half).toContain("30");
      expect(half).toContain("hello@itsutsu.com");
    }
    expect(english).toContain("has not saved your address");
    expect(japanese).toContain("保存しておらず");
    expect(text(mail)).not.toMatch(/\{\w+\}/);
  });

  it("falls back to a friend for a blank name, in each language", () => {
    const mail = inviteMail({ ...input, inviterName: "  ", locale: "ja" });
    expect(mail.subject).toBe("A friend has invited you to play on Itsutsu / お友達から、Itsutsuへのご招待です");
  });

  it("keeps a typed name to one line, in the Japanese half too", () => {
    const mail = inviteMail({ ...input, inviterName: `Kenji${String.fromCharCode(13, 10)}Bcc: x@example.test`, locale: "ja" });
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });
});

describe("what a person is told when an email was not sent, or a request could not be read", () => {
  it("is said in both languages for every refusal, each one saying that it was not sent", () => {
    for (const refusal of Object.keys(MAIL_REFUSAL_PHRASE) as MailRefusal[]) {
      const en = mailRefusalText(speaker("en"), refusal);
      const ja = mailRefusalText(speaker("ja"), refusal);
      expect(en, refusal).not.toMatch(/\{\w+\}/);
      expect(ja, refusal).not.toMatch(/\{\w+\}/);
      expect(hasJapanese(ja), refusal).toBe(true);
      expect(englishWordsIn(ja, NAMES), refusal).toEqual([]);
      expect(ja, refusal).not.toBe(en);
    }
    // The limit and the address are read from where they live.
    expect(mailRefusalText(speaker("ja"), "member-day-cap")).toContain("5通");
    expect(mailRefusalText(speaker("ja"), "request-day-cap")).toContain("hello@itsutsu.com");
  });

  it("reports each problem with the invite form in the visitor's language", () => {
    const form = (fields: Record<string, string>) => {
      const data = new FormData();
      for (const [key, value] of Object.entries(fields)) data.set(key, value);
      return data;
    };
    const cases: Record<string, Record<string, string>> = {
      badAddress: { email: "nobody" },
      nameLong: { email: "a@example.test", name: "n".repeat(81) },
      aboutLong: { email: "a@example.test", about: "x".repeat(501) },
      links: { email: "a@example.test", about: "see https://example.test" },
    };
    for (const [name, fields] of Object.entries(cases)) {
      const said = (locale: Locale) => {
        const reading = readInviteRequest(form(fields), speaker(locale));
        expect(reading.kind, `${name} in ${locale}`).toBe("problem");
        return reading.kind === "problem" ? reading.problem : "";
      };
      expect(hasJapanese(said("ja")), name).toBe(true);
      expect(englishWordsIn(said("ja"), NAMES), name).toEqual([]);
      expect(hasJapanese(said("en")), name).toBe(false);
      expect(said("ja")).not.toMatch(/\{\w+\}/);
    }
  });

  it("keeps the email the operator receives in English, by decision: it goes to one person", () => {
    const mail = inviteRequestMail({ email: "friend@example.test", name: "Kenji", about: "I played for years." });
    expect(mail.to).toBe("hello@itsutsu.com");
    expect(hasJapanese(text(mail))).toBe(false);
  });
});

describe("the phrases an email is made of", () => {
  it("are all answered in Japanese, so none can fall back to English in a reader's inbox", () => {
    const ja = speaker("ja");
    const en = speaker("en");
    const mailKeys = PHRASE_KEYS.filter((key) => key.startsWith("mail."));
    expect(mailKeys.length).toBeGreaterThan(50);
    for (const key of mailKeys) {
      const said = ja.say(key);
      expect(said, `${key} has no Japanese`).not.toBe(en.say(key));
      expect(hasJapanese(said), key).toBe(true);
    }
  });
});
