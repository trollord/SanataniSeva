/**
 * Icons an admin can give a directory category. Stored by lucide name in
 * DirectoryCategory.icon and looked up here, so the bundle carries only this
 * curated set rather than all of lucide.
 *
 * Removing a name from this map is safe: categories still using it fall back to
 * DEFAULT_DIRECTORY_ICON instead of breaking.
 */
import {
  AirVent,
  Baby,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  Car,
  ChefHat,
  Coffee,
  Dog,
  Droplets,
  Dumbbell,
  Flame,
  Gift,
  GraduationCap,
  Hammer,
  HeartHandshake,
  House,
  KeyRound,
  Landmark,
  Laptop,
  Leaf,
  Music,
  PaintRoller,
  Palette,
  Plane,
  Printer,
  Scissors,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Siren,
  Smartphone,
  Sofa,
  Sparkles,
  Stethoscope,
  Store,
  Truck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const DIRECTORY_ICONS = {
  // In use by the original 24 categories
  AirVent,
  Car,
  Landmark,
  Hammer,
  Palette,
  Sparkles,
  Zap,
  Siren,
  ChefHat,
  ShoppingBag,
  Stethoscope,
  Shirt,
  Truck,
  HeartHandshake,
  PaintRoller,
  Leaf,
  Wrench,
  Printer,
  Briefcase,
  Building2,
  Scissors,
  GraduationCap,
  Flame,
  // Extras for categories the estate is likely to add
  Users,
  Store,
  House,
  Sofa,
  KeyRound,
  Smartphone,
  Laptop,
  Camera,
  Music,
  Dumbbell,
  Baby,
  Dog,
  Bike,
  Coffee,
  Gift,
  BookOpen,
  Plane,
  ShieldCheck,
  Droplets,
} satisfies Record<string, LucideIcon>;

export type DirectoryIconName = keyof typeof DIRECTORY_ICONS;

export const DIRECTORY_ICON_NAMES = Object.keys(DIRECTORY_ICONS) as [
  DirectoryIconName,
  ...DirectoryIconName[],
];

/** Also what the directory showed for an unknown category before this existed. */
export const DEFAULT_DIRECTORY_ICON: DirectoryIconName = "Users";

export function isDirectoryIconName(name: string): name is DirectoryIconName {
  return Object.prototype.hasOwnProperty.call(DIRECTORY_ICONS, name);
}

/** An unknown or missing name gets the default. */
export function directoryIconName(name: string | null | undefined): DirectoryIconName {
  return name && isDirectoryIconName(name) ? name : DEFAULT_DIRECTORY_ICON;
}

/**
 * Never undefined: an unknown or missing name gets the default icon. Inside a
 * component body, index DIRECTORY_ICONS with directoryIconName() instead - the
 * React compiler lint reads a component returned from a call as one created
 * during render.
 */
export function directoryIcon(name: string | null | undefined): LucideIcon {
  return DIRECTORY_ICONS[directoryIconName(name)];
}
