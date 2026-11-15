-- Service-provider categories and subcategories move out of the code
-- (COMMUNITY_CATEGORIES in src/lib/community.ts) and into the database, so
-- admins can manage them from /admin/categories.
--
-- Hand-written, like every migration touching CommunityContact: the table has
-- a GENERATED searchText column (20261109090000) that `prisma migrate dev`
-- would try to recreate as a plain column. The DDL below is what
-- `prisma migrate diff` produces for the schema change, reordered so the
-- categories exist before anything references them.
--
-- Additive only. No contact is given a subcategory and none are created here.

-- ── Tables ───────────────────────────────────────────────────────────────
CREATE TABLE "DirectoryCategory" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectoryCategory_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "DirectorySubcategory" (
    "id" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectorySubcategory_pkey" PRIMARY KEY ("id")
);

-- Also serves as the index on the categoryKey foreign key.
CREATE UNIQUE INDEX "DirectorySubcategory_categoryKey_label_key" ON "DirectorySubcategory"("categoryKey", "label");

-- Supabase exposes `public` through PostgREST; see 20261107000000_enable_rls.
ALTER TABLE "DirectoryCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DirectorySubcategory" ENABLE ROW LEVEL SECURITY;

-- ── The 24 existing categories, same keys, labels, icons and order ───────
INSERT INTO "DirectoryCategory" ("key", "label", "icon", "sortOrder", "updatedAt") VALUES
  ('appliance',    'AC, Appliances & Equipment', 'AirVent',        0,  CURRENT_TIMESTAMP),
  ('automobile',   'Automobile',                 'Car',            1,  CURRENT_TIMESTAMP),
  ('finance',      'Banks & Finance',            'Landmark',       2,  CURRENT_TIMESTAMP),
  ('carpenter',    'Carpenters & Interiors',     'Hammer',         3,  CURRENT_TIMESTAMP),
  ('classes',      'Classes & Hobbies',          'Palette',        4,  CURRENT_TIMESTAMP),
  ('cleaning',     'Cleaning & Pest',            'Sparkles',       5,  CURRENT_TIMESTAMP),
  ('electrician',  'Electricians',               'Zap',            6,  CURRENT_TIMESTAMP),
  ('emergency',    'Emergency & Helplines',      'Siren',          7,  CURRENT_TIMESTAMP),
  ('food',         'Food, Restaurants & Hotels', 'ChefHat',        8,  CURRENT_TIMESTAMP),
  ('grocery',      'Grocery & Kirana',           'ShoppingBag',    9,  CURRENT_TIMESTAMP),
  ('health',       'Health & Pharmacy',          'Stethoscope',    10, CURRENT_TIMESTAMP),
  ('laundry',      'Laundry & Tailor',           'Shirt',          11, CURRENT_TIMESTAMP),
  ('movers',       'Movers & Courier',           'Truck',          12, CURRENT_TIMESTAMP),
  ('ngo',          'NGOs & Donations',           'HeartHandshake', 13, CURRENT_TIMESTAMP),
  ('painter',      'Painters & Repairs',         'PaintRoller',    14, CURRENT_TIMESTAMP),
  ('pets',         'Pets & Garden',              'Leaf',           15, CURRENT_TIMESTAMP),
  ('plumber',      'Plumbers',                   'Wrench',         16, CURRENT_TIMESTAMP),
  ('printing',     'Printing & Stationery',      'Printer',        17, CURRENT_TIMESTAMP),
  ('professional', 'Professional Services',      'Briefcase',      18, CURRENT_TIMESTAMP),
  ('property',     'Property & Brokers',         'Building2',      19, CURRENT_TIMESTAMP),
  ('salon',        'Salon & Spa',                'Scissors',       20, CURRENT_TIMESTAMP),
  ('tuition',      'Schools & Tuitions',         'GraduationCap',  21, CURRENT_TIMESTAMP),
  ('shopping',     'Shops & Retail',             'ShoppingBag',    22, CURRENT_TIMESTAMP),
  ('religious',    'Temples & Trusts',           'Flame',          23, CURRENT_TIMESTAMP);

-- ── CommunityContact ─────────────────────────────────────────────────────
ALTER TABLE "CommunityContact" ADD COLUMN "subcategoryId" TEXT;

CREATE INDEX "CommunityContact_subcategoryId_idx" ON "CommunityContact"("subcategoryId");

-- ── Foreign keys ─────────────────────────────────────────────────────────
-- category -> DirectoryCategory: checked read-only on 2026-11-15, all 338
-- rows used one of the 24 keys above, and every write path validates against
-- the same list. RESTRICT backs up the admin rule that a category in use
-- cannot be deleted.
ALTER TABLE "CommunityContact" ADD CONSTRAINT "CommunityContact_category_fkey" FOREIGN KEY ("category") REFERENCES "DirectoryCategory"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommunityContact" ADD CONSTRAINT "CommunityContact_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "DirectorySubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DirectorySubcategory" ADD CONSTRAINT "DirectorySubcategory_categoryKey_fkey" FOREIGN KEY ("categoryKey") REFERENCES "DirectoryCategory"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
