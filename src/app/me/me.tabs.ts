import type { Tab } from "@/lib/ui/tabs";

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
export const ME_TABS: Tab[] = [
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
