import { useEffect, useState } from "react";
import type { Category, Product } from "../types";
import {
  updateStockQty,
  createProduct,
  deleteProduct,
  listCategories,
  createCategory,
  deleteCategory,
  listProducts,
  updateProduct,
} from "../lib/tauri";
import { formatCurrency, parseAmount } from "../lib/currency";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";

const emptyForm = {
  sku: "",
  name: "",
  category_id: "",
  unit_price: "",
  cost_price: "",
  stock_qty: "0",
  min_stock: "0",
  barcode: "",
  is_active: true,
};

export function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [stockValue, setStockValue] = useState("0");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const [categoryData, productData] = await Promise.all([
        listCategories(),
        listProducts(null, true),
      ]);
      setCategories(categoryData);
      setProducts(productData);
      if (!form.category_id && categoryData[0]) {
        setForm((current) => ({ ...current, category_id: categoryData[0].id }));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function openCreateForm() {
    setSelectedProduct(null);
    setForm({
      ...emptyForm,
      category_id: categories[0]?.id ?? "",
    });
    setError(null);
    setFormOpen(true);
  }

  function openEditForm(product: Product) {
    setSelectedProduct(product);
    setForm({
      sku: product.sku,
      name: product.name,
      category_id: product.category_id,
      unit_price: product.unit_price.toString(),
      cost_price: product.cost_price?.toString() ?? "",
      stock_qty: product.stock_qty.toString(),
      min_stock: product.min_stock.toString(),
      barcode: product.barcode ?? "",
      is_active: product.is_active,
    });
    setError(null);
    setFormOpen(true);
  }

  function openStockModal(product: Product) {
    setSelectedProduct(product);
    setStockValue(product.stock_qty.toString());
    setError(null);
    setStockOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (selectedProduct) {
        await updateProduct({
          id: selectedProduct.id,
          sku: form.sku,
          name: form.name,
          category_id: form.category_id,
          unit_price: parseAmount(form.unit_price),
          cost_price: form.cost_price ? parseAmount(form.cost_price) : null,
          min_stock: Number.parseInt(form.min_stock, 10) || 0,
          barcode: form.barcode || null,
          is_active: form.is_active,
        });
      } else {
        await createProduct({
          sku: form.sku,
          name: form.name,
          category_id: form.category_id,
          unit_price: parseAmount(form.unit_price),
          cost_price: form.cost_price ? parseAmount(form.cost_price) : null,
          stock_qty: Number.parseInt(form.stock_qty, 10) || 0,
          min_stock: Number.parseInt(form.min_stock, 10) || 0,
          barcode: form.barcode || null,
        });
      }
      setFormOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Are you sure you want to remove "${product.name}"? It will no longer be available for sale.`)) {
      return;
    }
    await deleteProduct(product.id);
    await loadProducts();
  }

  async function handleUpdateStock() {
    if (!selectedProduct) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateStockQty({
        product_id: selectedProduct.id,
        stock_qty: Number.parseInt(stockValue, 10) || 0,
      });
      setStockOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Products</h2>
          <p className="text-sm text-slate-500">Manage inventory and pricing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setCategoriesOpen(true); setCategoryError(null); setNewCategoryName(""); }}>Manage Categories</Button>
          <Button onClick={openCreateForm}>Add Product</Button>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Search"
            placeholder="Search by name or SKU"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Category</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Add a product or adjust your search filters."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Current Inventory</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.sku}</p>
                    </td>
                    <td className="px-4 py-3">{product.category_name}</td>
                    <td className="px-4 py-3">{formatCurrency(product.unit_price)}</td>
                    <td className="px-4 py-3">{product.stock_qty}</td>
                    <td className="px-4 py-3">
                      <Badge tone={product.is_active ? "success" : "danger"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openEditForm(product)}>
                          Edit
                        </Button>
                        <Button variant="secondary" onClick={() => openStockModal(product)}>
                          Update Stock
                        </Button>
                        {product.is_active ? (
                          <Button variant="danger" onClick={() => handleDelete(product)}>
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        title={selectedProduct ? "Edit Product" : "Add Product"}
        onClose={() => setFormOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleSave}>
              {saving ? "Saving..." : "Save Product"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Category</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Barcode"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          />
          <Input
            label="Selling Price (₱)"
            type="number"
            min="0"
            step="0.01"
            value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
          />
          <Input
            label="Supplier Cost (₱)"
            type="number"
            min="0"
            step="0.01"
            value={form.cost_price}
            onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
          />
          {!selectedProduct ? (
            <Input
              label="Quantity on Shelf"
              type="number"
              min="0"
              value={form.stock_qty}
              onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
            />
          ) : null}
          <Input
            label="Minimum Stock Warning"
            type="number"
            min="0"
            value={form.min_stock}
            onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
          />
          {selectedProduct ? (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active product
            </label>
          ) : null}
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </Modal>

      <Modal
        open={stockOpen}
        title="Add/Remove Stock"
        onClose={() => setStockOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStockOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleUpdateStock}>
              {saving ? "Saving..." : "Update Stock"}
            </Button>
          </div>
        }
      >
        {selectedProduct ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {selectedProduct.name}
            </p>
            <Input
              label="Exact Quantity on Shelf"
              type="number"
              min="0"
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={categoriesOpen}
        title="Manage Categories"
        onClose={() => setCategoriesOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setCategoriesOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              label="New Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-end pb-[2px]">
              <Button 
                disabled={saving || !newCategoryName.trim()} 
                onClick={async () => {
                  setSaving(true);
                  setCategoryError(null);
                  try {
                    await createCategory(newCategoryName);
                    setNewCategoryName("");
                    await loadProducts();
                  } catch (err) {
                    setCategoryError(err instanceof Error ? err.message : String(err));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
          {categoryError ? <p className="text-sm text-red-600">{categoryError}</p> : null}
          
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Category Name</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{category.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant="danger" 
                        onClick={async () => {
                          if (!window.confirm(`Delete category "${category.name}"?`)) return;
                          setSaving(true);
                          setCategoryError(null);
                          try {
                            await deleteCategory(category.id);
                            await loadProducts();
                          } catch (err) {
                            setCategoryError(err instanceof Error ? err.message : String(err));
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                      No categories yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
