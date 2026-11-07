import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions for using Sanatani Community - an independent property listing platform for Hiranandani Estate, Thane.",
};

const LAST_UPDATED = "19 July 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg sm:text-xl font-bold text-[#FF5F15] mb-3">{title}</h2>
      <div className="text-sm sm:text-[15px] text-gray-500 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase mb-3">
          Legal
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl font-bold text-[#FF5F15] mb-3">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-gray-400 mb-10 sm:mb-14">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Acceptance of These Terms">
          <p>
            By accessing or using Sanatani Community, accessible at hiranandaniproperties.in (the &ldquo;Platform&rdquo;), you agree
            to be bound by these Terms &amp; Conditions. If you do not agree with any part of
            these terms, please do not use the Platform.
          </p>
        </Section>

        <Section title="2. About the Platform">
          <p>
            Sanatani Community is an independent online property listing platform that
            helps property seekers discover residential and commercial properties located in
            the Hiranandani Estate locality of Thane, Maharashtra, and connect directly with
            the owners of those properties. The Platform is a product of <b>ByteLights</b>.
          </p>
        </Section>

        <Section title="3. No Affiliation with the Hiranandani Group">
          <p>
            The Platform is <b>not affiliated with, endorsed by, sponsored by, or in any way
            connected to the Hiranandani Group</b>, House of Hiranandani, or any of their group
            companies, subsidiaries, or promoters. The word &ldquo;Hiranandani&rdquo; is used on
            this Platform solely to describe the geographic locality - Hiranandani Estate,
            Thane - in which the listed properties are situated.
          </p>
          <p>
            <b>The Hiranandani Group is not the seller, lessor, or listing party</b> of any
            property appearing on this Platform. All properties are listed by their respective
            independent owners, and we operate purely as an independent listing and advisory
            platform facilitating direct contact between seekers and owners.
          </p>
        </Section>

        <Section title="4. Eligibility & Accounts">
          <p>
            You must be at least 18 years old and legally capable of entering into contracts to
            use the Platform. You are responsible for the accuracy of the information you
            provide, for maintaining the confidentiality of your account credentials, and for
            all activity under your account.
          </p>
        </Section>

        <Section title="5. Listings & Verification">
          <p>
            Property listings are submitted by owners and reviewed by our team before going
            live. While we make reasonable efforts to verify listings and owners, we do not
            guarantee the accuracy, completeness, legality, or current availability of any
            listing. Property details, prices, and availability may change without notice.
          </p>
          <p>
            You are solely responsible for carrying out your own due diligence - including
            title verification, legal checks, physical inspection, and independent legal or
            financial advice - before entering into any transaction.
          </p>
        </Section>

        <Section title="6. Fees">
          <p>
            Browsing listings and registering interest is free for seekers. Listing a property
            is free for owners. A flat advisory fee becomes payable to the Platform only after
            a transaction facilitated through the Platform is concluded, as communicated at the
            relevant time. Any statutory taxes are additional.
          </p>
        </Section>

        <Section title="7. The Platform Is Not a Party to Transactions">
          <p>
            Any negotiation, agreement, or transaction concluded between a seeker and a
            property owner is strictly between those parties. We are not a party to, and accept
            no responsibility or liability for, any such transaction, including its
            performance, payment terms, possession, or documentation.
          </p>
        </Section>

        <Section title="8. User Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>post false, misleading, or unauthorized listings or information;</li>
            <li>use the Platform for any unlawful purpose or in breach of applicable law;</li>
            <li>harvest or misuse contact details of other users;</li>
            <li>attempt to circumvent, disrupt, or compromise the Platform&rsquo;s security; or</li>
            <li>impersonate any person or misrepresent your affiliation with any entity.</li>
          </ul>
          <p>We may remove content or suspend accounts that violate these terms.</p>
        </Section>

        <Section title="9. Payments">
          <p>
            Online payments on the Platform are processed by third-party payment providers
            (such as Razorpay). Your use of those services is subject to the provider&rsquo;s
            own terms. We do not store your card or banking credentials.
          </p>
        </Section>

        <Section title="10. Intellectual Property">
          <p>
            The Platform&rsquo;s design, software, and original content are owned by ByteLights.
            Listing photographs and descriptions remain the property of the respective owners
            who submitted them and are displayed with their permission. You may not copy,
            scrape, or reuse Platform content without prior written consent.
          </p>
        </Section>

        <Section title="11. Disclaimer & Limitation of Liability">
          <p>
            The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
            basis without warranties of any kind, express or implied. To the maximum extent
            permitted by law, ByteLights and the Platform shall not be liable for any indirect,
            incidental, consequential, or special damages, or for any loss arising out of any
            property transaction, use of the Platform, or reliance on any listing.
          </p>
        </Section>

        <Section title="12. Indemnification">
          <p>
            You agree to indemnify and hold harmless ByteLights and the Platform from any
            claims, losses, or expenses (including reasonable legal fees) arising out of your
            use of the Platform, your listings, or your breach of these terms.
          </p>
        </Section>

        <Section title="13. Termination">
          <p>
            We may suspend or terminate access to the Platform at any time for conduct that
            violates these terms or is otherwise harmful to the Platform or its users. You may
            stop using the Platform at any time.
          </p>
        </Section>

        <Section title="14. Governing Law & Jurisdiction">
          <p>
            These terms are governed by the laws of India. Courts at Thane, Maharashtra shall
            have exclusive jurisdiction over any dispute arising out of or relating to the
            Platform or these terms.
          </p>
        </Section>

        <Section title="15. Changes to These Terms">
          <p>
            We may update these terms from time to time. The &ldquo;Last updated&rdquo; date at
            the top reflects the latest revision. Continued use of the Platform after changes
            are posted constitutes acceptance of the revised terms.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>
            For questions about these terms or the Platform, reach us through the contact
            options on the Platform or via the details in the footer.
          </p>
        </Section>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/" className="text-sm font-medium text-[#FF5F15] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
