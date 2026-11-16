-- Paid promotions of local businesses, shown on /promotions and managed from
-- /admin/promotions.
--
-- The DDL is what `prisma migrate diff` produces for the schema change, kept
-- hand-written like the other recent migrations. Additive only: one new table
-- and its foreign key to DirectoryCategory; no existing table is altered and
-- no rows are inserted.

-- ── Table ────────────────────────────────────────────────────────────────
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "categoryKey" TEXT,
    "offer" TEXT,
    "phone" TEXT,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "website" TEXT,
    "instagram" TEXT,
    "address" TEXT,
    "locality" TEXT,
    "hours" TEXT,
    "logoUrl" TEXT,
    "logoKey" TEXT,
    "imageUrls" TEXT[],
    "imageKeys" TEXT[],
    "spotlight" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    -- Calendar dates, read as IST days by the app; no time part to drift.
    "startsAt" DATE,
    "endsAt" DATE,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Promotion_slug_key" ON "Promotion"("slug");

-- Also serves as the index on the categoryKey foreign key.
CREATE INDEX "Promotion_categoryKey_idx" ON "Promotion"("categoryKey");

-- Supabase exposes `public` through PostgREST; see 20261107000000_enable_rls.
ALTER TABLE "Promotion" ENABLE ROW LEVEL SECURITY;

-- ── Foreign key ──────────────────────────────────────────────────────────
-- SET NULL, not RESTRICT: deleting a category should not be held up by a paid
-- promotion; the promotion simply shows without a category until reassigned.
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_categoryKey_fkey" FOREIGN KEY ("categoryKey") REFERENCES "DirectoryCategory"("key") ON DELETE SET NULL ON UPDATE CASCADE;
