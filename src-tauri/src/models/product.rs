use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub sku: String,
    pub name: String,
    pub category_id: String,
    pub category_name: String,
    pub unit_price: f64,
    pub cost_price: Option<f64>,
    pub stock_qty: i32,
    pub min_stock: i32,
    pub barcode: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateProductInput {
    pub sku: String,
    pub name: String,
    pub category_id: String,
    pub unit_price: f64,
    pub cost_price: Option<f64>,
    pub stock_qty: i32,
    pub min_stock: i32,
    pub barcode: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductInput {
    pub id: String,
    pub sku: String,
    pub name: String,
    pub category_id: String,
    pub unit_price: f64,
    pub cost_price: Option<f64>,
    pub min_stock: i32,
    pub barcode: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Deserialize)]
pub struct AdjustStockInput {
    pub product_id: String,
    pub delta: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStockQtyInput {
    pub product_id: String,
    pub stock_qty: i32,
}
