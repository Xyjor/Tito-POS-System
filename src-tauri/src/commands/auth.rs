use crate::db::DbPool;
use crate::error::AppError;
use crate::models::user::{LoginInput, User};
use bcrypt::verify;
use sqlx::Row;
use tauri::State;

#[tauri::command]
pub async fn login(pool: State<'_, DbPool>, input: LoginInput) -> Result<User, AppError> {
    let row = sqlx::query("SELECT id, username, password_hash, role, can_manage_products FROM users WHERE username = $1")
        .bind(&input.username)
        .fetch_optional(&*pool)
        .await?;

    let row = match row {
        Some(r) => r,
        None => return Err(AppError::Validation("Invalid username or password".to_string())),
    };

    let password_hash: String = row.try_get("password_hash").unwrap_or_default();

    match verify(&input.password, &password_hash) {
        Ok(true) => {
            Ok(User {
                id: row.try_get("id").unwrap_or_default(),
                username: row.try_get("username").unwrap_or_default(),
                role: row.try_get("role").unwrap_or_default(),
                can_manage_products: row.try_get("can_manage_products").unwrap_or(false),
            })
        }
        _ => Err(AppError::Validation("Invalid username or password".to_string())),
    }
}
