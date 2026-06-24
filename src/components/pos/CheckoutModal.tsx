import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";
import { formatCurrency, parseAmount, roundMoney } from "../../lib/currency";
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
  const [amountPaid, setAmountPaid] = useState(total.toFixed(2));


  useEffect(() => {
    if (open) {
      setAmountPaid(total.toFixed(2));
    }
  }, [open, total]);

  const paid = parseAmount(amountPaid);
  const change = roundMoney(Math.max(0, paid - total));
  const canSubmit = paid >= total && total > 0;

  return (
    <Modal
      open={open}
      title="Checkout"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || loading}
            onClick={() => onComplete(paid)}
          >
            {loading ? "Processing..." : "Complete Sale"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Amount Due</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>
        </div>
        <Input
          label="Amount Paid (₱)"
          type="number"
          min="0"
          step="0.01"
          value={amountPaid}
          onChange={(event) => setAmountPaid(event.target.value)}
          autoFocus
        />
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Change</p>
          <p className="text-2xl font-bold text-emerald-900">{formatCurrency(change)}</p>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </Modal>
  );
}
