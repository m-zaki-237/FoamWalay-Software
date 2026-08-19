import React, { useEffect, useState, useCallback } from 'react';
import { salesApi, productsApi } from '../api/services';
import { toast } from '../stores/toastStore';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { TableRowSkeleton } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { formatMoney, formatDate, formatDateInput } from '../lib/format';
import { Plus, ShoppingBag, Trash2, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Expandable row state
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  // New Sale Modal state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [lineQuantity, setLineQuantity] = useState(1);
  const [saleItems, setSaleItems] = useState([]);
  const [saleNotes, setSaleNotes] = useState('');
  const [saleDate, setSaleDate] = useState(formatDateInput(new Date()));
  const [saleError, setSaleError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salesApi.getAll({ from: fromDate, to: toDate });
      setSales(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load sales records.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const fetchProducts = async () => {
    try {
      const res = await productsApi.getAll();
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenNewSale = () => {
    fetchProducts();
    setSaleItems([]);
    setSelectedProductId('');
    setLineQuantity(1);
    setSaleNotes('');
    setSaleDate(formatDateInput(new Date()));
    setSaleError('');
    setIsSaleModalOpen(true);
  };

  const handleAddLineItem = () => {
    setSaleError('');
    if (!selectedProductId) {
      setSaleError('Please select a product to add');
      return;
    }

    const prod = products.find(p => p._id === selectedProductId);
    if (!prod) return;

    const qty = parseInt(lineQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setSaleError('Quantity must be at least 1');
      return;
    }

    const existingIndex = saleItems.findIndex(i => i.productId === prod._id);
    const existingQty = existingIndex >= 0 ? saleItems[existingIndex].quantity : 0;
    const totalReqQty = existingQty + qty;

    if (prod.stock < totalReqQty) {
      setSaleError(`Insufficient stock for "${prod.name}". Available stock: ${prod.stock}`);
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...saleItems];
      updated[existingIndex].quantity = totalReqQty;
      updated[existingIndex].total = prod.price * totalReqQty;
      updated[existingIndex].cogs = prod.costPrice * totalReqQty;
      setSaleItems(updated);
    } else {
      setSaleItems([
        ...saleItems,
        {
          productId: prod._id,
          productName: prod.name,
          unitPrice: prod.price,
          unitCost: prod.costPrice,
          quantity: qty,
          total: prod.price * qty,
          cogs: prod.costPrice * qty,
          availableStock: prod.stock
        }
      ]);
    }

    setSelectedProductId('');
    setLineQuantity(1);
  };

  const handleRemoveLineItem = (index) => {
    const updated = saleItems.filter((_, i) => i !== index);
    setSaleItems(updated);
  };

  const cartTotalRevenue = saleItems.reduce((acc, item) => acc + item.total, 0);
  const cartTotalCogs = saleItems.reduce((acc, item) => acc + item.cogs, 0);
  const cartGrossProfit = cartTotalRevenue - cartTotalCogs;

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    setSaleError('');

    if (saleItems.length === 0) {
      setSaleError('Please add at least one line item to the sale.');
      return;
    }

    try {
      setSubmitting(true);
      await salesApi.create({
        items: saleItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        date: saleDate,
        notes: saleNotes
      });

      toast.success(`Sale completed successfully! Total Revenue: ${formatMoney(cartTotalRevenue)}`);
      setIsSaleModalOpen(false);
      fetchSales();
      fetchProducts();
    } catch (err) {
      setSaleError(err.message || 'Failed to complete sale transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Sales Management</h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">Record customer sales, deduct stock automatically, and view historical sales</p>
        </div>
        <Button onClick={handleOpenNewSale} icon={Plus} variant="primary">
          Record New Sale
        </Button>
      </div>

      {/* Date Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filter Sales by Date:</span>
        </div>

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
          {(fromDate || toDate) && (
            <Button variant="outline" size="sm" onClick={() => { setFromDate(''); setToDate(''); }}>
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <TableRowSkeleton rows={6} cols={7} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchSales} />
        ) : sales.length === 0 ? (
          <EmptyState
            title="No Sales Recorded"
            description="There are no sales matching your date filter parameters."
            actionText="Record First Sale"
            onAction={handleOpenNewSale}
            icon={ShoppingBag}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 font-bold sticky top-0">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Items Summary</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">COGS</th>
                  <th className="px-6 py-4">Gross Profit</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sales.map((sale) => {
                  const isExpanded = expandedSaleId === sale._id;
                  const itemNames = sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');

                  return (
                    <React.Fragment key={sale._id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {formatDate(sale.date, true)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{itemNames}</p>
                          <p className="text-[11px] text-slate-600 font-medium">{sale.items.length} line item(s)</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-700">{formatMoney(sale.totalRevenue)}</td>
                        <td className="px-6 py-4 text-slate-700 font-medium">{formatMoney(sale.totalCogs)}</td>
                        <td className="px-6 py-4 font-bold text-indigo-700">{formatMoney(sale.grossProfit)}</td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-medium max-w-xs truncate">{sale.notes || '—'}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setExpandedSaleId(isExpanded ? null : sale._id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={7} className="px-8 py-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Line Item Snapshot
                              </h4>
                              <div className="space-y-1.5">
                                {sale.items.map((i, idx) => (
                                  <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                                    <span className="font-bold text-slate-900">{i.productName} × {i.quantity}</span>
                                    <div className="space-x-4">
                                      <span className="text-slate-600 font-medium">Unit Price: {formatMoney(i.unitPrice)}</span>
                                      <span className="text-emerald-700 font-bold">Total: {formatMoney(i.total)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record New Sale Modal */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Record New Sale"
        maxWidth="max-w-2xl"
      >
        {saleError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {saleError}
          </div>
        )}

        <div className="space-y-5">
          {/* Add Item Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add Line Item</h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <Select
                  label="Select Product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Product --' },
                    ...products.map(p => ({
                      value: p._id,
                      label: `${p.name} — ${formatMoney(p.price)} (${p.stock <= 0 ? 'OUT OF STOCK' : `Stock: ${p.stock}`})`,
                      disabled: p.stock <= 0
                    }))
                  ]}
                />
              </div>

              <div className="sm:col-span-3">
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={lineQuantity}
                  onChange={(e) => setLineQuantity(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <Button variant="primary" size="md" className="w-full" onClick={handleAddLineItem}>
                  + Add
                </Button>
              </div>
            </div>
          </div>

          {/* Cart Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Sale Sheet Items ({saleItems.length})
            </h4>
            {saleItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium border border-dashed border-slate-300 rounded-xl bg-white">
                No items added to this sale yet. Select a product above to add line items.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 bg-white">
                {saleItems.map((item, index) => (
                  <div key={index} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {item.quantity} × {formatMoney(item.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-emerald-700">{formatMoney(item.total)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals Summary Banner */}
          {saleItems.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[11px] text-slate-700 font-bold uppercase">Total Revenue</p>
                <p className="text-lg font-bold text-emerald-700 font-heading">{formatMoney(cartTotalRevenue)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-700 font-bold uppercase">Total COGS</p>
                <p className="text-lg font-bold text-slate-800 font-heading">{formatMoney(cartTotalCogs)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-700 font-bold uppercase">Gross Profit</p>
                <p className="text-lg font-bold text-indigo-700 font-heading">{formatMoney(cartGrossProfit)}</p>
              </div>
            </div>
          )}

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Sale Date"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
            <Input
              label="Notes (Optional)"
              value={saleNotes}
              onChange={(e) => setSaleNotes(e.target.value)}
              placeholder="e.g. Cash payment, Gulberg delivery"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setIsSaleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaleSubmit}
              loading={submitting}
              disabled={saleItems.length === 0}
              variant="primary"
            >
              Complete & Save Sale
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
