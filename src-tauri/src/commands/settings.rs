use crate::db::DbPool;
use crate::error::AppError;
use crate::models::settings::{ShopSettings, UpdateSettingsInput};
use sqlx::Row;
use std::time::Duration;
use tauri::State;

// --- IMPLEMENTATIONS ---

pub async fn get_settings_impl(pool: &DbPool) -> Result<ShopSettings, AppError> {
    load_settings(pool).await
}

pub async fn update_settings_impl(
    pool: &DbPool,
    input: UpdateSettingsInput,
) -> Result<ShopSettings, AppError> {
    if input.shop_name.trim().is_empty() {
        return Err(AppError::Internal("Shop name is required.".to_string()));
    }
    if input.receipt_prefix.trim().is_empty() {
        return Err(AppError::Internal("Receipt prefix is required.".to_string()));
    }

    let pairs = [
        ("shop_name", input.shop_name.trim()),
        ("shop_address", input.shop_address.trim()),
        ("shop_contact", input.shop_contact.trim()),
        ("receipt_prefix", input.receipt_prefix.trim()),
    ];

    let result = tokio::time::timeout(Duration::from_secs(3), async {
        for (key, value) in pairs {
            sqlx::query(
                "INSERT INTO settings (key, value) VALUES ($1, $2)
                 ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value",
            )
            .bind(key)
            .bind(value)
            .execute(pool)
            .await?;
        }
        Ok::<_, sqlx::Error>(())
    })
    .await;

    match result {
        Ok(res) => {
            res.map_err(AppError::from)?;
            load_settings(pool).await
        }
        Err(_) => Err(AppError::Timeout),
    }
}

async fn load_settings(pool: &DbPool) -> Result<ShopSettings, AppError> {
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        let rows = sqlx::query("SELECT key, value FROM settings")
            .fetch_all(pool)
            .await?;

        let mut map = std::collections::HashMap::new();
        for row in rows {
            let key: String = row.try_get("key")?;
            let value: String = row.try_get("value")?;
            map.insert(key, value);
        }
        Ok::<_, sqlx::Error>(map)
    })
    .await;

    match result {
        Ok(query_res) => {
            let map = query_res.map_err(AppError::from)?;
            Ok(ShopSettings::from_map(map))
        }
        Err(_) => Err(AppError::Timeout),
    }
}

// --- TAURI COMMANDS ---

#[tauri::command]
pub async fn get_settings(pool: State<'_, DbPool>) -> Result<ShopSettings, AppError> {
    get_settings_impl(&*pool).await
}

#[tauri::command]
pub async fn update_settings(
    pool: State<'_, DbPool>,
    input: UpdateSettingsInput,
) -> Result<ShopSettings, AppError> {
    update_settings_impl(&*pool, input).await
}

// --- TESTS ---

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn test_get_settings_seeded(pool: PgPool) {
        crate::db::run_migrations(&pool).await.unwrap();

        let result = get_settings_impl(&pool).await;
        assert!(result.is_ok());
        let settings = result.unwrap();
        assert_eq!(settings.shop_name, "Shop POS");
    }

    #[sqlx::test]
    async fn test_update_settings(pool: PgPool) {
        crate::db::run_migrations(&pool).await.unwrap();

        let input = UpdateSettingsInput {
            shop_name: "New Shop".to_string(),
            shop_address: "New Address".to_string(),
            shop_contact: "123".to_string(),
            receipt_prefix: "NEW".to_string(),
        };

        let result = update_settings_impl(&pool, input).await;
        assert!(result.is_ok());
        let settings = result.unwrap();
        assert_eq!(settings.shop_name, "New Shop");
        assert_eq!(settings.receipt_prefix, "NEW");
    }
}
