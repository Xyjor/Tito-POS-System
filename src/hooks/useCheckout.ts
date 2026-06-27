import { useState, useEffect } from "react";
import { parseAmount, roundMoney } from "../lib/currency";

export function useCheckout(total: number, isOpen: boolean) {
  const [amountPaidStr, setAmountPaidStr] = useState(total.toFixed(2));

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmountPaidStr(total.toFixed(2));
    }
  }, [isOpen, total]);

  const paid = parseAmount(amountPaidStr);
  const change = roundMoney(Math.max(0, paid - total));
  const remaining = roundMoney(Math.max(0, total - paid));
  const canSubmit = paid >= total && total > 0;

  const handleAmountChange = (val: string) => {
    // Only allow digits and up to one decimal point
    if (/^\d*\.?\d{0,2}$/.test(val) || val === "") {
      setAmountPaidStr(val);
    }
  };

  const setExactAmount = () => setAmountPaidStr(total.toFixed(2));

  // Dynamic quick amounts generation based on Philippines Peso
  const generateQuickAmounts = () => {
    const defaultAmounts = [20, 50, 100, 200, 500, 1000];
    
    // Find bills that are greater than or equal to the total
    const validBills = defaultAmounts.filter((amt) => amt >= total);
    
    // If total is larger than 1000, provide logical multiples
    if (total > 1000) {
        const roundedTotal = Math.ceil(total / 500) * 500;
        return [roundedTotal, roundedTotal + 500, roundedTotal + 1000];
    }
    
    // Return at most 3 options
    if (validBills.length > 3) {
      return validBills.slice(0, 3);
    } else if (validBills.length > 0) {
      return validBills;
    }
    
    return [100, 500, 1000]; // Fallback
  };

  return {
    amountPaidStr,
    paid,
    change,
    remaining,
    canSubmit,
    handleAmountChange,
    setAmountPaidStr,
    setExactAmount,
    quickAmounts: generateQuickAmounts(),
  };
}
