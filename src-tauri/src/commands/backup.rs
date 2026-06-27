use crate::backup::{BackupManager, BackupInfo, verify_database};
use crate::db::DbPool;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tokio::time::{interval, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupStatus {
    pub last_backup: Option<DateTime<Utc>>,
    pub last_backup_size: Option<u64>,
    pub backup_count: usize,
    pub is_backup_running: bool,
    pub auto_backup_enabled: bool,
    pub auto_backup_interval_minutes: u64,
}

// Global state for backup scheduler
struct BackupSchedulerState {
    is_running: Mutex<bool>,
    handle: Mutex<Option<tokio::task::JoinHandle<()>>>,
}

impl BackupSchedulerState {
    fn new() -> Self {
        Self {
            is_running: Mutex::new(false),
            handle: Mutex::new(None),
        }
    }
}

static SCHEDULER_STATE: std::sync::LazyLock<BackupSchedulerState> = std::sync::LazyLock::new(|| BackupSchedulerState::new());

#[tauri::command]
pub async fn create_backup(app_handle: AppHandle) -> Result<BackupInfo, String> {
    let manager = BackupManager::new(&app_handle)
        .map_err(|e| e.to_string())?;

    let backup_info = manager.create_backup()
        .await
        .map_err(|e| e.to_string())?;

    // Cleanup old backups after creating new one
    let _ = manager.cleanup_old_backups();

    Ok(backup_info)
}

#[tauri::command]
pub async fn list_backups(app_handle: AppHandle) -> Result<Vec<BackupInfo>, String> {
    let manager = BackupManager::new(&app_handle)
        .map_err(|e| e.to_string())?;

    manager.list_backups()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restore_backup(app_handle: AppHandle, filename: String) -> Result<(), String> {
    let manager = BackupManager::new(&app_handle)
        .map_err(|e| e.to_string())?;

    let backup_path = manager.backup_dir().join(&filename);
    manager.restore_backup(&backup_path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_backup(app_handle: AppHandle, filename: String) -> Result<(), String> {
    let manager = BackupManager::new(&app_handle)
        .map_err(|e| e.to_string())?;

    manager.delete_backup(&filename)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_backup_status(app_handle: AppHandle) -> Result<BackupStatus, String> {
    let manager = BackupManager::new(&app_handle)
        .map_err(|e| e.to_string())?;

    let backups = manager.list_backups()
        .map_err(|e| e.to_string())?;

    let latest = manager.get_latest_backup()
        .map_err(|e| e.to_string())?;

    let last_backup_time = latest.as_ref().map(|b| b.created_at);
    let last_backup_size = latest.as_ref().map(|b| b.size_bytes);

    let is_running = {
        let guard = SCHEDULER_STATE.is_running.lock()
            .map_err(|e| e.to_string())?;
        *guard
    };

    Ok(BackupStatus {
        last_backup: last_backup_time,
        last_backup_size: last_backup_size,
        backup_count: backups.len(),
        is_backup_running: is_running,
        auto_backup_enabled: true,
        auto_backup_interval_minutes: 5,
    })
}

#[tauri::command]
pub async fn start_auto_backup(app_handle: AppHandle, interval_minutes: Option<u64>) -> Result<(), String> {
    let backup_interval = interval_minutes.unwrap_or(5);
    
    // Check if already running
    {
        let mut guard = SCHEDULER_STATE.is_running.lock()
            .map_err(|e| e.to_string())?;
        if *guard {
            return Ok(()); // Already running
        }
        *guard = true;
    }

    let app_handle_clone = app_handle.clone();
    
    let handle = tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(backup_interval * 60));
        
        loop {
            ticker.tick().await;
            
            // Check if still supposed to be running
            {
                if let Ok(guard) = SCHEDULER_STATE.is_running.lock() {
                    if !*guard {
                        break;
                    }
                } else {
                    break; // If we can't get the lock, stop the backup loop
                }
            }

            // Create backup
            if let Ok(manager) = BackupManager::new(&app_handle_clone) {
                if let Err(e) = manager.create_backup().await {
                    eprintln!("Auto backup failed: {}", e);
                } else {
                    let _ = manager.cleanup_old_backups();
                }
            }
        }
    });

    // Store the handle
    let mut handle_guard = SCHEDULER_STATE.handle.lock()
        .map_err(|e| e.to_string())?;
    *handle_guard = Some(handle);

    Ok(())
}

#[tauri::command]
pub async fn stop_auto_backup() -> Result<(), String> {
    let mut guard = SCHEDULER_STATE.is_running.lock()
        .map_err(|e| e.to_string())?;
    *guard = false;

    // Abort the existing task if any
    let mut handle_guard = SCHEDULER_STATE.handle.lock()
        .map_err(|e| e.to_string())?;
    if let Some(handle) = handle_guard.take() {
        handle.abort();
    }

    Ok(())
}

#[tauri::command]
pub async fn verify_database_connection(app_handle: AppHandle) -> Result<bool, String> {
    let pool = app_handle.state::<DbPool>().inner().clone();
    verify_database(&pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn auto_restore_on_startup(app_handle: AppHandle) -> Result<bool, String> {
    let pool = app_handle.state::<DbPool>().inner().clone();
    
    // First, verify if database is accessible
    let db_ok = verify_database(&pool).await
        .map_err(|e| e.to_string())?;

    if db_ok {
        // Database is fine, no need to restore
        return Ok(false);
    }

    // Database is not accessible, try to restore from latest backup
    let manager = BackupManager::new(&app_handle)
        .map_err(|e| e.to_string())?;

    if let Some(backup) = manager.get_latest_backup()
        .map_err(|e| e.to_string())? 
    {
        let backup_path = std::path::PathBuf::from(&backup.path);
        manager.restore_backup(&backup_path).await
            .map_err(|e| e.to_string())?;
        
        Ok(true)
    } else {
        Err("No backup available for restore".to_string())
    }
}
