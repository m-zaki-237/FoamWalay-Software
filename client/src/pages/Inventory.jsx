import React, { useEffect, useState, useCallback } from 'react';
import { inventoryApi } from '../api/services';
import { toast } from '../stores/toastStore';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import { StockBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton, TableRowSkeleton } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DropdownMenu from '../components/ui/DropdownMenu';
import { formatMoney } from '../lib/format';
import { Warehouse, Package, DollarSign, TrendingUp, AlertTriangle, SlidersHorizontal } from 'lucide-react';

export default function Inventory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Adjust Stock Modal State
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustAction, setAdjustAction] = useState('add'); // 'add' | 'reduce' | 'set'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryApi.getSummary();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load inventory details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenAdjustModal = useCallback((item) => {
    setAdjustingProduct(item);
    setAdjustAction('add');
    setAdjustQty('');
    setAdjustNote('');
    setAdjustError('');
  }, []);

  const calculateResultingStock = () => {
    if (!adjustingProduct) return 0;
    const current = adjustingProduct.stock;
    const qty = parseInt(adjustQty, 10) || 0;

    if (adjustAction === 'add') return current + qty;
    if (adjustAction === 'reduce') return Math.max(0, current - qty);
    if (adjustAction === 'set') return qty;
    return current;
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustError('');

    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty < 0) {
      setAdjustError('Please enter a valid non-negative quantity.');
      return;
    }

    const resulting = calculateResultingStock();
    if (resulting < 0) {
      setAdjustError(`Stock cannot be reduced below 0. Current stock is ${adjustingProduct.stock}.`);
      return;
    }

    try {
      setSaving(true);
      await inventoryApi.adjustStock(adjustingProduct._id, {
        action: adjustAction,
        quantity: qty,
        note: adjustNote
      });

      toast.success(`Stock updated for "${adjustingProduct.name}" (${adjustAction} ${qty}).`);
      setAdjustingProduct(null);
      fetchInventory();
    } catch (err) {
      setAdjustError(err.message || 'Failed to update stock.');
    } finally {
      setSaving(false);
    }
  };

  const summary = data?.summary || {
    totalProducts: 0,
    totalStock: 0,
    inventoryCostValue: 0,
    inventoryRetailValue: 0,
    lowStockCount: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">Inventory Management</h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Track stock quantities, view Inventory Cost & Retail Valuations, and adjust stock levels
        </p>
      </div>

      {/* Summary Stat Cards */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Stock Items"
            value={summary.totalStock.toLocaleString()}
            subtitle={`${summary.totalProducts} unique products`}
            icon={Warehouse}
            color="indigo"
          />
          <StatCard
            title="Inventory Cost Value"
            value={formatMoney(summary.inventoryCostValue)}
            subtitle="Asset investment (Stock × Cost)"
            icon={DollarSign}
            color="blue"
          />
          <StatCard
            title="Inventory Retail Value"
            value={formatMoney(summary.inventoryRetailValue)}
            subtitle="Potential sales (Stock × Price)"
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard
            title="Low Stock Alerts"
            value={summary.lowStockCount}
            subtitle="Products below minimum threshold"
            icon={AlertTriangle}
            color={summary.lowStockCount > 0 ? 'amber' : 'emerald'}
          />
        </div>
      )}

      {/* Inventory Valuation Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-heading">Stock Valuation & Status Table</h3>
        </div>

        {loading ? (
          <TableRowSkeleton rows={6} cols={9} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchInventory} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Inventory Catalog Empty"
            description="Add products to your catalog to view stock levels and valuations."
            icon={Package}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 font-bold sticky top-0">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Selling Price</th>
                  <th className="px-6 py-4">Cost Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Cost Valuation</th>
                  <th className="px-6 py-4">Retail Valuation</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold text-xs">{item.category}</td>
                    <td className="px-6 py-4 text-emerald-700 font-bold">{formatMoney(item.price)}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{formatMoney(item.costPrice)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{item.stock}</td>
                    <td className="px-6 py-4 text-blue-700 font-bold">{formatMoney(item.itemCostVal)}</td>
                    <td className="px-6 py-4 text-emerald-700 font-bold">{formatMoney(item.itemRetailVal)}</td>
                    <td className="px-6 py-4">
                      <StockBadge stock={item.stock} minStock={item.minStock} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu
                        items={[
                          {
                            label: 'Adjust Stock',
                            icon: SlidersHorizontal,
                            onClick: () => handleOpenAdjustModal(item)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t border-slate-200 font-bold text-slate-900 text-xs">
                <tr>
                  <td className="px-6 py-4">TOTALS</td>
                  <td className="px-6 py-4">{summary.totalProducts} items</td>
                  <td className="px-6 py-4">—</td>
                  <td className="px-6 py-4">—</td>
                  <td className="px-6 py-4 text-emerald-700">{summary.totalStock} units</td>
                  <td className="px-6 py-4 text-blue-700">{formatMoney(summary.inventoryCostValue)}</td>
                  <td className="px-6 py-4 text-emerald-700">{formatMoney(summary.inventoryRetailValue)}</td>
                  <td className="px-6 py-4" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        title={`Adjust Stock — ${adjustingProduct?.name}`}
        maxWidth="max-w-md"
      >
        {adjustError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {adjustError}
          </div>
        )}

        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Current Stock:</span>
            <span className="text-slate-900 font-bold text-sm">{adjustingProduct?.stock} units</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustAction('add')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                  adjustAction === 'add'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                + Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustAction('reduce')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                  adjustAction === 'reduce'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                - Reduce Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustAction('set')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                  adjustAction === 'set'
                    ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Set Quantity
              </button>
            </div>
          </div>

          <Input
            label="Quantity"
            type="number"
            required
            min="0"
            value={adjustQty}
            onChange={(e) => setAdjustQty(e.target.value)}
            placeholder="e.g. 5"
          />

          {/* Resulting Stock Preview Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-700 font-medium">Resulting Stock Preview:</span>
            <span className={`font-bold text-sm ${calculateResultingStock() <= (adjustingProduct?.minStock || 0) ? 'text-amber-700' : 'text-emerald-700'}`}>
              {calculateResultingStock()} units
            </span>
          </div>

          <Input
            label="Reason / Note (Optional)"
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
            placeholder="e.g. Delivery received, Stock take count"
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setAdjustingProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} variant="primary">
              Save Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
