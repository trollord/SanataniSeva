import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CreateNewsForm from "./CreateNewsForm";
import NewsAdminActions from "./NewsAdminActions";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  EVENTS:        "Events",
  COMMUNITY:     "Community",
  ANNOUNCEMENTS: "Announcements",
  SPORTS:        "Sports",
  GENERAL:       "General",
};

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-800",
  DRAFT:     "bg-gray-100 text-gray-600",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminNewsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const items = await prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Today&apos;s News</h1>

      <CreateNewsForm />

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p className="text-sm">No news items yet — post one above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Headline</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-xs truncate">{item.headline}</p>
                    <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{item.body}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell text-xs">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                    {fmtDate(item.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full ${
                        STATUS_STYLES[item.status] ?? ""
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <NewsAdminActions id={item.id} status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
