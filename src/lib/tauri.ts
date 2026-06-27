import type {
  Category,
  CheckoutInput,
  CheckoutResult,
  Product,
  SaleSummary,
  ShopSettings,
  User,
} from "../types";
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_SETTINGS, initialMockSales } from "../data/mockData";

// Mutable in-memory store
let products = [...MOCK_PRODUCTS];
let sales = [...initialMockSales];
let receiptCounter = 1025;

export async function listCategories(): Promise<Category[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_CATEGORIES;
}

export async function listProducts(
  categoryId?: string | null,
  _includeInactive = false,
): Promise<Product[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (categoryId) {
    return products.filter(p => p.category_id === categoryId);
  }
  return products;
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate longer processing
  
  const receiptNo = `${MOCK_SETTINGS.receipt_prefix}-${receiptCounter++}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  // Build sale items and deduct stock
  let subtotal = 0;
  const items = input.items.map((item, index) => {
    const productIndex = products.findIndex(p => p.id === item.product_id);
    const product = products[productIndex];
    
    // Deduct stock
    products[productIndex] = {
      ...product,
      stock_qty: Math.max(0, product.stock_qty - item.quantity)
    };
    
    const lineTotal = product.unit_price * item.quantity;
    subtotal += lineTotal;
    
    return {
      id: `sitem-${Date.now()}-${index}`,
      product_id: product.id,
      product_name: product.name,
      unit_price: product.unit_price,
      quantity: item.quantity,
      line_total: lineTotal
    };
  });
  
  const total = Math.max(0, subtotal - input.discount);
  const change = Math.max(0, input.amount_paid - total);
  
  const saleDetail = {
    id: `sale-${Date.now()}`,
    receipt_no: receiptNo,
    subtotal,
    discount: input.discount,
    total,
    amount_paid: input.amount_paid,
    change_amount: change,
    payment_method: "cash",
    created_at: now,
    items
  };
  
  const receiptData = {
    shop_name: MOCK_SETTINGS.shop_name,
    shop_address: MOCK_SETTINGS.shop_address,
    shop_contact: MOCK_SETTINGS.shop_contact,
    receipt_no: receiptNo,
    created_at: now,
    items,
    subtotal,
    discount: input.discount,
    total,
    amount_paid: input.amount_paid,
    change_amount: change,
    payment_method: "cash"
  };
  
  // Add to sales history
  sales.unshift({
    id: saleDetail.id,
    receipt_no: receiptNo,
    subtotal,
    discount: input.discount,
    total,
    amount_paid: input.amount_paid,
    change_amount: change,
    payment_method: "cash",
    created_at: now,
    item_count: items.reduce((sum, item) => sum + item.quantity, 0)
  });
  
  return [saleDetail, receiptData];
}

export async function login(username: string, _password: string): Promise<User> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (username !== "demo") {
    throw new Error("Invalid credentials. Use 'demo' to login.");
  }
  
  return {
    id: "user-1",
    username: "demo",
    role: "admin",
    can_manage_products: true
  };
}

export async function listSales(): Promise<SaleSummary[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return sales;
}

export async function getSettings(): Promise<ShopSettings> {
  return MOCK_SETTINGS;
}

// Implement mock stats endpoint directly since we don't have Rust backend
export async function getRevenueStats() {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - (7 * 24 * 60 * 60 * 1000);
  
  let total_revenue = 0;
  let today_revenue = 0;
  let week_revenue = 0;
  
  sales.forEach(sale => {
    total_revenue += sale.total;
    
    const saleTime = new Date(sale.created_at).getTime();
    if (saleTime >= todayStart) {
      today_revenue += sale.total;
    }
    if (saleTime >= weekStart) {
      week_revenue += sale.total;
    }
  });
  
  return {
    total_revenue,
    today_revenue,
    week_revenue,
    total_sales: sales.length
  };
}

// --- Unimplemented functions below (not used in demo) ---

export async function createCategory(): Promise<Category> { throw new Error("Not implemented in demo"); }
export async function deleteCategory(): Promise<void> { throw new Error("Not implemented in demo"); }
export async function createProduct(): Promise<Product> { throw new Error("Not implemented in demo"); }
export async function updateProduct(): Promise<Product> { throw new Error("Not implemented in demo"); }
export async function deleteProduct(): Promise<void> { throw new Error("Not implemented in demo"); }
export async function permanentlyDeleteProduct(): Promise<void> { throw new Error("Not implemented in demo"); }
export async function adjustStock(): Promise<Product> { throw new Error("Not implemented in demo"); }
export async function updateStockQty(): Promise<Product> { throw new Error("Not implemented in demo"); }
export async function listUsers(): Promise<User[]> { throw new Error("Not implemented in demo"); }
export async function createUser(): Promise<User> { throw new Error("Not implemented in demo"); }
export async function updateUser(): Promise<User> { throw new Error("Not implemented in demo"); }
export async function updatePassword(): Promise<void> { throw new Error("Not implemented in demo"); }
export async function deleteUser(): Promise<void> { throw new Error("Not implemented in demo"); }
export async function getSale(): Promise<CheckoutResult> { throw new Error("Not implemented in demo"); }
export async function deleteSale(): Promise<void> { throw new Error("Not implemented in demo"); }
export async function updateSettings(): Promise<ShopSettings> { throw new Error("Not implemented in demo"); }
