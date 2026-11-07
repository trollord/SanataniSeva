"use client";

import { useState, type ReactNode } from "react";
import { BookUser, Bus } from "lucide-react";

type TabKey = "directory" | "buses";

const TABS: { key: TabKey; label: string; short: string; icon: typeof BookUser }[] = [
  { key: "directory", label: "Service Providers", short: "Services", icon: BookUser },
  { key: "buses", label: "Bus Timings", short: "Buses", icon: Bus },
];

/**
 * Sub-tabs for the community page.
 *
 * Both panels are rendered on the server and passed in as children, so
 * switching is instant and needs no second request. The inactive panel stays
 * mounted but hidden, which keeps the directory's own filter state alive when
 * a resident flicks over to the bus times and back.
 */
export default function CommunityTabs({
  directory,
  buses,
  busesAvailable,
}: {
  directory: ReactNode;
  buses: ReactNode;
  busesAvailable: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("directory");

  // With no routes published there is nothing to switch to, so the control
  // would be a dead end. Render the directory alone.
  if (!busesAvailable) return <>{directory}</>;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Community sections"
        className="flex w-full sm:w-fit gap-1 rounded-xl bg-[#F0E9DF] p-1 mb-7 sm:mb-9"
      >
        {TABS.map(({ key, label, short, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${key}`}
              id={`tab-${key}`}
              onClick={() => setTab(key)}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-4 sm:px-6 py-2.5 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8541A]/40 ${
                active
                  ? "bg-white text-[#1C1C1C] shadow-sm"
                  : "text-[#6B6B6B] hover:text-[#1C1C1C]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="panel-directory"
        aria-labelledby="tab-directory"
        hidden={tab !== "directory"}
      >
        {directory}
      </div>
      <div role="tabpanel" id="panel-buses" aria-labelledby="tab-buses" hidden={tab !== "buses"}>
        {buses}
      </div>
    </div>
  );
}
