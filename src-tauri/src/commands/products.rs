use crate::db::{round_money, DbPool};
use crate::error::AppError;
use crate::models::product::{
    AdjustStockInput, CreateProductInput, Product, UpdateProductInput, UpdateStockQtyInput,
};
use sqlx::Row;
use std::time::Duration;
use tauri::State;
use uuid::Uuid;

fn map_product(row: sqlx::postgres::PgRow) -> Result<Product, sqlx::Error> {
    let created_at: chrono::NaiveDateTime = row.try_get("created_at")?;
    let updated_at: chrono::NaiveDateTime = row.try_get("updated_at")?;
    
    Ok(Product {
        id: row.try_get("id")?,
        sku: row.try_get("sku")?,
        name: row.try_get("name")?,
        category_id: row.try_get("category_id")?,
        category_name: row.try_get("category_name")?,
        unit_price: row.try_get("unit_price")?,
        cost_price: row.try_get("cost_price")?,
        stock_qty: row.try_get("stock_qty")?,
        min_stock: row.try_get("min_stock")?,
        barcode: row.try_get("barcode")?,
        is_active: row.try_get::<i32, _>("is_active")? == 1,
        created_at: created_at.to_string(),
        updated_at: updated_at.to_string(),
    })
}

const PRODUCT_SELECT: &str = "
    SELECT p.id, p.sku, p.name, p.category_id, COALESCE(c.name, 'Unknown') as category_name, p.unit_price, p.cost_price,
           p.stock_qty, p.min_stock, p.barcode, p.is_active, p.created_at, p.updated_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
";

// --- IMPLEMENTATIONS ---

pub async fn list_products_impl(
    pool: &DbPool,
    category_id: Option<String>,
    include_inactive: Option<bool>,
) -> Result<Vec<Product>, AppError> {
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        let include_inactive = include_inactive.unwrap_or(false);

        let mut query = format!("{PRODUCT_SELECT} WHERE 1=1");
        if !include_inactive {
            query.push_str(" AND p.is_active = 1");
        }
        
        if let Some(cat_id) = category_id {
            query.push_str(" AND p.category_id = $1 ORDER BY c.sort_order, p.name LIMIT 1000");
            let rows = sqlx::query(&query)
                .bind(cat_id)
                .fetch_all(pool)
                .await?;
            
            rows.into_iter()
                .map(map_product)
                .collect::<Result<Vec<_>, _>>()
        } else {
            query.push_str(" ORDER BY c.sort_order, p.name LIMIT 1000");
            let rows = sqlx::query(&query)
                .fetch_all(pool)
                .await?;
            
            rows.into_iter()
                .map(map_product)
                .collect::<Result<Vec<_>, _>>()
        }
    })
    .await;

    match result {
        Ok(query_result) => Ok(query_result?),
        Err(_) => {
            eprintln!("Database query timed out in list_products_impl");
            Err(AppError::Timeout)
        }
    }
}

pub async fn create_product_impl(pool: &DbPool, input: CreateProductInput) -> Result<Product, AppError> {
    validate_product_input(&input.sku, &input.name, input.unit_price, input.stock_qty)?;

    let id = Uuid::new_v4().to_string();
    let unit_price = round_money(input.unit_price);
    let cost_price = input.cost_price.map(round_money);

    let result = tokio::time::timeout(Duration::from_secs(3), async {
        sqlx::query(
            "INSERT INTO products (id, sku, name, category_id, unit_price, cost_price, stock_qty, min_stock, barcode)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        )
        .bind(&id)
        .bind(input.sku.trim())
        .bind(input.name.trim())
        .bind(&input.category_id)
        .bind(unit_price)
        .bind(cost_price)
        .bind(input.stock_qty.max(0))
        .bind(input.min_stock.max(0))
        .bind(&input.barcode)
        .execute(pool)
        .await
    }).await;

    match result {
        Ok(query_result) => {
            query_result?;
            get_product_by_id_impl(pool, &id).await
        }
        Err(_) => Err(AppError::Timeout)
    }
}

pub async fn update_product_impl(pool: &DbPool, input: UpdateProductInput) -> Result<Product, AppError> {
    if input.sku.trim().is_empty() || input.name.trim().is_empty() {
        return Err(AppError::Internal("SKU and name are required.".to_string()));
    }
    if input.unit_price < 0.0 {
        return Err(AppError::Internal("Unit price cannot be negative.".to_string()));
    }

    let unit_price = round_money(input.unit_price);
    let cost_price = input.cost_price.map(round_money);

    let result = tokio::time::timeout(Duration::from_secs(3), async {
        sqlx::query(
            "UPDATE products SET sku = $1, name = $2, category_id = $3, unit_price = $4,
             cost_price = $5, min_stock = $6, barcode = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9",
        )
        .bind(input.sku.trim())
        .bind(input.name.trim())
        .bind(&input.category_id)
        .bind(unit_price)
        .bind(cost_price)
        .bind(input.min_stock.max(0))
        .bind(&input.barcode)
        .bind(if input.is_active { 1 } else { 0 })
        .bind(&input.id)
        .execute(pool)
        .await
    }).await;

    match result {
        Ok(query_result) => {
            let res = query_result?;
            if res.rows_affected() == 0 {
                return Err(AppError::Internal("Product not found.".to_string()));
            }
            get_product_by_id_impl(pool, &input.id).await
        }
        Err(_) => Err(AppError::Timeout)
    }
}

pub async fn delete_product_impl(pool: &DbPool, product_id: &str) -> Result<(), AppError> {
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        sqlx::query("UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1")
            .bind(product_id)
            .execute(pool)
            .await
    }).await;

    match result {
        Ok(query_result) => {
            let res = query_result?;
            if res.rows_affected() == 0 {
                return Err(AppError::Internal("Product not found.".to_string()));
            }
            Ok(())
        }
        Err(_) => Err(AppError::Timeout)
    }
}

pub async fn permanently_delete_product_impl(pool: &DbPool, product_id: &str) -> Result<(), AppError> {
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        let res = sqlx::query("DELETE FROM products WHERE id = $1")
            .bind(product_id)
            .execute(pool)
            .await?;

        if res.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Ok(())
    })
    .await;

    match result {
        Ok(Ok(_)) => Ok(()),
        Ok(Err(sqlx::Error::RowNotFound)) => Err(AppError::Internal("Product not found.".to_string())),
        Ok(Err(e)) => Err(AppError::from(e)),
        Err(_) => Err(AppError::Timeout)
    }
}

pub async fn adjust_stock_impl(pool: &DbPool, input: AdjustStockInput) -> Result<Product, AppError> {
    if input.delta == 0 {
        return Err(AppError::Internal("Stock adjustment must be non-zero.".to_string()));
    }

    let result = tokio::time::timeout(Duration::from_secs(3), async {
        let current_stock: Option<i32> = sqlx::query_scalar("SELECT stock_qty FROM products WHERE id = $1 AND is_active = 1")
            .bind(&input.product_id)
            .fetch_optional(pool)
            .await?;

        if let Some(stock) = current_stock {
            let new_stock = stock + input.delta;
            if new_stock < 0 {
                return Err(sqlx::Error::Protocol("Stock cannot go below zero.".to_string())); // Hacky way to propagate custom error through sqlx
            }

            sqlx::query("UPDATE products SET stock_qty = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2")
                .bind(new_stock)
                .bind(&input.product_id)
                .execute(pool)
                .await?;
            
            Ok(())
        } else {
            Err(sqlx::Error::RowNotFound)
        }
    }).await;

    match result {
        Ok(query_result) => {
            match query_result {
                Ok(_) => get_product_by_id_impl(pool, &input.product_id).await,
                Err(sqlx::Error::RowNotFound) => Err(AppError::Internal("Product not found.".to_string())),
                Err(sqlx::Error::Protocol(msg)) => Err(AppError::Internal(msg)), // Catch our custom error string
                Err(e) => Err(AppError::from(e)),
            }
        }
        Err(_) => Err(AppError::Timeout)
    }
}

pub async fn update_stock_qty_impl(pool: &DbPool, input: UpdateStockQtyInput) -> Result<Product, AppError> {
    if input.stock_qty < 0 {
        return Err(AppError::Internal("Stock cannot go below zero.".to_string()));
    }

    let result = tokio::time::timeout(Duration::from_secs(3), async {
        let res = sqlx::query("UPDATE products SET stock_qty = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2")
            .bind(input.stock_qty)
            .bind(&input.product_id)
            .execute(pool)
            .await?;
        
        if res.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }
        Ok(())
    }).await;

    match result {
        Ok(query_result) => {
            match query_result {
                Ok(_) => get_product_by_id_impl(pool, &input.product_id).await,
                Err(sqlx::Error::RowNotFound) => Err(AppError::Internal("Product not found.".to_string())),
                Err(e) => Err(AppError::from(e)),
            }
        }
        Err(_) => Err(AppError::Timeout)
    }
}

async fn get_product_by_id_impl(pool: &DbPool, id: &str) -> Result<Product, AppError> {
    let query = format!("{PRODUCT_SELECT} WHERE p.id = $1");
    let row = sqlx::query(&query)
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::Internal("Product not found.".to_string()))?;
        
    map_product(row).map_err(AppError::from)
}

fn validate_product_input(
    sku: &str,
    name: &str,
    unit_price: f64,
    stock_qty: i32,
) -> Result<(), AppError> {
    if sku.trim().is_empty() || name.trim().is_empty() {
        return Err(AppError::Internal("SKU and name are required.".to_string()));
    }
    if unit_price < 0.0 {
        return Err(AppError::Internal("Unit price cannot be negative.".to_string()));
    }
    if stock_qty < 0 {
        return Err(AppError::Internal("Stock quantity cannot be negative.".to_string()));
    }
    Ok(())
}

// --- TAURI COMMANDS ---

#[tauri::command]
pub async fn list_products(
    pool: State<'_, DbPool>,
    category_id: Option<String>,
    include_inactive: Option<bool>,
) -> Result<Vec<Product>, AppError> {
    list_products_impl(&*pool, category_id, include_inactive).await
}

#[tauri::command]
pub async fn create_product(pool: State<'_, DbPool>, input: CreateProductInput) -> Result<Product, AppError> {
    create_product_impl(&*pool, input).await
}

#[tauri::command]
pub async fn update_product(pool: State<'_, DbPool>, input: UpdateProductInput) -> Result<Product, AppError> {
    update_product_impl(&*pool, input).await
}

#[tauri::command]
pub async fn delete_product(pool: State<'_, DbPool>, product_id: String) -> Result<(), AppError> {
    delete_product_impl(&*pool, &product_id).await
}

#[tauri::command]
pub async fn permanently_delete_product(pool: State<'_, DbPool>, product_id: String) -> Result<(), AppError> {
    permanently_delete_product_impl(&*pool, &product_id).await
}

#[tauri::command]
pub async fn adjust_stock(pool: State<'_, DbPool>, input: AdjustStockInput) -> Result<Product, AppError> {
    adjust_stock_impl(&*pool, input).await
}

#[tauri::command]
pub async fn update_stock_qty(pool: State<'_, DbPool>, input: UpdateStockQtyInput) -> Result<Product, AppError> {
    update_stock_qty_impl(&*pool, input).await
}

// --- TESTS ---

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn test_list_products_seeded_data(pool: PgPool) {
        crate::db::run_migrations(&pool).await.unwrap();

        let result = list_products_impl(&pool, None, None).await;
        
        assert!(result.is_ok(), "Expected Ok result, got error");
        let products = result.unwrap();
        assert!(!products.is_empty(), "Expected seeded products to be present");
        assert!(products.len() >= 15, "Expected at least 15 seeded products");
    }

    #[sqlx::test]
    async fn test_create_product(pool: PgPool) {
        crate::db::run_migrations(&pool).await.unwrap();

        let input = CreateProductInput {
            sku: "TEST-001".to_string(),
            name: "Test Product".to_string(),
            category_id: "a1000001-0000-4000-8000-000000000001".to_string(),
            unit_price: 15.0,
            cost_price: Some(10.0),
            stock_qty: 100,
            min_stock: 10,
            barcode: None,
        };

        let result = create_product_impl(&pool, input).await;
        
        assert!(result.is_ok());
        let product = result.unwrap();
        assert_eq!(product.sku, "TEST-001");
        assert_eq!(product.name, "Test Product");
        assert_eq!(product.stock_qty, 100);
    }
}
