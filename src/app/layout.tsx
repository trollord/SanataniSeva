import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";
import SessionProvider from "@/components/layout/SessionProvider";
import WarmDB from "@/components/WarmDB";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { SITE_URL } from "@/lib/constants";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Sanatani Seva - Homes, Local Services & Marketplace in Hiranandani Estate, Thane",
    template: "%s | Sanatani Seva",
  },
  description:
    "Everything Hiranandani Estate residents need in one place: flats for rent and sale, a directory of trusted local plumbers, electricians, doctors and shops, a resident marketplace, bus timings and the estate newspaper. Free to browse.",
  keywords: [
    // Housing
    "houses in Hiranandani Estate",
    "flats in Hiranandani Estate Thane",
    "Hiranandani Estate rent",
    "Hiranandani Estate flats for sale",
    "direct owner listings Thane",
    "Hiranandani Meadows",
    "Rodas Enclave",
    "One Hiranandani Park",
    // Local services - the directory is a large part of the site now
    "plumber Hiranandani Estate",
    "electrician Hiranandani Estate",
    "carpenter Hiranandani Estate",
    "doctors in Hiranandani Estate Thane",
    "local services Hiranandani Estate",
    "emergency numbers Thane",
    // Everything else the site carries
    "Hiranandani Estate marketplace",
    "Hiranandani Estate bus timings",
    "Hiranandani Estate newspaper",
    "Thane real estate",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Sanatani Seva",
    title: "Sanatani Seva - Homes, Local Services & Marketplace in Hiranandani Estate",
    description:
      "Flats for rent and sale, a directory of trusted local services, a resident marketplace, bus timings and the estate newspaper - for Hiranandani Estate, Thane.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanatani Seva - Hiranandani Estate, Thane",
    description:
      "Flats for rent and sale, trusted local services, a resident marketplace and bus timings for Hiranandani Estate.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Phone numbers fill the directory; leave them to our own tel: links rather
  // than letting iOS Safari linkify every number it finds.
  formatDetection: { telephone: false },
  applicationName: "Sanatani Seva",
  category: "community",
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
                name: "Sanatani Seva",
                url: SITE_URL,
                description:
                  "Independent, direct-to-owner property listing platform for Hiranandani Estate, Thane.",
                areaServed: "Hiranandani Estate, Thane, Maharashtra, India",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Sanatani Seva",
                url: SITE_URL,
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
          <ConfirmProvider>
            <WarmDB />
            {children}
            <Toaster richColors position="top-right" />
          </ConfirmProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
