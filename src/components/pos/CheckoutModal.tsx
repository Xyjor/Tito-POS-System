import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../lib/currency";
import { useCheckout } from "../../hooks/useCheckout";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (amountPaid: number) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function CheckoutModal({
  open,
  onClose,
  onComplete,
  loading,
  error,
}: CheckoutModalProps) {
  const { total } = useCart();
  const checkout = useCheckout(total, open);

  return (
    <Modal
      open={open}
      title="Checkout"
      onClose={onClose}
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            disabled={!checkout.canSubmit || loading}
            onClick={() => onComplete(checkout.paid)}
            className="min-w-[140px]"
          >
            {loading ? "Processing..." : "Complete Sale"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Amount Due Section */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
          <span className="text-sm font-medium text-slate-300">Total Amount Due</span>
          <span className="mt-1 text-4xl font-bold tracking-tight">{formatCurrency(total)}</span>
        </div>

        {/* Payment Input Section */}
        <div className="space-y-3">
          <Input
            label="Amount Received"
            type="text"
            inputMode="decimal"
            value={checkout.amountPaidStr}
            onChange={(event) => checkout.handleAmountChange(event.target.value)}
            onFocus={(e) => e.target.select()}
            className="h-14 text-right text-2xl font-bold transition-shadow focus:ring-4"
            autoFocus
          />
          
          {/* Quick Cash Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={checkout.setExactAmount}
              className="rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:bg-slate-100"
              aria-label="Pay exact amount"
            >
              Exact
            </button>
            {checkout.quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => checkout.setAmountPaidStr(amt.toFixed(2))}
                className="rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:bg-slate-100"
                aria-label={`Pay ${formatCurrency(amt)}`}
              >
                ₱{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Change / Remaining Section */}
        {checkout.paid >= total ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm transition-all">
            <span className="text-sm font-medium text-emerald-800">Change Due</span>
            <span className="mt-1 text-3xl font-bold text-emerald-900">{formatCurrency(checkout.change)}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm transition-all">
            <span className="text-sm font-medium text-red-800">Remaining Balance</span>
            <span className="mt-1 text-3xl font-bold text-red-900">{formatCurrency(checkout.remaining)}</span>
          </div>
        )}

        {error ? (
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
