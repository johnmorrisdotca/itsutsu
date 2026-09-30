// Kumimoji's rules are their own open-source package (github.com/johnmorrisdotca/kumimoji, installed as @johnmorrisdotca/kumimoji);
// this module keeps its old address so the site and its browser specs import it unchanged.
export {
  boundsOf,
  decodeGrid,
  DIAGONAL_RUN_LEAST,
  encodeGrid,
  groupsOf,
  judgeGrid,
  lettersOf,
  placeOf,
  runsOf,
  sameLetters,
  squareAt,
  type Bounds,
  type GridRules,
  type GridVerdict,
  type Run,
  type RunLine,
  type Tiles,
} from "@johnmorrisdotca/kumimoji";
