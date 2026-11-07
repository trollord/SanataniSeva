"use client";

import GuidedTour, { type TourStep } from "./GuidedTour";

const STEPS: TourStep[] = [
  {
    title: "List your property 🏠",
    body: "It takes 4 quick steps: Property Details, Photos, Pricing and a final Review. Here's a quick look at what goes where.",
  },
  {
    target: '[data-tour="np-basic"]',
    title: "Basic information",
    body: "Pick the property type, choose Rent or Sale, and give your listing a clear title and description - this is the first thing seekers read.",
  },
  {
    target: '[data-tour="np-config"]',
    title: "Configuration & location",
    body: "Add bedrooms, bathrooms, area and floor details, then pin the exact location on the map so seekers can find your property easily.",
  },
  {
    target: '[data-tour="np-amenities"]',
    title: "Amenities",
    body: "Tick everything your property offers - parking, gym, security and more. Listings with complete amenities get noticeably more interest.",
  },
  {
    target: '[data-tour="np-footer"]',
    title: "Next: photos & pricing",
    body: "Use this bar to move ahead. After photos and pricing you'll review and submit - our team approves it, your listing goes live, and you'll get a ready-made WhatsApp message to share it.",
  },
];

export default function NewListingTour() {
  return <GuidedTour steps={STEPS} storageKey="hh_tour_new_listing_done" />;
}
