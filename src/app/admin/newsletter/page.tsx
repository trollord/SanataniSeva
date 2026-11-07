import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import UploadForm from "./UploadForm";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminNewsletterPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const editions = await prisma.newsletter.findMany({
    orderBy: { date: "desc" },
    select: { id: true, title: true, date: true, pageCount: true, status: true, pdfUrl: true },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Newspaper Editions</h1>

      <UploadForm />

      {editions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>No editions uploaded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Pages</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {editions.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{e.pageCount}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full ${
                      e.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/newspaper/${e.id}`}
                        target="_blank"
                        className="text-xs text-gray-600 border border-gray-200 hover:border-gray-400 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </Link>
                      <DeleteButton id={e.id} />
                    </div>
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
