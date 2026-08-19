import React, { useEffect, useState, useCallback } from 'react';
import { reportsApi } from '../api/services';
import { toast } from '../stores/toastStore';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { TableRowSkeleton } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatMoney } from '../lib/format';
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  PieChart,
  PackageCheck
} from 'lucide-react';

export default function Reports() {
  const [period, setPeriod] = useState('month'); // 'month' | 'quarter' | 'year' | 'custom'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null); // 'pdf' | 'xlsx' | 'csv' | null

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsApi.getPeriodReport(period, { from: fromDate, to: toDate });
      setReportData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, [period, fromDate, toDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async (format) => {
    try {
      setExporting(format);

      const response = await fetch(`/api/exports/sales/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period,
          from: fromDate,
          to: toDate
        })
      });

      if (!response.ok) throw new Error('Export generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foamwalay-${period}-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Export downloaded (${format.toUpperCase()}).`);
    } catch (err) {
      toast.error('Failed to generate export: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const summary = reportData?.summary || {
    salesCount: 0,
    itemsSold: 0,
    revenue: 0,
    cogs: 0,
    grossProfit: 0
  };

  const breakdown = reportData?.breakdown || [];

  return (
    <div className="space-y-6">
      {/* Header & Export Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Financial Reports</h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            {reportData?.periodTitle ? `Report for ${reportData.periodTitle}` : 'Monthly, Quarterly, and Yearly financial summaries'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            loading={exporting === 'pdf'}
            disabled={exporting !== null}
            onClick={() => handleExport('pdf')}
          >
            PDF Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            loading={exporting === 'xlsx'}
            disabled={exporting !== null}
            onClick={() => handleExport('xlsx')}
          >
            Excel (XLSX)
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            loading={exporting === 'csv'}
            disabled={exporting !== null}
            onClick={() => handleExport('csv')}
          >
            CSV
          </Button>
        </div>
      </div>

      {/* Period Selection Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              period === 'month' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('quarter')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              period === 'quarter' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              period === 'year' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              period === 'custom' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Custom Range
          </button>
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-40">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue"
          value={formatMoney(summary.revenue)}
          subtitle={`${summary.salesCount} total sales`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Cost of Goods Sold"
          value={formatMoney(summary.cogs)}
          subtitle="Total product cost"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Gross Profit"
          value={formatMoney(summary.grossProfit)}
          subtitle="Revenue − COGS"
          icon={PieChart}
          color="indigo"
        />
        <StatCard
          title="Items Sold"
          value={summary.itemsSold.toLocaleString()}
          subtitle="Total units sold"
          icon={PackageCheck}
          color="amber"
        />
      </div>

      {/* Period Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Period Breakdown ({period === 'month' || period === 'custom' ? 'Daily' : 'Monthly'})
          </h3>
        </div>

        {loading ? (
          <TableRowSkeleton rows={6} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReport} />
        ) : breakdown.length === 0 ? (
          <EmptyState
            title="No Sales Data for Period"
            description="There are no recorded sales during this selected time period."
            icon={FileText}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 font-bold sticky top-0">
                <tr>
                  <th className="px-6 py-4">Time Label</th>
                  <th className="px-6 py-4">Sales Count</th>
                  <th className="px-6 py-4">Items Sold</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">COGS</th>
                  <th className="px-6 py-4">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {breakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.label}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{row.salesCount}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{row.itemsSold}</td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{formatMoney(row.revenue)}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{formatMoney(row.cogs)}</td>
                    <td className="px-6 py-4 font-bold text-indigo-700">{formatMoney(row.grossProfit)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t border-slate-200 font-bold text-slate-900 text-xs">
                <tr>
                  <td className="px-6 py-4">TOTALS</td>
                  <td className="px-6 py-4">{summary.salesCount}</td>
                  <td className="px-6 py-4">{summary.itemsSold}</td>
                  <td className="px-6 py-4 text-emerald-700">{formatMoney(summary.revenue)}</td>
                  <td className="px-6 py-4 text-slate-700">{formatMoney(summary.cogs)}</td>
                  <td className="px-6 py-4 text-indigo-700">{formatMoney(summary.grossProfit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
