import Navbar from "@/components/layout/Navbar";

/**
 * Shell for app-like screens that own the viewport.
 *
 * Same navbar as the rest of the public site, but no footer: these pages size
 * themselves to the viewport and scroll their own panes, so anything placed
 * after them would be unreachable without reintroducing the document scroll
 * they exist to avoid.
 */
export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh md:h-dvh flex-col">
      <Navbar />
      <main className="flex-1 min-h-0 min-w-0 flex flex-col">{children}</main>
    </div>
  );
}
