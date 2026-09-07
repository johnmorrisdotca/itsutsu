/**
 * The invite-code vocabulary.
 *
 * Ordinary Japanese nouns, in Hepburn romaji, chosen so a code can be read
 * aloud down a phone and typed back correctly. The screening rules were:
 *
 * - no long vowels, because "tokyo" / "toukyou" / "tōkyō" are the same word
 *   and three different strings;
 * - no doubled consonants from small tsu, for the same reason;
 * - no "n" before b, m or p, where romanisation splits between n and m;
 * - concrete, common nouns — things a person can picture — rather than
 *   abstractions or game jargon, which are harder to spell from hearing.
 *
 * Words are all lowercase a-z, which lets the whole code be normalised by
 * lowercasing and stripping anything else.
 */
export const INVITE_WORDS: readonly string[] = [
  // Sky, weather and light
  "ame", "arashi", "asa", "hikari", "hoshi", "kaminari", "kasumi", "kaze",
  "kiri", "kumo", "niji", "sora", "tsuki", "yuki", "yugure", "hare",
  // Water
  "ike", "izumi", "kawa", "mizu", "nami", "numa", "shio", "taki",
  "umi", "minato", "sawa", "shima", "iso", "hama", "fune", "ikada",
  // Land and stone
  "hara", "iwa", "ishi", "mine", "mori", "oka", "sakamichi", "suna",
  "tani", "tsuchi", "yama", "hayashi", "gake", "michi", "hashi", "sato",
  // Trees, plants and food
  "hana", "kaede", "kiku", "matsu", "momiji", "sakura", "sugi", "take",
  "tsubaki", "ume", "yanagi", "kusa", "koke", "tane", "eda", "ha",
  "kaki", "kuri", "momo", "nashi", "mikan", "budo", "ichigo", "mame",
  "kome", "kinoko", "wakame", "nori", "cha", "shoyu", "miso", "azuki",
  // Creatures
  "hachi", "hato", "hebi", "hotaru", "inu", "kaeru", "kame", "karasu",
  "kitsune", "kujira", "kuma", "neko", "nezumi", "sagi", "sakana", "saru",
  "semi", "shika", "suzume", "tako", "tanuki", "tori", "tora", "tsuru",
  "uma", "ushi", "usagi", "wani", "washi", "ebi", "kani", "koi",
  // Colours
  "aka", "ao", "yamabuki", "kuro", "midori", "murasaki", "shiro", "hai",
  "kogane", "gin", "beni", "sumi", "asagi", "tamamushi", "kohaku", "ruri",
  // Things in a house
  "andon", "byobu", "chawan", "fude", "futon", "hako", "hashira", "kagami",
  "kago", "kama", "kami", "kasa", "katana", "kushi", "mado", "makura",
  "nabe", "noren", "obi", "ogi", "sara", "sudare", "tatami", "tansu",
  "tokonoma", "tsuzumi", "wan", "yakata", "zabuton", "haori", "geta", "tabi",
  // Places and made things
  "hokora", "ichiba", "jinja", "koya", "machi", "mura", "niwa", "tera",
  "mon", "yane", "yashiki", "yagura", "hori", "ido", "kabe", "kado",
  // Body and person
  "ashi", "hitomi", "kata", "kubi", "kokoro", "koe", "mimi", "te",
  "tomo", "yubi", "hone", "hada", "yume", "chikara", "waza", "kage",
  // Time and seasons
  "aki", "fuyu", "haru", "natsu", "yoru", "hiru", "yoake", "tasogare",
  "kesa", "kyonen", "mukashi", "ima", "toki", "hibi", "tsukihi", "hinata",
  // Qualities and small things
  "awa", "hikaru", "hira", "hoshizora", "kakera", "kiseki", "komorebi", "kotoba",
  "makoto", "midare", "nagare", "nazo", "nioi", "oto", "sazanami", "shizuku",
  "shirabe", "sukima", "tama", "tayori", "utage", "uta", "wa", "yosuga",
  // Tools, craft and cloth
  "hasami", "hari", "himo", "ito", "nomi", "kanzashi", "kinu", "momen",
  "nawa", "nuno", "ori", "sao", "shuriken", "sumire", "tsurugi", "yari",
  "yumi", "zeni", "koban", "makimono", "tegami", "shirushi", "hanko", "fumi",
  // Family names, so the house can have permanent codes it will remember.
  "hanako", "kamiko", "john", "alecia",
] as const;
