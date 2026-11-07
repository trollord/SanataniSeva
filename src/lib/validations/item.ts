import { z } from "zod";
import {
  ITEM_CATEGORIES,
  VEHICLE_TYPES,
  ITEM_CONDITIONS,
} from "@/lib/constants";

/**
 * Wizard split: step 1 = details, step 2 = photos (handled separately),
 * step 3 = pricing. The server-side body merges steps 1 and 3.
 */

export const itemStep1Schema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters").max(120),
    description: z
      .string()
      .min(20, "Describe the item in at least 20 characters")
      .max(2000),
    category: z.enum(ITEM_CATEGORIES as [string, ...string[]]),
    vehicleType: z
      .enum(VEHICLE_TYPES as [string, ...string[]])
      .optional()
      .or(z.literal("")),
    condition: z.enum(ITEM_CONDITIONS as [string, ...string[]]),
    brand: z.string().max(80).optional().or(z.literal("")),
    yearPurchased: z.coerce
      .number()
      .int()
      .min(1950)
      .max(new Date().getFullYear())
      .optional()
      .or(z.literal(0))
      .or(z.nan()),
    pickupLocality: z.string().min(2, "Pickup locality is required").max(80),
    pickupArea: z.string().max(120).optional().or(z.literal("")),
  })
  .refine(
    (d) => d.category !== "VEHICLES" || !!d.vehicleType,
    { message: "Pick a vehicle type", path: ["vehicleType"] }
  );

export const itemStep3Schema = z.object({
  price: z.coerce.number().positive("Price is required").max(100_000_000),
  priceNegotiable: z.boolean().default(false),
  phonePublic: z.boolean().default(true),
});

export const itemBodySchema = z
  .object({
    title: z.string().min(5).max(120),
    description: z.string().min(20).max(2000),
    category: z.enum(ITEM_CATEGORIES as [string, ...string[]]),
    vehicleType: z
      .enum(VEHICLE_TYPES as [string, ...string[]])
      .optional()
      .or(z.literal("")),
    condition: z.enum(ITEM_CONDITIONS as [string, ...string[]]),
    brand: z.string().max(80).optional().or(z.literal("")),
    yearPurchased: z.coerce.number().int().min(1950).max(new Date().getFullYear()).optional().nullable(),
    pickupLocality: z.string().min(2).max(80),
    pickupArea: z.string().max(120).optional().or(z.literal("")),
    price: z.coerce.number().positive().max(100_000_000),
    priceNegotiable: z.boolean().default(false),
    phonePublic: z.boolean().default(true),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          s3Key: z.string(),
          isPrimary: z.boolean(),
        })
      )
      .min(1, "At least 1 photo required")
      .max(6, "At most 6 photos")
      .default([]),
  })
  .refine(
    (d) => d.category !== "VEHICLES" || !!d.vehicleType,
    { message: "Pick a vehicle type", path: ["vehicleType"] }
  );

export type ItemBody = z.infer<typeof itemBodySchema>;
