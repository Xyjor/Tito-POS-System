use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleItem {
    pub id: String,
    pub product_id: String,
    pub product_name: String,
    pub unit_price: f64,
    pub quantity: i32,
    pub line_total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleSummary {
    pub id: String,
    pub receipt_no: String,
    pub subtotal: f64,
    pub discount: f64,
    pub total: f64,
    pub amount_paid: f64,
    pub change_amount: f64,
    pub payment_method: String,
    pub created_at: String,
    pub item_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleDetail {
    pub id: String,
    pub receipt_no: String,
    pub subtotal: f64,
    pub discount: f64,
    pub total: f64,
    pub amount_paid: f64,
    pub change_amount: f64,
    pub payment_method: String,
    pub created_at: String,
    pub items: Vec<SaleItem>,
}

#[derive(Debug, Deserialize)]
pub struct CheckoutItemInput {
    pub product_id: String,
    pub quantity: i32,
}

#[derive(Debug, Deserialize)]
pub struct CheckoutInput {
    pub items: Vec<CheckoutItemInput>,
    pub discount: f64,
    pub amount_paid: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReceiptData {
    pub shop_name: String,
    pub shop_address: String,
    pub shop_contact: String,
    pub receipt_no: String,
    pub created_at: String,
    pub items: Vec<SaleItem>,
    pub subtotal: f64,
    pub discount: f64,
    pub total: f64,
    pub amount_paid: f64,
    pub change_amount: f64,
    pub payment_method: String,
}
