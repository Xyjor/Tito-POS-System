import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "../types";
import { roundMoney } from "../lib/currency";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  setDiscount: (discount: number) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const addItem = useCallback((product: Product) => {
    if (product.stock_qty <= 0) {
      return;
    }

    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_qty) {
          return current;
        }
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }
          const nextQty = Math.max(0, Math.min(quantity, item.product.stock_qty));
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
  }, []);

  const subtotal = useMemo(
    () =>
      roundMoney(
        items.reduce(
          (sum, item) => sum + item.product.unit_price * item.quantity,
          0,
        ),
      ),
    [items],
  );

  const total = useMemo(
    () => roundMoney(Math.max(0, subtotal - discount)),
    [subtotal, discount],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      discount,
      total,
      setDiscount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      discount,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
