// Static blog content - no CMS needed at this scale. Each post is a list of
// typed blocks so rendering stays consistent with the site's design system.

export interface BlogBlock {
  type: "p" | "h2" | "ul";
  text?: string;
  items?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  readTime: string;
  blocks: BlogBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-zero-brokerage-saves-you-lakhs",
    title: "How Zero Brokerage Saves You Lakhs - The Real Math",
    excerpt:
      "On a ₹2 crore flat, the typical 1–2% commission is ₹2–4 lakhs. Here's exactly where that money goes in a traditional deal - and how connecting directly with owners keeps it in your pocket.",
    date: "2026-07-18",
    readTime: "4 min read",
    blocks: [
      {
        type: "p",
        text: "When people budget for a new home, they think about the price, the registration, the loan. The line item that quietly surprises them at the end is the commission - typically one to two percent of the property value on a sale, or one to two months of rent on a lease.",
      },
      { type: "h2", text: "The numbers, concretely" },
      {
        type: "ul",
        items: [
          "Buying a ₹2 crore flat at 2% commission: ₹4,00,000 - roughly the cost of furnishing an entire 2BHK.",
          "Renting at ₹60,000/month with one month's commission: ₹60,000 before you've paid your deposit.",
          "Reletting after an 11-month agreement? That commission often repeats every single renewal.",
        ],
      },
      {
        type: "p",
        text: "None of this money improves the home you're buying or renting. It's a discovery cost - the price of finding the other party. And in a well-mapped, tightly-knit township like Hiranandani Estate, discovery is exactly the problem technology solves better.",
      },
      { type: "h2", text: "What Sanatani Community does differently" },
      {
        type: "p",
        text: "Owners list directly, for free. Our team verifies every listing before it goes live. Seekers browse verified homes, register interest for free, and talk to the owner directly - no intermediary in the conversation, no percentage riding on the deal. We charge a flat advisory fee only after a transaction actually closes, which is a fraction of a percentage-based commission.",
      },
      {
        type: "p",
        text: "On that same ₹2 crore flat, our users keep essentially the entire ₹4 lakh difference. Over the first few months after launch, that's the single most common piece of feedback we hear: the savings feel almost too simple.",
      },
      {
        type: "p",
        text: "Browse the current verified listings in Hiranandani Estate and see the difference for yourself - registering interest costs nothing.",
      },
    ],
  },
  {
    slug: "renting-in-hiranandani-estate-thane-guide",
    title: "Renting in Hiranandani Estate, Thane: The Complete Guide",
    excerpt:
      "Localities, typical rents, deposits, lock-in periods and the questions worth asking before you sign - everything a first-time tenant in Hiranandani Estate should know.",
    date: "2026-07-21",
    readTime: "6 min read",
    blocks: [
      {
        type: "p",
        text: "Hiranandani Estate on Ghodbunder Road is one of Thane's most sought-after townships - neo-classical towers, tree-lined internal roads, schools, hospitals and high-street retail inside the gates. If you're planning to rent here, this guide covers what to expect.",
      },
      { type: "h2", text: "Know the localities" },
      {
        type: "ul",
        items: [
          "Hiranandani Estate (core) - the widest range of towers and configurations.",
          "Hiranandani Meadows - quieter, family-oriented pocket with mature greenery.",
          "Rodas Enclave - premium low-density enclave with larger layouts.",
          "One Hiranandani Park - newer towers with modern amenities and clubhouses.",
        ],
      },
      { type: "h2", text: "What things cost" },
      {
        type: "p",
        text: "As of 2026, well-maintained 1BHKs typically rent in the ₹25–35k range, 2BHKs between ₹35–55k, and 3BHKs from ₹55k upwards depending on tower, floor and furnishing. Deposits usually run three to six months' rent, and most owners ask for an 11-month agreement with a lock-in.",
      },
      { type: "h2", text: "Questions to ask before signing" },
      {
        type: "ul",
        items: [
          "Is the lock-in period negotiable, and what happens if you exit early?",
          "What exactly does the maintenance charge cover, and who pays it?",
          "Are society transfer charges or move-in charges applicable?",
          "Is the furnishing list written into the agreement with photographs?",
          "When was the last rent revision, and what escalation is expected at renewal?",
        ],
      },
      {
        type: "p",
        text: "Every listing on Sanatani Community shows the deposit, lock-in and availability upfront, and you talk to the owner directly - so the answers to these questions come from the person who actually owns the home. Registering interest is free.",
      },
    ],
  },
  {
    slug: "how-sanatani-community-works",
    title: "Direct From Owners: How Sanatani Community Actually Works",
    excerpt:
      "Free verified listings, direct owner contact, and a flat advisory fee only when a deal closes - a transparent look at our model and why we built it this way.",
    date: "2026-07-23",
    readTime: "3 min read",
    blocks: [
      {
        type: "p",
        text: "Sanatani Community is an independent listing platform built for one place we know deeply: Hiranandani Estate, Thane. Because we focus on a single township, every listing can be individually verified and every price can be sanity-checked against real local data.",
      },
      { type: "h2", text: "For owners" },
      {
        type: "p",
        text: "Listing is free. You add photos and videos, set your price, deposit and availability, and submit. Our team reviews every listing before it goes live - verified listings earn more trust and significantly more responses. When a seeker registers interest, you get their contact instantly by email and can reach them on WhatsApp in one tap.",
      },
      { type: "h2", text: "For seekers" },
      {
        type: "p",
        text: "Browsing is free and requires no paperwork. Filter by locality, budget, configuration and availability, register interest on homes you like, and speak directly with owners. No percentage commission changes hands at any point.",
      },
      { type: "h2", text: "How we sustain it" },
      {
        type: "p",
        text: "We charge a flat advisory fee only after a transaction concludes successfully. No listing fees, no contact-unlock fees, no subscription. If your deal doesn't happen, you owe nothing. That alignment - we only win when your deal closes - is the entire business model, stated in one sentence.",
      },
    ],
  },
  {
    slug: "resale-flat-buying-checklist-thane",
    title: "Buying a Resale Flat in Thane? Run This 10-Point Checklist First",
    excerpt:
      "From title documents and OC to society dues and RERA history - the due-diligence checklist we recommend every buyer completes before paying a token amount.",
    date: "2026-07-25",
    readTime: "5 min read",
    blocks: [
      {
        type: "p",
        text: "A resale flat can be fantastic value - mature society, settled neighbours, no construction risk. But resale also means history, and history needs checking. Here's the checklist we recommend before any money changes hands.",
      },
      { type: "h2", text: "The 10-point checklist" },
      {
        type: "ul",
        items: [
          "Title chain: sale deeds for every previous transfer, ideally verified by a lawyer.",
          "Occupation Certificate (OC) for the building.",
          "Share certificate and society membership records in the seller's name.",
          "No-dues certificate from the society (maintenance, sinking fund, arrears).",
          "Property tax receipts up to date.",
          "Encumbrance check - any loans against the flat must be closed or accounted for in the deal.",
          "Approved floor plan vs. actual layout - unauthorised alterations complicate loans.",
          "If the building is under redevelopment discussions, understand the timeline and terms.",
          "Bank loan eligibility on the specific building (some lenders maintain approved-project lists).",
          "Registration and stamp duty costs budgeted at current Maharashtra rates.",
        ],
      },
      {
        type: "p",
        text: "None of this is exotic - it's an afternoon of document collection when the seller is organised. Dealing directly with the owner, as you do on Sanatani Community, usually makes that faster: the person answering your questions is the person who holds the documents.",
      },
      {
        type: "p",
        text: "This checklist is general guidance, not legal advice - for a purchase of this size, a few thousand rupees on a property lawyer is the best money you'll spend.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
