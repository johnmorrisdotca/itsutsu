/** The first characters of every level's board and the hash of every board, run together in level order. */
export type SuidoBoardsOf = { prefixLength: number; prefixes: string; hashes: string };

/** For each size, its levels' boards so known, and under `big` the sixty-four big-pieces levels, in their own order, whatever their sizes (`levelBoards.data.ts`). */
export type SuidoLevelBoards = Readonly<Record<number, SuidoBoardsOf>> & { readonly big: SuidoBoardsOf };
