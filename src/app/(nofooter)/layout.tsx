import Navbar from "@/components/layout/Navbar";

/**
 * Shell for reading screens: the same navbar as the rest of the public site,
 * but no footer. Unlike the fullscreen shell these pages still scroll as a
 * normal document.
 */
export default function NoFooterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
