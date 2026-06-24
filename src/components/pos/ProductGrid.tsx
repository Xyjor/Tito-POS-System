import type { Product } from "../../types";
import { formatCurrency } from "../../lib/currency";
import { Badge } from "../ui/Badge";

interface ProductGridProps {
  products: Product[];
  onAdd: (product: Product) => void;
}

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No products match your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => {
        const outOfStock = product.stock_qty <= 0;
        return (
          <button
            key={product.id}
            type="button"
            disabled={outOfStock}
            onClick={() => onAdd(product)}
            className={`rounded-2xl border p-4 text-left transition ${
              outOfStock
                ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                : "border-slate-200 bg-white hover:border-emerald-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
              </div>
              <Badge tone={outOfStock ? "danger" : product.stock_qty <= product.min_stock ? "warning" : "success"}>
                {outOfStock ? "Out" : `${product.stock_qty} left`}
              </Badge>
            </div>
            <p className="mt-4 text-lg font-bold text-emerald-700">
              {formatCurrency(product.unit_price)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
