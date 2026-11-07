import { z } from "zod";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";

export const propertyStep1Schema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(30, "Description must be at least 30 characters"),
  type: z.enum(["FLAT", "HOUSE", "VILLA", "OFFICE", "SHOP"]),
  listingType: z.enum(["RENT", "SALE"]),
  address: z.string().min(5, "Address is required"),
  building: z.string().min(2, "Building name is required"),
  flatNumber: z.string().optional(),
  locality: z.enum(HIRANANDANI_LOCALITIES, {
    error: () => ({ message: "Select a valid Hiranandani locality" }),
  }),
  bedrooms: z.coerce.number().min(1).max(10).optional(),
  bathrooms: z.coerce.number().min(1).max(10).optional(),
  areaSqft: z.coerce.number().min(100, "Area must be at least 100 sq.ft"),
  floor: z.coerce.number().min(0).max(100).optional(),
  totalFloors: z.coerce.number().min(1).max(100).optional(),
  furnished: z.enum(["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"]),
  amenities: z.array(z.string()).default([]),
  latitude: z.coerce.number({ message: "Pin the property location on the map" }),
  longitude: z.coerce.number({ message: "Pin the property location on the map" }),
});

export const propertyStep3Schema = z.object({
  price: z.coerce.number().min(1000, "Price must be at least ₹1,000"),
  deposit: z.coerce.number().min(0).optional(),
  rentNegotiable: z.boolean().default(false),
  lockInMonths: z.coerce.number().int().min(0).max(60).optional(),
  lockInNegotiable: z.boolean().default(false),
  phonePublic: z.boolean().default(true),
  // "IMMEDIATE", a "YYYY-MM-DD" date, or null/"" for not specified
  availableFrom: z
    .preprocess(
      (v) => (v === "" || v == null ? null : v),
      z
        .union([
          z.literal("IMMEDIATE"),
          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid availability date"),
        ])
        .nullable()
    )
    .optional(),
});

export const propertyImageSchema = z.object({
  url: z.url(),
  s3Key: z.string(),
  isPrimary: z.boolean().default(false),
});

export const createPropertySchema = z.object({
  ...propertyStep1Schema.shape,
  ...propertyStep3Schema.shape
});
export type PropertyStep1 = z.infer<typeof propertyStep1Schema>;
export type PropertyStep3 = z.infer<typeof propertyStep3Schema>;
export type CreateProperty = z.infer<typeof createPropertySchema>;
