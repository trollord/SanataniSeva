-- A contact can have several numbers; `phone` could only hold one, so the
-- importer parked extras in `notes` as "Alt: 9004346939, 9876543210." This
-- replaces the scalar with a real text[] and pulls those numbers back out of
-- prose, so nothing is stranded in a free-text field.

ALTER TABLE "CommunityContact" ADD COLUMN "phones" TEXT[] NOT NULL DEFAULT '{}';

-- Primary number first, then any Alt: numbers in the order they were written.
-- Blank numbers are skipped, so a contact with none gets an empty array rather
-- than an array containing an empty string.
UPDATE "CommunityContact" c
SET "phones" = sub.phones
FROM (
  SELECT
    id,
    ARRAY(
      SELECT trim(n)
      FROM unnest(
        CASE WHEN btrim(coalesce("phone", '')) = ''
             THEN ARRAY[]::text[]
             ELSE ARRAY[btrim("phone")]
        END
        ||
        -- ([^.]*) stops at the sentence-ending period, so the captured group is
        -- just the numbers.
        CASE
          WHEN "notes" ~ 'Alt: '
          THEN string_to_array(substring("notes" from 'Alt: ([^.]*)'), ',')
          ELSE ARRAY[]::text[]
        END
      ) AS n
      WHERE btrim(n) <> ''
    ) AS phones
  FROM "CommunityContact"
) sub
WHERE c.id = sub.id;

-- Drop the now-duplicated "Alt: ..." sentence, leaving the rest of the note
-- (provenance and review reasons) intact, and tidy any doubled spaces.
UPDATE "CommunityContact"
SET "notes" = nullif(btrim(regexp_replace(regexp_replace("notes", 'Alt: [^.]*\.', '', 'g'), '\s+', ' ', 'g')), '')
WHERE "notes" ~ 'Alt: ';

ALTER TABLE "CommunityContact" DROP COLUMN "phone";
