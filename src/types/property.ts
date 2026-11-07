import type {
  Property,
  PropertyImage,
  PriceHistory,
  User,
  Inquiry,
} from "@prisma/client";

// Public property - flatNumber, owner contact stripped
export type PropertyPublic = Omit<Property, "flatNumber"> & {
  images: PropertyImage[];
  _count?: { inquiries: number };
};

// Property with primary image only (for cards)
export type PropertyCard = Pick<
  Property,
  | "id"
  | "title"
  | "type"
  | "listingType"
  | "locality"
  | "building"
  | "bedrooms"
  | "areaSqft"
  | "furnished"
  | "price"
  | "deposit"
  | "createdAt"
> & {
  images: PropertyImage[];
};

// Full detail - includes price history, no private fields
export type PropertyDetail = PropertyPublic & {
  priceHistory: PriceHistory[];
  owner: Pick<User, "id" | "name" | "image">;
};

// Admin/Manager view - includes flatNumber but NOT owner contact (handled at API layer)
export type PropertyAdmin = Property & {
  images: PropertyImage[];
  owner: Pick<User, "id" | "name" | "email" | "phone">;
  inquiries: Inquiry[];
};

export interface PropertiesResponse {
  properties: PropertyCard[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PropertyFilters {
  type?: string;
  listingType?: string;
  locality?: string;
  bedrooms?: string;
  minPrice?: string;
  maxPrice?: string;
  furnished?: string;
  view?: "grid" | "list" | "map";
  page?: string;
  [key: string]: string | undefined;
}
