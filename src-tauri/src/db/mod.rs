pub mod migrations;

use sqlx::postgres::{PgPoolOptions, PgPool};
use thiserror::Error;

const INIT_SQL: &str = include_str!("migrations/001_init.sql");
const PERMISSIONS_SQL: &str = include_str!("migrations/002_add_permissions.sql");

#[derive(Debug, Error)]
pub enum DbError {
    #[error("database error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("env error: {0}")]
    Env(#[from] dotenvy::Error),
}

pub type DbPool = PgPool;

pub async fn init_pool() -> Result<DbPool, DbError> {
    dotenvy::dotenv().ok();
    
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/shop_pos".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    run_migrations(&pool).await?;
    Ok(pool)
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), DbError> {
    // raw_sql() sends SQL as a simple query (not a prepared statement),
    // which allows multiple commands separated by semicolons — required for
    // running our entire init script in one call.
    sqlx::raw_sql(INIT_SQL).execute(pool).await?;
    sqlx::raw_sql(PERMISSIONS_SQL).execute(pool).await?;
    Ok(())
}

pub fn round_money(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}
