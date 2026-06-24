import type { ReceiptData } from "../../types";
import { formatCurrency } from "../../lib/currency";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { toPng } from "html-to-image";
import { useToast } from "../../context/ToastContext";
import { useState } from "react";

interface ReceiptPreviewProps {
  open: boolean;
  receipt: ReceiptData | null;
  onClose: () => void;
}

export function ReceiptPreview({ open, receipt, onClose }: ReceiptPreviewProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  if (!receipt) {
    return null;
  }

  const handleSaveReceipt = async () => {
    setSaving(true);
    try {
      const receiptEl = document.getElementById('receipt-content');
      if (!receiptEl) {
        showToast('Receipt element not found', 'error');
        setSaving(false);
        return;
      }
      
      const url = await toPng(receiptEl, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receipt.receipt_no}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showToast('Receipt saved successfully as PNG', 'success');
    } catch (err) {
      console.error('Error saving receipt:', err);
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Receipt"
      onClose={onClose}
      wide
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={handleSaveReceipt} disabled={saving}>
            {saving ? 'Saving...' : 'Save Receipt'}
          </Button>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      }
    >
      <div className="mx-auto max-w-sm">
        <div id="receipt-content" className="receipt-print rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-800">
          <div className="text-center">
          <h3 className="text-lg font-bold">{receipt.shop_name}</h3>
          {receipt.shop_address ? <p className="mt-1">{receipt.shop_address}</p> : null}
          {receipt.shop_contact ? <p>{receipt.shop_contact}</p> : null}
        </div>

        <div className="my-4 border-y border-dashed border-slate-300 py-3 text-xs text-slate-500">
          <p>Receipt: {receipt.receipt_no}</p>
          <p>Date: {receipt.created_at}</p>
          <p>Payment: {receipt.payment_method.toUpperCase()}</p>
        </div>

        <div className="space-y-2">
          {receipt.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-xs text-slate-500">
                  {item.quantity} x {formatCurrency(item.unit_price)}
                </p>
              </div>
              <p className="font-medium">{formatCurrency(item.line_total)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 border-t border-dashed border-slate-300 pt-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(receipt.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(receipt.discount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <span>{formatCurrency(receipt.amount_paid)}</span>
          </div>
          <div className="flex justify-between">
            <span>Change</span>
            <span>{formatCurrency(receipt.change_amount)}</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">Thank you for your purchase!</p>
        </div>
      </div>
    </Modal>
  );
}
