import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SiteNavbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import MobileDashboardNav from "@/components/layout/MobileDashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const isOwnerPlus = ["OWNER", "ADMIN"].includes(session.user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNavbar forceScrolled />
      <div className="flex pt-[80px]">
        <DashboardSidebar
          name={session.user.name}
          email={session.user.email}
          role={session.user.role}
          isOwnerPlus={isOwnerPlus}
        />
        <main className="flex-1 overflow-auto md:ml-64">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>
      <MobileDashboardNav isOwnerPlus={isOwnerPlus} />
    </div>
  );
}
