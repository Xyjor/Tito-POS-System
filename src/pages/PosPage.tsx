import { useEffect, useMemo, useState } from "react";
import { checkout, listCategories, listProducts } from "../lib/tauri";
import type { Category, Product, ReceiptData } from "../types";
import { useCart } from "../context/CartContext";
import { CartPanel } from "../components/pos/CartPanel";
import { CheckoutModal } from "../components/pos/CheckoutModal";
import { ProductGrid } from "../components/pos/ProductGrid";
import { ReceiptPreview } from "../components/pos/ReceiptPreview";
import { Input } from "../components/ui/Input";

export function PosPage() {
  const { addItem, items, discount, clearCart } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [categoryData, productData] = await Promise.all([
          listCategories(),
          listProducts(selectedCategory),
        ]);
        if (active) {
          setCategories(categoryData);
          setProducts(productData);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedCategory, refreshKey]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return products;
    }
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query),
    );
  }, [products, search]);

  async function handleCheckout(amountPaid: number) {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const [, receiptData] = await checkout({
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        discount,
        amount_paid: amountPaid,
      });
      setReceipt(receiptData);
      setCheckoutOpen(false);
      setReceiptOpen(true);
      clearCart();
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : String(error));
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-2xl font-bold text-slate-900">Point of Sale</h2>
        <p className="text-sm text-slate-500">
          Educational supplies and sari-sari store items
        </p>
      </header>

      <div className="grid flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1fr_360px]">
        <section className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategory === null
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  selectedCategory === category.id
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <Input
            label="Search products"
            placeholder="Search by name or SKU"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
                Loading products...
              </div>
            ) : (
              <ProductGrid products={filteredProducts} onAdd={addItem} />
            )}
          </div>
        </section>

        <CartPanel onCheckout={() => setCheckoutOpen(true)} />
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          setCheckoutError(null);
        }}
        onComplete={handleCheckout}
        loading={checkoutLoading}
        error={checkoutError}
      />

      <ReceiptPreview
        open={receiptOpen}
        receipt={receipt}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
}
