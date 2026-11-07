import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils/formatters";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { MessageSquare } from "lucide-react";

function contactMessage(seekerName: string | null, propertyTitle: string): string {
  return `Hi ${seekerName ?? "there"}, this is regarding your inquiry for "${propertyTitle}" on Sanatani Community. Happy to discuss the details!`;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
};

export default async function InquiriesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const inquiries = await prisma.inquiry.findMany({
    where: {
      property: { ownerId: session.user.id },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      phone: true,
      createdAt: true,
      property: {
        select: { id: true, title: true, locality: true },
      },
      seeker: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries Received</h1>
        <p className="text-sm text-gray-500 mt-1">
          Buyer and renter inquiries on your properties
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-white">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            No inquiries yet
          </h2>
          <p className="text-sm text-gray-500">
            Inquiries on your active listings will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {inquiries.map((inquiry) => {
              const contactPhone = inquiry.phone ?? inquiry.seeker.phone;
              const statusStyle = STATUS_STYLE[inquiry.status] ?? STATUS_STYLE.PENDING;
              return (
                <div key={inquiry.id} className="px-4 py-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 text-sm line-clamp-1 flex-1">
                      {inquiry.property.title}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusStyle}`}>
                      {inquiry.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{inquiry.property.locality}</p>
                  <p className="text-sm text-gray-800 font-medium">{inquiry.seeker.name ?? "Anonymous"}</p>
                  <p className="text-xs text-gray-600">{inquiry.seeker.email}</p>
                  {contactPhone && <p className="text-xs text-gray-500">{contactPhone}</p>}
                  <p className="text-xs text-gray-400">{formatDate(inquiry.createdAt)}</p>
                  {contactPhone && (
                    <a
                      href={whatsAppContactUrl(contactPhone, contactMessage(inquiry.seeker.name, inquiry.property.title))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-medium hover:bg-[#1fb958] transition-colors"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      Chat on WhatsApp
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left font-semibold text-gray-600 px-4 py-3">Property</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3">Seeker</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3">Contact</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3">Status</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3">Date</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inquiries.map((inquiry) => {
                  const contactPhone = inquiry.phone ?? inquiry.seeker.phone;
                  const statusStyle = STATUS_STYLE[inquiry.status] ?? STATUS_STYLE.PENDING;
                  return (
                    <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{inquiry.property.title}</p>
                        <p className="text-xs text-gray-500">{inquiry.property.locality}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{inquiry.seeker.name ?? "Anonymous"}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{inquiry.seeker.email}</p>
                        {contactPhone && <p className="text-gray-500 text-xs mt-0.5">{contactPhone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyle}`}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(inquiry.createdAt)}</td>
                      <td className="px-4 py-3">
                        {contactPhone && (
                          <a
                            href={whatsAppContactUrl(contactPhone, contactMessage(inquiry.seeker.name, inquiry.property.title))}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-medium hover:bg-[#1fb958] transition-colors whitespace-nowrap"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
