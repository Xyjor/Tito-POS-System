use crate::db::DbPool;
use crate::error::AppError;
use crate::models::sale::{CheckoutInput, ReceiptData, SaleDetail, SaleItem, SaleSummary};
use crate::services::checkout::{self, CheckoutError};
use serde::Serialize;
use sqlx::Row;
use std::time::Duration;
use tauri::State;

#[derive(Serialize)]
pub struct RevenueStats {
    pub total_revenue: f64,
    pub today_revenue: f64,
    pub week_revenue: f64,
    pub total_sales: i64,
}

// --- IMPLEMENTATIONS ---

pub async fn get_revenue_stats_impl(pool: &DbPool) -> Result<RevenueStats, AppError> {
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        let total_revenue: f64 = sqlx::query_scalar("SELECT COALESCE(SUM(total), 0) FROM sales")
            .fetch_one(pool)
            .await
            .unwrap_or(0.0);

        let today_revenue: f64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = CURRENT_DATE",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0.0);

        let week_revenue: f64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(total), 0) FROM sales WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0.0);

        let total_sales: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sales")
            .fetch_one(pool)
            .await
            .unwrap_or(0);

        RevenueStats {
            total_revenue,
            today_revenue,
            week_revenue,
            total_sales,
        }
    })
    .await;

    match result {
        Ok(stats) => Ok(stats),
        Err(_) => {
            eprintln!("Database query timed out in get_revenue_stats_impl");
            Err(AppError::Timeout)
        }
    }
}

pub async fn checkout_impl(
    pool: &DbPool,
    input: CheckoutInput,
) -> Result<(SaleDetail, ReceiptData), AppError> {
    // Checkout service might take a bit longer if there are many items, giving it 5 seconds
    let result = tokio::time::timeout(Duration::from_secs(5), checkout::checkout(pool, input)).await;

    match result {
        Ok(checkout_res) => checkout_res.map_err(|e| match e {
            CheckoutError::Message(msg) => AppError::Internal(msg),
            CheckoutError::Db(err) => AppError::from(err),
        }),
        Err(_) => {
            eprintln!("Checkout timed out");
            Err(AppError::Timeout)
        }
    }
}

pub async fn list_sales_impl(pool: &DbPool) -> Result<Vec<SaleSummary>, AppError> {
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        sqlx::query(
            "SELECT s.id, s.receipt_no, s.subtotal, s.discount, s.total, s.amount_paid,
                    s.change_amount, s.payment_method, s.created_at,
                    (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
             FROM sales s
             ORDER BY s.created_at DESC LIMIT 1000",
        )
        .fetch_all(pool)
        .await
    })
    .await;

    match result {
        Ok(query_res) => {
            let rows = query_res?;
            let mut sales = Vec::new();
            for row in rows {
                let created_at: chrono::NaiveDateTime = row.try_get("created_at")?;
                sales.push(SaleSummary {
                    id: row.try_get("id")?,
                    receipt_no: row.try_get("receipt_no")?,
                    subtotal: row.try_get("subtotal")?,
                    discount: row.try_get("discount")?,
                    total: row.try_get("total")?,
                    amount_paid: row.try_get("amount_paid")?,
                    change_amount: row.try_get("change_amount")?,
                    payment_method: row.try_get("payment_method")?,
                    created_at: created_at.to_string(),
                    item_count: row.try_get::<i64, _>("item_count")? as i32,
                });
            }
            Ok(sales)
        }
        Err(_) => Err(AppError::Timeout),
    }
}

pub async fn get_sale_impl(
    pool: &DbPool,
    sale_id: &str,
) -> Result<(SaleDetail, ReceiptData), AppError> {
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        let sale_row = sqlx::query(
            "SELECT id, receipt_no, subtotal, discount, total, amount_paid, change_amount, payment_method, created_at
             FROM sales WHERE id = $1"
        )
        .bind(sale_id)
        .fetch_optional(pool)
        .await?;

        if let Some(row) = sale_row {
            let created_at: chrono::NaiveDateTime = row.try_get("created_at")?;
            
            let mut sale_detail = SaleDetail {
                id: row.try_get("id")?,
                receipt_no: row.try_get("receipt_no")?,
                subtotal: row.try_get("subtotal")?,
                discount: row.try_get("discount")?,
                total: row.try_get("total")?,
                amount_paid: row.try_get("amount_paid")?,
                change_amount: row.try_get("change_amount")?,
                payment_method: row.try_get("payment_method")?,
                created_at: created_at.to_string(),
                items: Vec::new(),
            };

            let item_rows = sqlx::query(
                "SELECT id, product_id, product_name, unit_price, quantity, line_total
                 FROM sale_items WHERE sale_id = $1 ORDER BY product_name"
            )
            .bind(sale_id)
            .fetch_all(pool)
            .await?;

            let mut items = Vec::new();
            for item_row in item_rows {
                items.push(SaleItem {
                    id: item_row.try_get("id")?,
                    product_id: item_row.try_get("product_id")?,
                    product_name: item_row.try_get("product_name")?,
                    unit_price: item_row.try_get("unit_price")?,
                    quantity: item_row.try_get("quantity")?,
                    line_total: item_row.try_get("line_total")?,
                });
            }

            sale_detail.items = items.clone();

            let settings = load_settings_map(pool).await?;
            let shop_settings = crate::models::settings::ShopSettings::from_map(settings);

            let receipt = ReceiptData {
                shop_name: shop_settings.shop_name,
                shop_address: shop_settings.shop_address,
                shop_contact: shop_settings.shop_contact,
                receipt_no: sale_detail.receipt_no.clone(),
                created_at: sale_detail.created_at.clone(),
                items,
                subtotal: sale_detail.subtotal,
                discount: sale_detail.discount,
                total: sale_detail.total,
                amount_paid: sale_detail.amount_paid,
                change_amount: sale_detail.change_amount,
                payment_method: sale_detail.payment_method.clone(),
            };

            Ok((sale_detail, receipt))
        } else {
            Err(AppError::Internal("Sale not found.".to_string()))
        }
    })
    .await;

    match result {
        Ok(inner) => inner,
        Err(_) => Err(AppError::Timeout),
    }
}

async fn load_settings_map(
    pool: &DbPool,
) -> Result<std::collections::HashMap<String, String>, sqlx::Error> {
    let rows = sqlx::query("SELECT key, value FROM settings")
        .fetch_all(pool)
        .await?;

    let mut map = std::collections::HashMap::new();
    for row in rows {
        let key: String = row.try_get("key")?;
        let value: String = row.try_get("value")?;
        map.insert(key, value);
    }
    Ok(map)
}

// --- TAURI COMMANDS ---

#[tauri::command]
pub async fn get_revenue_stats(pool: State<'_, DbPool>) -> Result<RevenueStats, AppError> {
    get_revenue_stats_impl(&*pool).await
}

#[tauri::command]
pub async fn checkout(
    pool: State<'_, DbPool>,
    input: CheckoutInput,
) -> Result<(SaleDetail, ReceiptData), AppError> {
    checkout_impl(&*pool, input).await
}

#[tauri::command]
pub async fn list_sales(pool: State<'_, DbPool>) -> Result<Vec<SaleSummary>, AppError> {
    list_sales_impl(&*pool).await
}

#[tauri::command]
pub async fn get_sale(
    pool: State<'_, DbPool>,
    sale_id: String,
) -> Result<(SaleDetail, ReceiptData), AppError> {
    get_sale_impl(&*pool, &sale_id).await
}

// --- TESTS ---

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn test_get_revenue_stats_empty(pool: PgPool) {
        crate::db::run_migrations(&pool).await.unwrap();

        let result = get_revenue_stats_impl(&pool).await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        
        assert_eq!(stats.total_revenue, 0.0);
        assert_eq!(stats.total_sales, 0);
    }
}
