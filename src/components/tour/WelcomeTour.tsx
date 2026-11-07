"use client";

import GuidedTour, { type TourStep } from "./GuidedTour";

const STEPS: TourStep[] = [
  {
    title: "Welcome to Sanatani Community 👋",
    body: "Your zero-brokerage home search for Hiranandani Estate, Thane. Here's a quick 30-second tour of how everything works.",
  },
  {
    target: '[data-tour="filters"], [data-tour="filters-mobile"]',
    title: "Filter your search",
    body: "Choose Buy or Rent, property type, locality, bedrooms and budget. Filters apply instantly - no button to press. Your active filters appear as removable tags above the results.",
  },
  {
    target: '[data-tour="sort-views"]',
    title: "Sort & change view",
    body: "Sort by price, newest or largest area, and switch between Grid and List layouts - whichever way you prefer to browse.",
  },
  {
    target: '[data-tour="property-card"]',
    title: "Explore a property",
    body: "Open any home to see photos, full details and its location on the map. Registering interest is completely free - you only pay a flat advisory fee after a deal is signed.",
  },
  {
    title: "You're all set ✨",
    body: "Own a property in Hiranandani Estate? List it for free from your dashboard, and share any listing on WhatsApp with one tap. Happy house-hunting!",
  },
];

export default function WelcomeTour() {
  return <GuidedTour steps={STEPS} storageKey="hh_tour_done" />;
}
