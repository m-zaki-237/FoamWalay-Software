import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/services';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import { CardSkeleton, ChartSkeleton } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import { formatMoney, formatDate } from '../lib/format';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
  Warehouse,
  AlertTriangle,
  Plus,
  ArrowRight,
  PieChart,
  History
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getMetrics();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={5} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const inv = data?.inventory || {};
  const sales = data?.sales || {};
  const fin = data?.financials || {};
  const salesTrend = data?.salesTrend || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const recentSales = data?.recentSales || [];

  return (
    <div className="space-y-6">
      {/* Quick Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Business Overview</h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">Real-time metrics, financial status, and sales trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/sales')}
            icon={Plus}
            variant="primary"
            size="md"
          >
            Record New Sale
          </Button>
          <Button
            onClick={() => navigate('/products')}
            icon={Package}
            variant="secondary"
            size="md"
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {inv.lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs font-semibold text-amber-900">
              Attention: {inv.lowStockCount} product(s) are currently at or below minimum stock threshold!
            </p>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top 5 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Inventory Value"
          value={formatMoney(inv.inventoryCostValue)}
          subtitle={`Retail: ${formatMoney(inv.inventoryRetailValue)}`}
          icon={Warehouse}
          color="amber"
        />
        <StatCard
          title="Total Sales"
          value={sales.totalSales || 0}
          subtitle={`${sales.totalItemsSold || 0} items sold`}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Revenue"
          value={formatMoney(sales.totalRevenue)}
          subtitle={`Today: ${formatMoney(fin.revenueToday)}`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Gross Profit"
          value={formatMoney(sales.grossProfit)}
          subtitle={`This Month: ${formatMoney(fin.profitMonth)}`}
          icon={PieChart}
          color="indigo"
        />
        <StatCard
          title="Low Stock"
          value={inv.lowStockCount || 0}
          subtitle="Products below minStock"
          icon={AlertTriangle}
          color={inv.lowStockCount > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 30-Day Revenue Trend Chart */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">30-Day Revenue Trend</h3>
              <p className="text-xs text-slate-600 font-medium">Daily revenue breakdown over the past 30 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorRevenueLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.7} />
                <XAxis dataKey="date" stroke="#475569" fontSize={11} fontWeight={600} tickFormatter={(val) => val.slice(5)} />
                <YAxis stroke="#475569" fontSize={11} fontWeight={600} tickFormatter={(v) => `Rs. ${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(val) => [formatMoney(val), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenueLight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 12-Month Revenue vs Gross Profit Chart */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">12-Month Revenue vs Gross Profit</h3>
              <p className="text-xs text-slate-600 font-medium">Monthly revenue and gross profit performance</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.7} />
                <XAxis dataKey="month" stroke="#475569" fontSize={11} fontWeight={600} />
                <YAxis stroke="#475569" fontSize={11} fontWeight={600} tickFormatter={(v) => `Rs. ${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(val, name) => [formatMoney(val), name === 'revenue' ? 'Revenue' : 'Gross Profit']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Gross Profit" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Sales Summary Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 font-heading">Recent Sales</h3>
          </div>
          <button
            onClick={() => navigate('/sales')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>View All Sales</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 font-bold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items Purchased</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Gross Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-600 font-medium">
                    No recent sales recorded yet.
                  </td>
                </tr>
              ) : (
                recentSales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-700 font-semibold">{formatDate(s.date, true)}</td>
                    <td className="px-4 py-3 text-xs text-slate-900 font-semibold">
                      {s.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-700">{formatMoney(s.totalRevenue)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-indigo-700">{formatMoney(s.grossProfit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
