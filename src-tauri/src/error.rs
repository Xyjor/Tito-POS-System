use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),
    #[error("Operation timed out")]
    Timeout,
    #[error("Internal error: {0}")]
    Internal(String),
    #[error("Validation error: {0}")]
    Validation(String),
}

// Serialize the error as a string message for the frontend
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// Convert sqlx errors into our custom AppError
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        eprintln!("Database error: {:?}", err);
        AppError::Database("An error occurred while communicating with the database.".to_string())
    }
}

// Convert our DbError into AppError
impl From<crate::db::DbError> for AppError {
    fn from(err: crate::db::DbError) -> Self {
        eprintln!("DbError: {:?}", err);
        AppError::Database("An error occurred in the database layer.".to_string())
    }
}
