import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminShell
      userName={session.user.name ?? session.user.email ?? "Admin"}
      userRole={session.user.role}
    >
      {children}
    </AdminShell>
  );
}
