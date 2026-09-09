-- The address was unique because it was the primary key. Moving the key to the
-- id took that with it, and nothing put it back: two members could have held
-- the same address, and every lookup by address — signing in among them —
-- had no index to use.
--
-- Postgres treats nulls as distinct in a unique index, which is exactly what
-- is wanted here: one address belongs to one member, and any number of kept
-- records may have none.
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
