import { useEffect, useState } from "react";
import { getSale, listSales } from "../lib/tauri";
import { formatCurrency } from "../lib/currency";
import type { ReceiptData, SaleSummary } from "../types";
import { ReceiptPreview } from "../components/pos/ReceiptPreview";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";

export function SalesPage() {
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSales()
      .then(setSales)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function viewReceipt(saleId: string) {
    setError(null);
    try {
      const [, receiptData] = await getSale(saleId);
      setReceipt(receiptData);
      setReceiptOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-2xl font-bold text-slate-900">Sales History</h2>
        <p className="text-sm text-slate-500">View and reprint past receipts</p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {error ? (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
            Loading sales...
          </div>
        ) : sales.length === 0 ? (
          <EmptyState
            title="No sales yet"
            description="Completed transactions will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Receipt</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{sale.receipt_no}</td>
                    <td className="px-4 py-3">{sale.created_at}</td>
                    <td className="px-4 py-3">{sale.item_count}</td>
                    <td className="px-4 py-3">{formatCurrency(sale.total)}</td>
                    <td className="px-4 py-3">
                      <Button variant="secondary" onClick={() => viewReceipt(sale.id)}>
                        View Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReceiptPreview
        open={receiptOpen}
        receipt={receipt}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
}
