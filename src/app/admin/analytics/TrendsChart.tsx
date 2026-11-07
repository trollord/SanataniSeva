"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export interface DailyPoint {
  day: string; // e.g. "12 Jul"
  users: number;
  properties: number;
  inquiries: number;
}

export default function TrendsChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="users" name="New users" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="properties" name="Properties posted" stroke="#16a34a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="inquiries" name="Interests captured" stroke="#ea580c" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
