// Kumimoji's rules are their own open-source package (github.com/johnmorrisdotca/kumimoji, installed as @johnmorrisdotca/kumimoji);
// this module keeps its old address so the site and its browser specs import it unchanged.
export {
  assignHandTile,
  assignTableTile,
  deal,
  decodeTileProgress,
  draw,
  encodeTileProgress,
  isFinished,
  liftAll,
  liftToHand,
  mayDraw,
  mayTrade,
  moveOnTable,
  placeFromHand,
  readTileProgress,
  sortHand,
  swapWithHand,
  tilesLeft,
  trade,
  type TilePlay,
} from "@johnmorrisdotca/kumimoji";
