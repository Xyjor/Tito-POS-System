import { useEffect, useState, useMemo } from "react";
import { listSales } from "../lib/tauri";
import { getRevenueStats } from "../lib/tauri";
import type { SaleSummary } from "../types";
import { formatCurrency } from "../lib/currency";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueStats {
  total_revenue: number;
  today_revenue: number;
  week_revenue: number;
  total_sales: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<"7d" | "30d" | "1y" | "all">("30d");

  useEffect(() => {
    async function fetchStats(): Promise<void> {
      try {
        const [statsData, salesData] = await Promise.all([
          getRevenueStats(),
          listSales(),
        ]);
        setStats(statsData);
        setSales(salesData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "7d") return diffDays <= 7;
      if (dateFilter === "30d") return diffDays <= 30;
      if (dateFilter === "1y") return diffDays <= 365;
      return true; // all
    });
  }, [sales, dateFilter]);

  const chartData = useMemo(() => {
    const dailyTotals: Record<string, number> = {};
    filteredSales.forEach((sale) => {
      const date = sale.created_at.split(" ")[0]; // Extract YYYY-MM-DD
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      dailyTotals[date] += sale.total;
    });

    return Object.entries(dailyTotals)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales]);

  const filteredStats = useMemo(() => {
    const totalRev = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const avgDaily = chartData.length > 0 ? totalRev / chartData.length : 0;
    return {
      total: totalRev,
      avgDaily,
      count: filteredSales.length
    };
  }, [filteredSales, chartData]);

  if (loading) {
    return <div className="flex-1 p-8">Loading dashboard...</div>;
  }

  if (error || !stats) {
    return <div className="flex-1 p-8 text-rose-600">Failed to load stats: {error}</div>;
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Sales Revenue
            </h1>
            <p className="mt-2 text-slate-500">
              Overview of your store&apos;s performance.
            </p>
          </div>
          <div>
            <select
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 shadow-sm font-medium text-slate-700"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as "7d" | "30d" | "1y" | "all")}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="1y">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Period Revenue"
            value={formatCurrency(filteredStats.total)}
            trend={dateFilter === '7d' ? 'Last 7 days' : dateFilter === '30d' ? 'Last 30 days' : dateFilter === '1y' ? 'Past 365 days' : 'All time'}
            isPositive={true}
          />
          <StatCard
            title="Avg. Daily Revenue"
            value={formatCurrency(filteredStats.avgDaily)}
            trend="Per active day in period"
            isPositive={true}
          />
          <StatCard
            title="Sales Count"
            value={filteredStats.count.toString()}
            trend="Total receipts in period"
            isPositive={true}
          />
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Revenue Trend</h2>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `₱${val}`} 
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(Number(value || 0)), "Revenue"]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No sales data available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, isPositive }: { title: string, value: string, trend: string, isPositive: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className={`mt-2 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-slate-500'}`}>
        {trend}
      </p>
    </div>
  );
}
