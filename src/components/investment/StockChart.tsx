"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface PricePoint {
  date: Date | string;
  close: number;
}

interface StockChartProps {
  prices: PricePoint[];
  symbol: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="text-gray-500">{label}</p>
        <p className="font-bold text-blue-600">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function StockChart({ prices, symbol }: StockChartProps) {
  if (!prices || prices.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        データなし
      </div>
    );
  }

  const formattedData = prices.map((p) => ({
    date: new Date(p.date).toLocaleDateString("ja-JP", { year: "2-digit", month: "short" }),
    price: parseFloat(p.close.toFixed(2)),
  }));

  const firstPrice = formattedData[0].price;
  const lastPrice = formattedData[formattedData.length - 1].price;
  const isPositive = lastPrice >= firstPrice;

  const minPrice = Math.min(...formattedData.map((d) => d.price));
  const maxPrice = Math.max(...formattedData.map((d) => d.price));
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500">{symbol}</span>
        <span className={`text-xs font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? "+" : ""}
          {(((lastPrice - firstPrice) / firstPrice) * 100).toFixed(1)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#9ca3af" }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tick={{ fontSize: 9, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={firstPrice} stroke="#e5e7eb" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="price"
            stroke={isPositive ? "#16a34a" : "#dc2626"}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: isPositive ? "#16a34a" : "#dc2626" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
