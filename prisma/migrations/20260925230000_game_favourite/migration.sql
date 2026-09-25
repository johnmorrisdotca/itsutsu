-- A member's starred games, listed first among their finished games (John, 2026-09-25: "ability to
-- favourite your game, it moves to the top"). A new table: nothing existing is read or changed.
CREATE TABLE "GameFavourite" (
    "memberId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameFavourite_pkey" PRIMARY KEY ("memberId","gameId")
);

CREATE INDEX "GameFavourite_gameId_idx" ON "GameFavourite"("gameId");

ALTER TABLE "GameFavourite" ADD CONSTRAINT "GameFavourite_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GameFavourite" ADD CONSTRAINT "GameFavourite_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
