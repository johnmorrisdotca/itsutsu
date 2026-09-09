import { countryFrom } from "@/lib/social/countries";

/**
 * Where somebody is, beside their name.
 *
 * The profile form has told members for a long time that their country shows
 * on the players page. It did not show anywhere at all: the field was written
 * and stored and then never read. John found it by setting his own to Canada
 * and his mother's to Japan and seeing neither.
 *
 * The flag is the whole point — it is read at a glance, in any language, and
 * on a turn-based site where a game takes a week it is most of what tells you
 * why your opponent answers at four in the morning. Where the words cannot be
 * resolved to a country they are still shown, without a flag: somebody who
 * wrote something unexpected still lives somewhere, and a wrong flag on their
 * own profile would be worse than none.
 */
export function CountryMark({
  country,
  className = "",
  showName = false,
}: {
  country: string | null | undefined;
  className?: string;
  /** Say the country in words as well, where there is room for it. */
  showName?: boolean;
}) {
  const written = (country ?? "").trim();
  if (written === "") return null;
  const found = countryFrom(written);

  if (found === null) {
    return (
      <span className={className} data-testid="country-mark" data-country="">
        {written}
      </span>
    );
  }

  return (
    <span className={className} data-testid="country-mark" data-country={found.code}>
      {/*
        The flag carries the meaning, so it is not hidden from a reader who
        cannot see it: the country's name is the label either way.
      */}
      <span aria-hidden="true">{found.flag}</span>
      <span className={showName ? "ml-1" : "sr-only"}>{found.name}</span>
    </span>
  );
}
