# Phone Privacy Feature — Rollback Guide

To remove this feature completely, say:
> "Remove the phone privacy feature using the rollback guide"

---

## 1. Schema — revert `prisma/schema.prisma`
Remove these two lines:
- In `Property` model: `phonePublic Boolean @default(true)`
- In `Item` model: `phonePublic Boolean @default(true)`

Then run: `npx prisma db push`

---

## 2. Files to DELETE entirely
- `src/app/api/items/[id]/interest/route.ts`
- `src/components/marketplace/ItemContactSection.tsx`
- `src/components/marketplace/ItemInterestModal.tsx`

---

## 3. Files to REVERT (what to change back)

### `src/lib/validations/property.ts`
Remove from `propertyStep3Schema`: `phonePublic: z.boolean().default(true),`

### `src/lib/validations/item.ts`
- Remove from `itemStep3Schema`: `phonePublic: z.boolean().default(true),`
- Remove from `itemBodySchema`: `phonePublic: z.boolean().default(true),`

### `src/lib/email/templates.ts`
- Remove `message?` and `callbackTime?` params from `newInquiryEmail`
- Remove the two interpolated lines that render them in the email card
- Remove the entire `itemInterestEmail` function at the bottom

### `src/app/api/properties/[id]/inquire/route.ts`
Remove the two lines extracting `message` and `callbackTime` from body, and revert `newInquiryEmail` call to not pass those fields.

### `src/components/property/InterestModal.tsx`
Revert to original — remove `message`, `callbackTime`, and `CALLBACK_TIMES`. Keep only `phone` field.

### `src/app/(public)/marketplace/[id]/page.tsx`
- Remove `import { auth }` and `import ItemContactSection`
- Remove `phonePublic` from Prisma select
- Revert `Promise.all([getItem(id), auth()])` back to `getItem(id)` only
- Replace `<ItemContactSection .../>` with the original two `<a>` Call/WhatsApp buttons

### `src/components/marketplace/ItemForm.tsx`
- Remove `phonePublic: z.boolean().default(true)` from `detailsSchema`
- Remove the `phonePublic` Controller/toggle UI block

### `src/app/dashboard/new/page.tsx`
- Remove the "Phone visibility toggle" `<div>` block (the checkbox + description)

---

## 4. Existing files that were only extended (safe, no rollback needed unless reverting above)
- `src/app/api/properties/route.ts` — no changes needed, `phonePublic` flows through `...rest`
- `src/app/api/items/route.ts` — no changes needed, `phonePublic` flows through `...rest`
