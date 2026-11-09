-- Search across every column an admin might type into: name, person, service,
-- category, locality, address, tags and phone numbers.
--
-- Stored as a generated column so it can never drift from the row, and indexed
-- with pg_trgm so a leading-wildcard LIKE (the only kind that finds "pharma"
-- inside "Rush Pharma") can still use an index instead of scanning.
--
-- Phones are listed by subscript rather than array_to_string(), which is only
-- STABLE and so is rejected in a generated expression. Five matches the cap the
-- API enforces.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

ALTER TABLE "CommunityContact"
  ADD COLUMN "searchText" text GENERATED ALWAYS AS (
    lower(
      coalesce(name, '') || ' ' ||
      coalesce("contactPerson", '') || ' ' ||
      coalesce(service, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(locality, '') || ' ' ||
      coalesce(address, '') || ' ' ||
      coalesce(phones[1], '') || ' ' || coalesce(phones[2], '') || ' ' ||
      coalesce(phones[3], '') || ' ' || coalesce(phones[4], '') || ' ' ||
      coalesce(phones[5], '') || ' ' ||
      regexp_replace(
        coalesce(phones[1], '') || coalesce(phones[2], '') || coalesce(phones[3], '') ||
        coalesce(phones[4], '') || coalesce(phones[5], ''),
        '[^0-9]', '', 'g'
      ) || ' ' ||
      coalesce(replace(replace(replace(tags, '[', ''), ']', ''), '"', ''), '')
    )
  ) STORED;

CREATE INDEX "CommunityContact_searchText_trgm_idx"
  ON "CommunityContact" USING GIN ("searchText" extensions.gin_trgm_ops);
