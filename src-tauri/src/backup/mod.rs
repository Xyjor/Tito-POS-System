use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{AppHandle, Manager};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum BackupError {
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("env error: {0}")]
    Env(#[from] dotenvy::Error),
    #[error("backup command failed: {0}")]
    BackupFailed(String),
    #[error("restore command failed: {0}")]
    RestoreFailed(String),
    #[error("no backups available")]
    NoBackupsAvailable,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub filename: String,
    pub created_at: DateTime<Utc>,
    pub size_bytes: u64,
    pub path: String,
}

pub struct BackupManager {
    backup_dir: PathBuf,
    database_url: String,
    max_backups: usize,
}

impl BackupManager {
    pub fn new(app_handle: &AppHandle) -> Result<Self, BackupError> {
        let backup_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| BackupError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?
            .join("backups");

        fs::create_dir_all(&backup_dir)?;

        dotenvy::dotenv().ok();
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/shop_pos".to_string());

        Ok(Self {
            backup_dir,
            database_url,
            max_backups: 10, // Keep last 10 backups
        })
    }

    pub fn backup_dir(&self) -> &Path {
        &self.backup_dir
    }

    /// Create a database backup using pg_dump
    pub async fn create_backup(&self) -> Result<BackupInfo, BackupError> {
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let filename = format!("backup_{}.dump", timestamp);
        let backup_path = self.backup_dir.join(&filename);

        // Parse database URL to extract connection details
        let url = &self.database_url;
        
        // Extract components from DATABASE_URL
        // Format: postgres://user:password@host:port/database
        let url_parts: Vec<&str> = url.split("://").collect();
        if url_parts.len() != 2 {
            return Err(BackupError::BackupFailed("Invalid DATABASE_URL format".to_string()));
        }

        let auth_part: Vec<&str> = url_parts[1].split('@').collect();
        if auth_part.len() != 2 {
            return Err(BackupError::BackupFailed("Invalid DATABASE_URL format".to_string()));
        }

        let user_pass: Vec<&str> = auth_part[0].split(':').collect();
        let host_db: Vec<&str> = auth_part[1].split('/').collect();
        
        let user = user_pass.get(0).unwrap_or(&"postgres");
        let password = user_pass.get(1).unwrap_or(&"postgres");
        let host_port: Vec<&str> = host_db[0].split(':').collect();
        let host = host_port.get(0).unwrap_or(&"localhost");
        let port = host_port.get(1).unwrap_or(&"5432");
        let database = host_db.get(1).unwrap_or(&"shop_pos");

        // Set PGPASSWORD environment variable for pg_dump
        std::env::set_var("PGPASSWORD", password);

        let output = Command::new("pg_dump")
            .args([
                "-h", host,
                "-p", port,
                "-U", user,
                "-d", database,
                "-F", "c",  // Custom format
                "-f", backup_path.to_str().unwrap(),
                "-v",      // Verbose
            ])
            .output();

        // Clear password from environment
        std::env::remove_var("PGPASSWORD");

        match output {
            Ok(result) => {
                if result.status.success() {
                    let metadata = fs::metadata(&backup_path)?;
                    Ok(BackupInfo {
                        filename: filename.clone(),
                        created_at: Utc::now(),
                        size_bytes: metadata.len(),
                        path: backup_path.to_string_lossy().to_string(),
                    })
                } else {
                    let error_msg = String::from_utf8_lossy(&result.stderr).to_string();
                    Err(BackupError::BackupFailed(error_msg))
                }
            }
            Err(e) => Err(BackupError::BackupFailed(e.to_string())),
        }
    }

    /// Restore database from a backup file
    pub async fn restore_backup(&self, backup_path: &Path) -> Result<(), BackupError> {
        if !backup_path.exists() {
            return Err(BackupError::RestoreFailed("Backup file not found".to_string()));
        }

        let url = &self.database_url;
        
        // Extract components from DATABASE_URL
        let url_parts: Vec<&str> = url.split("://").collect();
        let auth_part: Vec<&str> = url_parts[1].split('@').collect();
        let user_pass: Vec<&str> = auth_part[0].split(':').collect();
        let host_db: Vec<&str> = auth_part[1].split('/').collect();
        let host_port: Vec<&str> = host_db[0].split(':').collect();
        
        let user = user_pass.get(0).unwrap_or(&"postgres");
        let password = user_pass.get(1).unwrap_or(&"postgres");
        let host = host_port.get(0).unwrap_or(&"localhost");
        let port = host_port.get(1).unwrap_or(&"5432");
        let database = host_db.get(1).unwrap_or(&"shop_pos");

        // Set PGPASSWORD environment variable for pg_restore
        std::env::set_var("PGPASSWORD", password);

        let output = Command::new("pg_restore")
            .args([
                "-h", host,
                "-p", port,
                "-U", user,
                "-d", database,
                "-c",      // Clean (drop) existing database objects
                "-v",      // Verbose
                backup_path.to_str().unwrap(),
            ])
            .output();

        // Clear password from environment
        std::env::remove_var("PGPASSWORD");

        match output {
            Ok(result) => {
                if result.status.success() {
                    Ok(())
                } else {
                    let error_msg = String::from_utf8_lossy(&result.stderr).to_string();
                    Err(BackupError::RestoreFailed(error_msg))
                }
            }
            Err(e) => Err(BackupError::RestoreFailed(e.to_string())),
        }
    }

    /// List all available backups
    pub fn list_backups(&self) -> Result<Vec<BackupInfo>, BackupError> {
        let mut backups = Vec::new();

        for entry in fs::read_dir(&self.backup_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().map_or(false, |ext| ext == "dump") {
                let metadata = fs::metadata(&path)?;
                let filename = path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                // Extract timestamp from filename
                let created_at = if let Some(ts_str) = filename.strip_prefix("backup_").and_then(|s| s.strip_suffix(".dump")) {
                    DateTime::parse_from_rfc3339(&format!("{}-{}-{}T{}:{}:{}Z", 
                        &ts_str[0..4], &ts_str[4..6], &ts_str[6..8],
                        &ts_str[9..11], &ts_str[11..13], &ts_str[13..15]
                    ))
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now())
                } else {
                    Utc::now()
                };

                backups.push(BackupInfo {
                    filename,
                    created_at,
                    size_bytes: metadata.len(),
                    path: path.to_string_lossy().to_string(),
                });
            }
        }

        // Sort by creation time (newest first)
        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(backups)
    }

    /// Get the most recent backup
    pub fn get_latest_backup(&self) -> Result<Option<BackupInfo>, BackupError> {
        let backups = self.list_backups()?;
        Ok(backups.into_iter().next())
    }

    /// Delete old backups to maintain max_backups limit
    pub fn cleanup_old_backups(&self) -> Result<usize, BackupError> {
        let mut backups = self.list_backups()?;
        let original_count = backups.len();

        if backups.len() > self.max_backups {
            // Keep only the newest max_backups
            let to_delete = backups.split_off(self.max_backups);
            
            for backup in to_delete {
                fs::remove_file(&backup.path)?;
            }
        }

        Ok(original_count.saturating_sub(self.max_backups))
    }

    /// Delete a specific backup
    pub fn delete_backup(&self, filename: &str) -> Result<(), BackupError> {
        let backup_path = self.backup_dir.join(filename);
        fs::remove_file(&backup_path)?;
        Ok(())
    }
}

/// Verify database connection and integrity
pub async fn verify_database(pool: &PgPool) -> Result<bool, BackupError> {
    sqlx::query("SELECT 1")
        .fetch_one(pool)
        .await?;
    Ok(true)
}
