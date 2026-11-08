-- A news item could hold one pasted image URL. Admins upload several now, so
-- this becomes a list, backfilled from the single column so nothing is lost.

ALTER TABLE "NewsItem" ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "NewsItem"
SET "imageUrls" = ARRAY[btrim("imageUrl")]
WHERE "imageUrl" IS NOT NULL AND btrim("imageUrl") <> '';

ALTER TABLE "NewsItem" DROP COLUMN "imageUrl";
