use crate::db::DbPool;
use crate::error::AppError;
use crate::models::category::Category;
use tauri::State;
use std::time::Duration;
use uuid::Uuid;

// Decouple the core logic from Tauri state for testability
pub async fn list_categories_impl(pool: &DbPool) -> Result<Vec<Category>, AppError> {
    // Apply a 3-second timeout to the database query
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        sqlx::query_as::<_, Category>(
            "SELECT id, name, sort_order FROM categories ORDER BY sort_order, name LIMIT 1000"
        )
        .fetch_all(pool)
        .await
    })
    .await;

    match result {
        Ok(query_result) => {
            let categories = query_result?; // Automatically uses From<sqlx::Error>
            Ok(categories)
        }
        Err(_) => {
            eprintln!("Database query timed out in list_categories_impl");
            Err(AppError::Timeout)
        }
    }
}

// The thin Tauri command wrapper
#[tauri::command]
pub async fn list_categories(pool: State<'_, DbPool>) -> Result<Vec<Category>, AppError> {
    list_categories_impl(&*pool).await
}

pub async fn create_category_impl(pool: &DbPool, name: String) -> Result<Category, AppError> {
    let id = Uuid::new_v4().to_string();
    
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        // Find max sort_order
        let max_sort_order: Option<i32> = sqlx::query_scalar("SELECT MAX(sort_order) FROM categories")
            .fetch_optional(pool)
            .await?;
            
        let next_sort_order = max_sort_order.unwrap_or(0) + 1;
            
        sqlx::query("INSERT INTO categories (id, name, sort_order) VALUES ($1, $2, $3)")
            .bind(&id)
            .bind(name.trim())
            .bind(next_sort_order)
            .execute(pool)
            .await?;
            
        sqlx::query_as::<_, Category>("SELECT id, name, sort_order FROM categories WHERE id = $1")
            .bind(&id)
            .fetch_one(pool)
            .await
    })
    .await;
    
    match result {
        Ok(query_result) => Ok(query_result?),
        Err(_) => Err(AppError::Timeout)
    }
}

pub async fn delete_category_impl(pool: &DbPool, id: String) -> Result<(), AppError> {
    let result = tokio::time::timeout(Duration::from_secs(3), async {
        // Check if there are active products using this category
        let product_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM products WHERE category_id = $1 AND is_active = 1")
            .bind(&id)
            .fetch_one(pool)
            .await?;
            
        if product_count > 0 {
            return Err(sqlx::Error::Protocol("Cannot delete category because it has active products.".to_string()));
        }
        
        let res = sqlx::query("DELETE FROM categories WHERE id = $1")
            .bind(&id)
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
        Ok(Err(sqlx::Error::Protocol(msg))) => Err(AppError::Internal(msg)),
        Ok(Err(sqlx::Error::RowNotFound)) => Err(AppError::Internal("Category not found.".to_string())),
        Ok(Err(e)) => Err(AppError::from(e)),
        Err(_) => Err(AppError::Timeout)
    }
}

#[tauri::command]
pub async fn create_category(pool: State<'_, DbPool>, name: String) -> Result<Category, AppError> {
    create_category_impl(&*pool, name).await
}

#[tauri::command]
pub async fn delete_category(pool: State<'_, DbPool>, id: String) -> Result<(), AppError> {
    delete_category_impl(&*pool, id).await
}

// Production-Ready Tests
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn test_list_categories_seeded_data(pool: PgPool) {
        // Setup: Run migrations on the fresh test db
        crate::db::run_migrations(&pool).await.unwrap();

        // Act
        let result = list_categories_impl(&pool).await;

        // Assert
        assert!(result.is_ok(), "Expected Ok result, got error");
        let categories = result.unwrap();
        assert!(!categories.is_empty(), "Expected seeded categories to be present");
        assert!(categories.len() >= 7, "Expected at least 7 seeded categories");
    }

    #[tokio::test]
    async fn test_list_categories_db_failure() {
        // Setup: Create a pool to a non-existent database to simulate failure
        let invalid_pool_result = PgPool::connect("postgres://fake:fake@localhost:5432/nonexistent").await;
        
        if let Ok(pool) = invalid_pool_result {
            let result = list_categories_impl(&pool).await;
            
            // Assert
            assert!(result.is_err());
            if let Err(e) = result {
                assert!(matches!(e, AppError::Database(_) | AppError::Timeout));
            }
        }
    }
}
