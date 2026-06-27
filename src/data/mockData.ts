import { Category, Product, SaleSummary } from "../types";

export const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "School Supplies", sort_order: 1 },
  { id: "cat-2", name: "Office Supplies", sort_order: 2 },
  { id: "cat-3", name: "Snacks & Beverages", sort_order: 3 },
  { id: "cat-4", name: "Personal Care", sort_order: 4 },
  { id: "cat-5", name: "General Items", sort_order: 5 },
];

export const MOCK_PRODUCTS: Product[] = [
  // School Supplies
  { id: "prod-1", sku: "SCH-001", name: "Notebook (80 leaves)", category_id: "cat-1", category_name: "School Supplies", unit_price: 45.00, cost_price: 30.00, stock_qty: 150, min_stock: 20, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-2", sku: "SCH-002", name: "Ballpen (Blue)", category_id: "cat-1", category_name: "School Supplies", unit_price: 12.00, cost_price: 8.00, stock_qty: 300, min_stock: 50, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-3", sku: "SCH-003", name: "Yellow Pad", category_id: "cat-1", category_name: "School Supplies", unit_price: 35.00, cost_price: 25.00, stock_qty: 80, min_stock: 20, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-4", sku: "SCH-004", name: "Pencil #2", category_id: "cat-1", category_name: "School Supplies", unit_price: 8.00, cost_price: 5.00, stock_qty: 250, min_stock: 50, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-5", sku: "SCH-005", name: "Crayons (24 colors)", category_id: "cat-1", category_name: "School Supplies", unit_price: 85.00, cost_price: 60.00, stock_qty: 45, min_stock: 10, barcode: null, is_active: true, created_at: "", updated_at: "" },
  
  // Office Supplies
  { id: "prod-6", sku: "OFF-001", name: "Bond Paper (A4, 500pcs)", category_id: "cat-2", category_name: "Office Supplies", unit_price: 250.00, cost_price: 200.00, stock_qty: 120, min_stock: 10, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-7", sku: "OFF-002", name: "Folder (Long)", category_id: "cat-2", category_name: "Office Supplies", unit_price: 15.00, cost_price: 10.00, stock_qty: 200, min_stock: 50, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-8", sku: "OFF-003", name: "Stapler", category_id: "cat-2", category_name: "Office Supplies", unit_price: 95.00, cost_price: 70.00, stock_qty: 30, min_stock: 5, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-9", sku: "OFF-004", name: "Scotch Tape", category_id: "cat-2", category_name: "Office Supplies", unit_price: 28.00, cost_price: 18.00, stock_qty: 75, min_stock: 15, barcode: null, is_active: true, created_at: "", updated_at: "" },
  
  // Snacks
  { id: "prod-10", sku: "SNK-001", name: "C2 Apple (500ml)", category_id: "cat-3", category_name: "Snacks & Beverages", unit_price: 25.00, cost_price: 18.00, stock_qty: 100, min_stock: 20, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-11", sku: "SNK-002", name: "Chippy BBQ", category_id: "cat-3", category_name: "Snacks & Beverages", unit_price: 12.00, cost_price: 9.00, stock_qty: 200, min_stock: 30, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-12", sku: "SNK-003", name: "Skyflakes", category_id: "cat-3", category_name: "Snacks & Beverages", unit_price: 10.00, cost_price: 7.00, stock_qty: 150, min_stock: 30, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-13", sku: "SNK-004", name: "Boy Bawang", category_id: "cat-3", category_name: "Snacks & Beverages", unit_price: 15.00, cost_price: 11.00, stock_qty: 120, min_stock: 20, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-14", sku: "SNK-005", name: "Kopiko Brown", category_id: "cat-3", category_name: "Snacks & Beverages", unit_price: 8.00, cost_price: 6.00, stock_qty: 180, min_stock: 50, barcode: null, is_active: true, created_at: "", updated_at: "" },
  
  // Personal Care
  { id: "prod-15", sku: "PER-001", name: "Safeguard Soap", category_id: "cat-4", category_name: "Personal Care", unit_price: 42.00, cost_price: 32.00, stock_qty: 60, min_stock: 15, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-16", sku: "PER-002", name: "Toothbrush", category_id: "cat-4", category_name: "Personal Care", unit_price: 35.00, cost_price: 25.00, stock_qty: 45, min_stock: 10, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-17", sku: "PER-003", name: "Alcohol (70ml)", category_id: "cat-4", category_name: "Personal Care", unit_price: 28.00, cost_price: 20.00, stock_qty: 90, min_stock: 20, barcode: null, is_active: true, created_at: "", updated_at: "" },
  
  // General Items
  { id: "prod-18", sku: "GEN-001", name: "Plastic Bag (Small)", category_id: "cat-5", category_name: "General Items", unit_price: 3.00, cost_price: 1.50, stock_qty: 500, min_stock: 100, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-19", sku: "GEN-002", name: "Rubber Band (pack)", category_id: "cat-5", category_name: "General Items", unit_price: 10.00, cost_price: 5.00, stock_qty: 100, min_stock: 20, barcode: null, is_active: true, created_at: "", updated_at: "" },
  { id: "prod-20", sku: "GEN-003", name: "Candle (1pc)", category_id: "cat-5", category_name: "General Items", unit_price: 5.00, cost_price: 3.00, stock_qty: 0, min_stock: 20, barcode: null, is_active: true, created_at: "", updated_at: "" }, // Explicitly out of stock for demo purposes
];

export const MOCK_SETTINGS = {
  shop_name: "Tito's Sari-Sari & School Supplies",
  shop_address: "123 Rizal St., Brgy. Centro",
  shop_contact: "0917-123-4567",
  receipt_prefix: "TITO",
};

// Generate realistic mock sales for the last 30 days
export function generateMockSales(): SaleSummary[] {
  const sales: SaleSummary[] = [];
  const now = new Date();
  let receiptId = 1000;
  
  // Generate 25 sales spread across the last 30 days
  for (let i = 0; i < 25; i++) {
    // Random date within last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const saleDate = new Date(now);
    saleDate.setDate(now.getDate() - daysAgo);
    
    // Format: YYYY-MM-DD HH:MM:SS
    const dateStr = saleDate.toISOString().replace('T', ' ').substring(0, 19);
    
    // Random total between 20 and 500
    const total = Math.floor(Math.random() * 480) + 20;
    
    sales.push({
      id: `sale-${i}`,
      receipt_no: `TITO-${receiptId++}`,
      subtotal: total,
      discount: 0,
      total: total,
      amount_paid: total + (total % 10 === 0 ? 0 : 10 - (total % 10)), // Pay slightly rounded up amount
      change_amount: (total + (total % 10 === 0 ? 0 : 10 - (total % 10))) - total,
      payment_method: "cash",
      created_at: dateStr,
      item_count: Math.floor(Math.random() * 5) + 1
    });
  }
  
  // Sort by date descending
  return sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const initialMockSales = generateMockSales();
