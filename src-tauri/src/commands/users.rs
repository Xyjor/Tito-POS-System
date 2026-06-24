use crate::db::DbPool;
use crate::error::AppError;
use crate::models::user::User;
use bcrypt::{hash, DEFAULT_COST};
use sqlx::Row;
use tauri::State;
use uuid::Uuid;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CreateUserInput {
    pub username: String,
    pub password_hash: String, // will be plain password from frontend, we hash it here
    pub role: String,
    pub can_manage_products: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserInput {
    pub id: String,
    pub username: String,
    pub role: String,
    pub can_manage_products: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePasswordInput {
    pub id: String,
    pub new_password: String,
}

#[tauri::command]
pub async fn list_users(pool: State<'_, DbPool>) -> Result<Vec<User>, AppError> {
    let rows = sqlx::query("SELECT id, username, role, can_manage_products FROM users ORDER BY created_at ASC")
        .fetch_all(&*pool)
        .await?;

    let users = rows
        .into_iter()
        .map(|row| User {
            id: row.try_get("id").unwrap_or_default(),
            username: row.try_get("username").unwrap_or_default(),
            role: row.try_get("role").unwrap_or_default(),
            can_manage_products: row.try_get("can_manage_products").unwrap_or(false),
        })
        .collect();

    Ok(users)
}

#[tauri::command]
pub async fn create_user(pool: State<'_, DbPool>, input: CreateUserInput) -> Result<User, AppError> {
    let id = Uuid::new_v4().to_string();
    let hashed = hash(&input.password_hash, DEFAULT_COST).map_err(|e| AppError::Internal(e.to_string()))?;

    sqlx::query("INSERT INTO users (id, username, password_hash, role, can_manage_products) VALUES ($1, $2, $3, $4, $5)")
        .bind(&id)
        .bind(&input.username)
        .bind(&hashed)
        .bind(&input.role)
        .bind(input.can_manage_products)
        .execute(&*pool)
        .await?;

    Ok(User {
        id,
        username: input.username,
        role: input.role,
        can_manage_products: input.can_manage_products,
    })
}

#[tauri::command]
pub async fn update_user(pool: State<'_, DbPool>, input: UpdateUserInput) -> Result<User, AppError> {
    sqlx::query("UPDATE users SET username = $1, role = $2, can_manage_products = $3 WHERE id = $4")
        .bind(&input.username)
        .bind(&input.role)
        .bind(input.can_manage_products)
        .bind(&input.id)
        .execute(&*pool)
        .await?;

    Ok(User {
        id: input.id,
        username: input.username,
        role: input.role,
        can_manage_products: input.can_manage_products,
    })
}

#[tauri::command]
pub async fn update_password(pool: State<'_, DbPool>, input: UpdatePasswordInput) -> Result<(), AppError> {
    let hashed = hash(&input.new_password, DEFAULT_COST).map_err(|e| AppError::Internal(e.to_string()))?;
    
    sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
        .bind(&hashed)
        .bind(&input.id)
        .execute(&*pool)
        .await?;
        
    Ok(())
}

#[tauri::command]
pub async fn delete_user(pool: State<'_, DbPool>, id: String) -> Result<(), AppError> {
    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(&id)
        .execute(&*pool)
        .await?;
        
    Ok(())
}
