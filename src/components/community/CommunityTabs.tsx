"use client";

import { useState, type ReactNode } from "react";
import { BookUser, Bus, Siren } from "lucide-react";

type TabKey = "directory" | "buses" | "emergency";

const TABS: { key: TabKey; label: string; short: string; icon: typeof BookUser }[] = [
  { key: "directory", label: "Service Providers", short: "Services", icon: BookUser },
  { key: "buses", label: "Bus Timings", short: "Buses", icon: Bus },
  { key: "emergency", label: "Emergency Numbers", short: "Emergency", icon: Siren },
];

/**
 * Sub-tabs for the community page.
 *
 * Every panel is rendered on the server and passed in as children, so
 * switching is instant and needs no second request. Inactive panels stay
 * mounted but hidden, which keeps the directory's own filter state alive when
 * a resident flicks over to the bus times and back.
 */
export default function CommunityTabs({
  directory,
  buses,
  busesAvailable,
  emergency,
  emergencyAvailable,
  heading,
}: {
  directory: ReactNode;
  buses: ReactNode;
  busesAvailable: boolean;
  emergency: ReactNode;
  emergencyAvailable: boolean;
  /** Page title, rendered on the same row as the tab bar to save height. */
  heading?: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("directory");

  const panels: Record<TabKey, { content: ReactNode; available: boolean }> = {
    directory: { content: directory, available: true },
    buses: { content: buses, available: busesAvailable },
    emergency: { content: emergency, available: emergencyAvailable },
  };
  const tabs = TABS.filter(({ key }) => panels[key].available);

  // With nothing else published there is nothing to switch to, so the control
  // would be a dead end. Render the directory alone.
  if (tabs.length === 1) {
    return (
      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        {heading}
        {directory}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6 mb-4 shrink-0">
      {heading}
      <div
        role="tablist"
        aria-label="Community sections"
        className="flex w-full sm:w-fit gap-1 rounded-xl bg-[#F0E9DF] p-1 shrink-0"
      >
        {tabs.map(({ key, label, short, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${key}`}
              id={`tab-${key}`}
              onClick={() => setTab(key)}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-2.5 sm:px-5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8541A]/40 ${
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
      </div>

      {tabs.map(({ key }) => (
        <div
          key={key}
          role="tabpanel"
          id={`panel-${key}`}
          aria-labelledby={`tab-${key}`}
          hidden={tab !== key}
          className={`flex flex-1 flex-col min-h-0 min-w-0 [&[hidden]]:hidden ${
            // The directory scrolls its own table; the other panels scroll whole.
            key === "directory" ? "" : "overflow-y-auto"
          }`}
        >
          {panels[key].content}
        </div>
      ))}
    </div>
  );
}
