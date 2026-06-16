"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Activity, Timer, Wallet } from "lucide-react";
import { useWeeklyStats } from "@/lib/firebase-hooks";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) => `₫${val.toLocaleString("vi-VN")}`;

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-card border border-border rounded-xl p-4 shadow-sm",
      className,
    )}
  >
    {children}
  </div>
);

export default function StatsTab() {
  const { weekData, isLoading } = useWeeklyStats();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-72 bg-card rounded-xl w-full" />
        <div className="h-72 bg-card rounded-xl w-full" />
      </div>
    );
  }

  // Tổng 7 ngày
  const totalRevenue = weekData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = weekData.reduce((s, d) => s + d.profit, 0);
  const totalOrders = weekData.reduce((s, d) => s + d.orders, 0);
  const totalHours = weekData.reduce((s, d) => s + d.hours, 0);

  const hasData = weekData.some((d) => d.revenue > 0);

  return (
    <div className="space-y-6">
      {/* Tổng quan tuần */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <Wallet className="w-3.5 h-3.5" /> Doanh thu tuần
          </div>
          <div className="text-lg font-bold text-accent">
            {formatCurrency(totalRevenue)}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> Lợi nhuận tuần
          </div>
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(totalProfit)}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <Activity className="w-3.5 h-3.5" /> Tổng đơn
          </div>
          <div className="text-lg font-bold">{totalOrders} đơn</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <Timer className="w-3.5 h-3.5" /> Tổng giờ chạy
          </div>
          <div className="text-lg font-bold">{totalHours.toFixed(1)}h</div>
        </Card>
      </div>

      {/* Biểu đồ doanh thu */}
      <Card className="space-y-4">
        <h3 className="font-semibold">Doanh thu 7 ngày qua</h3>
        {!hasData ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-500">
            Chưa có dữ liệu tuần này
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weekData}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.07)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Doanh thu",
                  ]}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Biểu đồ lợi nhuận */}
      <Card className="space-y-4">
        <h3 className="font-semibold">Lợi nhuận 7 ngày qua</h3>
        {!hasData ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-500">
            Chưa có dữ liệu tuần này
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weekData}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.07)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Lợi nhuận",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Bảng chi tiết từng ngày */}
      <Card className="space-y-3">
        <h3 className="font-semibold">Chi tiết từng ngày</h3>
        <div className="space-y-2">
          {weekData.map((day) => (
            <div
              key={day.date}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 text-center text-xs font-semibold text-gray-400 bg-border/40 rounded-md py-1">
                  {day.name}
                </span>
                <div className="text-xs text-gray-500">
                  {day.orders} đơn · {day.hours.toFixed(1)}h
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {formatCurrency(day.revenue)}
                </div>
                <div
                  className={`text-xs ${day.profit >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  LN: {formatCurrency(day.profit)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
