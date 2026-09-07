-- The cells of a multi-cell piece.
--
-- Additive: one nullable JSON column on Move, null for every move that is a
-- single stone, a slide, a twist or a pass.

ALTER TABLE "Move" ADD COLUMN "cells" JSONB;
