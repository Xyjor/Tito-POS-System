pub mod migrations;

use sqlx::postgres::{PgPoolOptions, PgPool};
use thiserror::Error;

const SCHEMA_SQL: &str = include_str!("migrations/001_schema.sql");
const PERMISSIONS_SQL: &str = include_str!("migrations/002_add_permissions.sql");
const SEED_DATA_SQL: &str = include_str!("migrations/seed_data.sql");
const CATEGORY_UNIQUE_SQL: &str = include_str!("migrations/003_add_category_name_unique.sql");
const REMOVE_SAMPLE_DATA_SQL: &str = include_str!("migrations/004_remove_sample_data.sql");

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
    sqlx::raw_sql(SCHEMA_SQL).execute(pool).await?;
    sqlx::raw_sql(PERMISSIONS_SQL).execute(pool).await?;

    // Try to add the unique constraint - handle gracefully if it fails
    match sqlx::raw_sql(CATEGORY_UNIQUE_SQL).execute(pool).await {
        Ok(_) => {},
        Err(e) => {
            eprintln!("Warning: Failed to add category unique constraint (may already exist): {:?}", e);
        }
    }

    // Clean up sample data from previous versions
    if let Err(e) = sqlx::raw_sql(REMOVE_SAMPLE_DATA_SQL).execute(pool).await {
        eprintln!("Warning: Failed to execute remove_sample_data migration: {:?}", e);
    }

    // Only seed data on fresh installation (when no users exist)
    let user_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await?;

    if user_count == 0 {
        eprintln!("Fresh installation detected, seeding default data...");
        sqlx::raw_sql(SEED_DATA_SQL).execute(pool).await?;
    } else {
        eprintln!("Existing installation detected, skipping seed data");
    }

    Ok(())
}

pub fn round_money(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}
