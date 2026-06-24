use crate::db::DbError;
use crate::models::sale::{ReceiptData, SaleDetail, SaleItem};
use crate::models::settings::ShopSettings;
use chrono::Local;
use rusqlite::{params, Connection};

pub fn load_settings(conn: &Connection) -> Result<ShopSettings, DbError> {
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;

    let mut map = std::collections::HashMap::new();
    for row in rows {
        let (key, value) = row?;
        map.insert(key, value);
    }

    Ok(ShopSettings::from_map(map))
}

pub fn generate_receipt_no(conn: &Connection, prefix: &str) -> Result<String, DbError> {
    let today = Local::now().format("%Y%m%d").to_string();
    let pattern = format!("{prefix}-{today}-%");

    let max_seq: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(CAST(substr(receipt_no, -3) AS INTEGER)), 0)
             FROM sales
             WHERE receipt_no LIKE ?1",
            params![pattern],
            |row| row.get(0),
        )
        .unwrap_or(0);

    Ok(format!("{prefix}-{today}-{:03}", max_seq + 1))
}

pub fn build_receipt_data(
    settings: &ShopSettings,
    sale: &SaleDetail,
    items: &[SaleItem],
) -> ReceiptData {
    ReceiptData {
        shop_name: settings.shop_name.clone(),
        shop_address: settings.shop_address.clone(),
        shop_contact: settings.shop_contact.clone(),
        receipt_no: sale.receipt_no.clone(),
        created_at: sale.created_at.clone(),
        items: items.to_vec(),
        subtotal: sale.subtotal,
        discount: sale.discount,
        total: sale.total,
        amount_paid: sale.amount_paid,
        change_amount: sale.change_amount,
        payment_method: sale.payment_method.clone(),
    }
}
