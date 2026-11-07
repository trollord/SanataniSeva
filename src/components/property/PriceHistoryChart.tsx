"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatPrice } from "@/lib/utils/formatters";
import { formatDate } from "@/lib/utils/formatters";

interface PricePoint {
  price: number;
  recordedAt: string | Date;
  source: string;
}

interface Props {
  data: PricePoint[];
  listingType: string;
}

export default function PriceHistoryChart({ data, listingType }: Props) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        Not enough data to show price history yet.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    date: formatDate(point.recordedAt),
    price: point.price,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          tickFormatter={(v) => formatPrice(v)}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          formatter={(value) => [
            `${formatPrice(Number(value))}${listingType === "RENT" ? "/mo" : ""}`,
            "Price",
          ]}
          contentStyle={{
            borderRadius: "4px",
            border: "1px solid #e5e7eb",
            fontSize: "12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#FF5F15"
          strokeWidth={2}
          dot={{ fill: "#FF5F15", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
