export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  category_name: string;
  unit_price: number;
  cost_price: number | null;
  stock_qty: number;
  min_stock: number;
  barcode: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  category_id: string;
  unit_price: number;
  cost_price?: number | null;
  stock_qty: number;
  min_stock: number;
  barcode?: string | null;
}

export interface UpdateProductInput {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  unit_price: number;
  cost_price?: number | null;
  min_stock: number;
  barcode?: string | null;
  is_active: boolean;
}

export interface AdjustStockInput {
  product_id: string;
  delta: number;
}

export interface UpdateStockQtyInput {
  product_id: string;
  stock_qty: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutItemInput {
  product_id: string;
  quantity: number;
}

export interface CheckoutInput {
  items: CheckoutItemInput[];
  discount: number;
  amount_paid: number;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface SaleSummary {
  id: string;
  receipt_no: string;
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  created_at: string;
  item_count: number;
}

export interface User {
  id: string;
  username: string;
  role: string;
  can_manage_products: boolean;
}

export interface CreateUserInput {
  username: string;
  password_hash: string;
  role: string;
  can_manage_products: boolean;
}

export interface UpdateUserInput {
  id: string;
  username: string;
  role: string;
  can_manage_products: boolean;
}

export interface UpdatePasswordInput {
  id: string;
  new_password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface SaleDetail {
  id: string;
  receipt_no: string;
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  created_at: string;
  items: SaleItem[];
}

export interface ReceiptData {
  shop_name: string;
  shop_address: string;
  shop_contact: string;
  receipt_no: string;
  created_at: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
}

export type CheckoutResult = [SaleDetail, ReceiptData];

export interface ShopSettings {
  shop_name: string;
  shop_address: string;
  shop_contact: string;
  receipt_prefix: string;
}

export interface UpdateSettingsInput {
  shop_name: string;
  shop_address: string;
  shop_contact: string;
  receipt_prefix: string;
}
