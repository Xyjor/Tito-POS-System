import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../lib/currency";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface CartPanelProps {
  onCheckout: () => void;
}

export function CartPanel({ onCheckout }: CartPanelProps) {
  const {
    items,
    itemCount,
    subtotal,
    discount,
    total,
    setDiscount,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Current Sale</h2>
            <p className="text-sm text-slate-500">{itemCount} item(s)</p>
          </div>
          <Button variant="ghost" onClick={clearCart} disabled={items.length === 0}>
            Clear
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Tap products to add them to the cart.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="rounded-xl border border-slate-200 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{item.product.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatCurrency(item.product.unit_price)} each
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => removeItem(item.product.id)}
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="px-3 py-1"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                  <Button
                    variant="secondary"
                    className="px-3 py-1"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(item.product.unit_price * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 border-t border-slate-200 px-5 py-4">
        <Input
          label="Discount (₱)"
          type="number"
          min="0"
          step="0.01"
          value={discount || ""}
          onChange={(event) => setDiscount(Number.parseFloat(event.target.value) || 0)}
        />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
        <Button className="w-full py-3 text-base" onClick={onCheckout} disabled={items.length === 0}>
          Checkout
        </Button>
      </div>
    </section>
  );
}
