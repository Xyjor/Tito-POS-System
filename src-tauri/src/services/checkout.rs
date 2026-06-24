use crate::db::{round_money, DbError, DbPool};
use crate::models::sale::{CheckoutInput, ReceiptData, SaleDetail, SaleItem};
use crate::models::settings::ShopSettings;
use sqlx::Row;
use uuid::Uuid;

#[derive(Debug, thiserror::Error)]
pub enum CheckoutError {
    #[error("{0}")]
    Message(String),
    #[error("database error: {0}")]
    Db(#[from] DbError),
}

impl From<sqlx::Error> for CheckoutError {
    fn from(value: sqlx::Error) -> Self {
        CheckoutError::Db(DbError::from(value))
    }
}

pub async fn checkout(pool: &DbPool, input: CheckoutInput) -> Result<(SaleDetail, ReceiptData), CheckoutError> {
    if input.items.is_empty() {
        return Err(CheckoutError::Message("Cart is empty.".to_string()));
    }

    if input.amount_paid <= 0.0 {
        return Err(CheckoutError::Message("Amount paid must be greater than zero.".to_string()));
    }

    let discount = round_money(input.discount.max(0.0));

    let settings = load_settings(pool).await?;
    let receipt_no = generate_receipt_no(pool, &settings.receipt_prefix).await?;

    let mut tx = pool.begin().await?;

    let mut line_items: Vec<SaleItem> = Vec::new();
    let mut subtotal = 0.0;

    for item in &input.items {
        if item.quantity <= 0 {
            tx.rollback().await?;
            return Err(CheckoutError::Message(
                "Each item must have a quantity greater than zero.".to_string(),
            ));
        }

        let product_row = sqlx::query(
            "SELECT id, name, unit_price, stock_qty, is_active FROM products WHERE id = $1"
        )
        .bind(&item.product_id)
        .fetch_optional(&mut *tx)
        .await?;

        if product_row.is_none() {
            tx.rollback().await?;
            return Err(CheckoutError::Message("Product not found.".to_string()));
        }

        let row = product_row.unwrap();
        let product_id: String = row.try_get("id")?;
        let product_name: String = row.try_get("name")?;
        let unit_price: f64 = row.try_get("unit_price")?;
        let stock_qty: i32 = row.try_get("stock_qty")?;
        let is_active: i32 = row.try_get("is_active")?;

        if is_active == 0 {
            tx.rollback().await?;
            return Err(CheckoutError::Message(format!(
                "{product_name} is no longer available."
            )));
        }

        if stock_qty < item.quantity {
            tx.rollback().await?;
            return Err(CheckoutError::Message(format!(
                "Insufficient stock for {product_name}. Available: {stock_qty}."
            )));
        }

        let line_total = round_money(unit_price * item.quantity as f64);
        subtotal = round_money(subtotal + line_total);

        sqlx::query(
            "UPDATE products SET stock_qty = stock_qty - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
        )
        .bind(item.quantity)
        .bind(&product_id)
        .execute(&mut *tx)
        .await?;

        line_items.push(SaleItem {
            id: Uuid::new_v4().to_string(),
            product_id,
            product_name,
            unit_price,
            quantity: item.quantity,
            line_total,
        });
    }

    subtotal = round_money(subtotal);
    if discount > subtotal {
        tx.rollback().await?;
        return Err(CheckoutError::Message(
            "Discount cannot exceed subtotal.".to_string(),
        ));
    }

    let total = round_money(subtotal - discount);
    let change_amount = round_money(input.amount_paid - total);

    if change_amount < 0.0 {
        tx.rollback().await?;
        return Err(CheckoutError::Message(
            "Amount paid is less than the total.".to_string(),
        ));
    }

    let sale_id = Uuid::new_v4().to_string();

    let inserted_sale = sqlx::query(
        "INSERT INTO sales (id, receipt_no, subtotal, discount, total, amount_paid, change_amount, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'cash') RETURNING created_at"
    )
    .bind(&sale_id)
    .bind(&receipt_no)
    .bind(subtotal)
    .bind(discount)
    .bind(total)
    .bind(input.amount_paid)
    .bind(change_amount)
    .fetch_one(&mut *tx)
    .await?;

    let created_at_ts: chrono::NaiveDateTime = inserted_sale.try_get("created_at")?;
    let created_at = created_at_ts.to_string();

    for item in &line_items {
        sqlx::query(
            "INSERT INTO sale_items (id, sale_id, product_id, product_name, unit_price, quantity, line_total)
             VALUES ($1, $2, $3, $4, $5, $6, $7)"
        )
        .bind(&item.id)
        .bind(&sale_id)
        .bind(&item.product_id)
        .bind(&item.product_name)
        .bind(item.unit_price)
        .bind(item.quantity)
        .bind(item.line_total)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    let sale = SaleDetail {
        id: sale_id.clone(),
        receipt_no: receipt_no.clone(),
        subtotal,
        discount,
        total,
        amount_paid: input.amount_paid,
        change_amount,
        payment_method: "cash".to_string(),
        created_at: created_at.clone(),
        items: line_items.clone(),
    };

    let receipt = ReceiptData {
        shop_name: settings.shop_name,
        shop_address: settings.shop_address,
        shop_contact: settings.shop_contact,
        receipt_no,
        created_at,
        items: line_items,
        subtotal,
        discount,
        total,
        amount_paid: input.amount_paid,
        change_amount,
        payment_method: "cash".to_string(),
    };

    Ok((sale, receipt))
}

async fn load_settings(pool: &DbPool) -> Result<ShopSettings, DbError> {
    let rows = sqlx::query("SELECT key, value FROM settings")
        .fetch_all(pool)
        .await?;

    let mut map = std::collections::HashMap::new();
    for row in rows {
        let key: String = row.try_get("key")?;
        let value: String = row.try_get("value")?;
        map.insert(key, value);
    }

    Ok(ShopSettings::from_map(map))
}

async fn generate_receipt_no(
    pool: &DbPool,
    prefix: &str,
) -> Result<String, DbError> {
    let today = chrono::Local::now().format("%Y%m%d").to_string();
    let pattern = format!("{prefix}-{today}-%");

    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM sales WHERE receipt_no LIKE $1"
    )
    .bind(&pattern)
    .fetch_one(pool)
    .await?;

    Ok(format!("{prefix}-{today}-{:03}", count + 1))
}
