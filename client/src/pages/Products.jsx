import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { productsApi } from '../api/services';
import { toast } from '../stores/toastStore';
import SearchBox from '../components/ui/SearchBox';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge, { StockBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { TableRowSkeleton } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DropdownMenu from '../components/ui/DropdownMenu';
import { formatMoney } from '../lib/format';
import { Plus, Edit2, Trash2, Package, Filter, AlertTriangle } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    price: '',
    costPrice: '',
    stock: '0',
    minStock: '0',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Dialog State
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input to prevent API flood on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getAll({
        search: debouncedSearch,
        category: selectedCategory,
        lowStock: lowStockOnly
      });
      setProducts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, lowStockOnly]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await productsApi.getCategories();
      setCategories(['All', ...res.data]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAddModal = useCallback(() => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'General',
      price: '',
      costPrice: '',
      stock: '0',
      minStock: '0',
      description: ''
    });
    setFormError('');
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category || 'General',
      price: String(product.price),
      costPrice: String(product.costPrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
      description: product.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Product name is required');
      return;
    }

    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      setFormError('Valid selling price (≥ 0) is required');
      return;
    }

    if (formData.costPrice === '' || isNaN(formData.costPrice) || Number(formData.costPrice) < 0) {
      setFormError('Valid cost price (≥ 0) is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim() || 'General',
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        stock: Number(formData.stock || 0),
        minStock: Number(formData.minStock || 0),
        description: formData.description.trim()
      };

      if (editingProduct) {
        await productsApi.update(editingProduct._id, payload);
        toast.success(`Product "${payload.name}" updated successfully.`);
      } else {
        await productsApi.create(payload);
        toast.success(`Product "${payload.name}" added to catalog.`);
      }

      setIsModalOpen(false);
      fetchProducts();
      fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    try {
      setDeleting(true);
      await productsApi.delete(deleteProduct._id);
      toast.success(`Product "${deleteProduct.name}" deleted.`);
      setDeleteProduct(null);
      fetchProducts();
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const categoryOptions = useMemo(() => {
    return categories.map(cat => ({ value: cat, label: cat === 'All' ? 'All Categories' : cat }));
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Product Catalog</h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">Manage products, cost prices, selling prices, and minimum stock alerts</p>
        </div>
        <Button onClick={handleOpenAddModal} icon={Plus} variant="primary">
          Add Product
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search product name, category..."
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categoryOptions}
            />
          </div>

          <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 bg-white border-slate-300 focus:ring-emerald-600"
            />
            <AlertTriangle className={`w-3.5 h-3.5 ${lowStockOnly ? 'text-amber-600' : 'text-slate-500'}`} />
            <span>Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <TableRowSkeleton rows={6} cols={7} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProducts} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="No catalog items match your search or filter parameters."
            actionText="Add New Product"
            onAction={handleOpenAddModal}
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
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {p.name}
                      {p.description && (
                        <p className="text-xs text-slate-600 font-medium truncate max-w-xs">{p.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-xs text-slate-800 font-semibold">
                        {p.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{formatMoney(p.price)}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{formatMoney(p.costPrice)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{p.stock}</td>
                    <td className="px-6 py-4">
                      <StockBadge stock={p.stock} minStock={p.minStock} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu
                        items={[
                          { label: 'Edit Product', icon: Edit2, onClick: () => handleOpenEditModal(p) },
                          { label: 'Delete Product', icon: Trash2, onClick: () => setDeleteProduct(p), isDanger: true }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        {formError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Product Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Master Celeste Ultra Foam 4x6"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Mattresses, Foam Sheets"
            />
            <Input
              label="Selling Price (PKR)"
              type="number"
              required
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="15000"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Cost Price (PKR)"
              type="number"
              required
              min="0"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              placeholder="11000"
            />
            <Input
              label="Current Stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="10"
            />
            <Input
              label="Min Stock Alert"
              type="number"
              min="0"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              placeholder="3"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional product details"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} variant="primary">
              {editingProduct ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProduct?.name}"?`}
        confirmText="Delete Product"
        isDanger={true}
        loading={deleting}
      />
    </div>
  );
}
