import { invoke } from "@tauri-apps/api/core";
import type {
  AdjustStockInput,
  Category,
  CheckoutInput,
  CheckoutResult,
  CreateProductInput,
  Product,
  SaleSummary,
  ShopSettings,
  UpdateProductInput,
  UpdateSettingsInput,
  User,
  CreateUserInput,
  UpdateUserInput,
  UpdatePasswordInput,
} from "../types";

export function listCategories(): Promise<Category[]> {
  return invoke("list_categories");
}

export function createCategory(name: string): Promise<Category> {
  return invoke("create_category", { name });
}

export function deleteCategory(id: string): Promise<void> {
  return invoke("delete_category", { id });
}

export function listProducts(
  categoryId?: string | null,
  includeInactive = false,
): Promise<Product[]> {
  return invoke("list_products", {
    categoryId: categoryId ?? null,
    includeInactive,
  });
}

export function createProduct(input: CreateProductInput): Promise<Product> {
  return invoke("create_product", { input });
}

export function updateProduct(input: UpdateProductInput): Promise<Product> {
  return invoke("update_product", { input });
}

export function deleteProduct(productId: string): Promise<void> {
  return invoke("delete_product", { productId });
}

export function adjustStock(input: AdjustStockInput): Promise<Product> {
  return invoke("adjust_stock", { input });
}

export function updateStockQty(input: { product_id: string; stock_qty: number }): Promise<Product> {
  return invoke("update_stock_qty", { input });
}

export function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  return invoke("checkout", { input });
}

export function login(username: string, password: string): Promise<User> {
  return invoke("login", { input: { username, password } });
}

export function listUsers(): Promise<User[]> {
  return invoke("list_users");
}

export function createUser(input: CreateUserInput): Promise<User> {
  return invoke("create_user", { input });
}

export function updateUser(input: UpdateUserInput): Promise<User> {
  return invoke("update_user", { input });
}

export function updatePassword(input: UpdatePasswordInput): Promise<void> {
  return invoke("update_password", { input });
}

export function deleteUser(id: string): Promise<void> {
  return invoke("delete_user", { id });
}

export function listSales(): Promise<SaleSummary[]> {
  return invoke("list_sales");
}

export function getSale(saleId: string): Promise<CheckoutResult> {
  return invoke("get_sale", { saleId });
}

export function getSettings(): Promise<ShopSettings> {
  return invoke("get_settings");
}

export function updateSettings(input: UpdateSettingsInput): Promise<ShopSettings> {
  return invoke("update_settings", { input });
}
