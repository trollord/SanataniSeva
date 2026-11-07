import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";
import SessionProvider from "@/components/layout/SessionProvider";
import DisclaimerPopup from "@/components/layout/DisclaimerPopup";
import WarmDB from "@/components/WarmDB";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// Explicit viewport so in-app browsers (WhatsApp, Instagram) and notched
// devices render at the correct scale, edge to edge
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://www.bluebrics.com"),
  title: {
    default: "Sanatani Community - Houses & Flats in Hiranandani Estate, Thane | Zero Brokerage",
    template: "%s | Sanatani Community",
  },
  description:
    "Find verified houses and flats for rent and sale in Hiranandani Estate, Thane. Connect directly with owners - zero brokerage, free to browse and register interest.",
  keywords: [
    "houses in Hiranandani Estate",
    "flats in Hiranandani Estate Thane",
    "Hiranandani Estate rent",
    "Hiranandani Estate flats for sale",
    "Hiranandani Meadows",
    "Rodas Enclave",
    "One Hiranandani Park",
    "Thane real estate",
    "zero brokerage Thane",
    "flats for rent Thane",
    "flats for sale Thane",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Sanatani Community",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch session on server so SessionProvider hydrates instantly -
  // no loading flash, no stale state when navigating between route groups
  const session = await auth();

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {/* Structured data: who we are + site search entity */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Sanatani Community",
                url: process.env.NEXTAUTH_URL ?? "https://www.bluebrics.com",
                description:
                  "Independent zero-brokerage property listing platform for Hiranandani Estate, Thane.",
                areaServed: "Hiranandani Estate, Thane, Maharashtra, India",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Sanatani Community",
                url: process.env.NEXTAUTH_URL ?? "https://www.bluebrics.com",
              },
            ]),
          }}
        />
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-41296L6STP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-41296L6STP');
          `}
        </Script>
        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xotembw6ob");
          `}
        </Script>
        <SessionProvider session={session}>
          <WarmDB />
          <DisclaimerPopup />
          {children}
          <Toaster richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
