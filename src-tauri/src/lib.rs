pub mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod services;
pub mod backup;

use commands::{
    categories::{list_categories, create_category, delete_category},
    products::{adjust_stock, create_product, delete_product, permanently_delete_product, list_products, update_product, update_stock_qty},
    sales::{checkout, get_sale, list_sales, get_revenue_stats, delete_sale},
    settings::{get_settings, update_settings},
    auth::login,
    users::{list_users, create_user, update_user, update_password, delete_user},
    backup::{create_backup, list_backups, restore_backup, delete_backup, get_backup_status, start_auto_backup, stop_auto_backup, verify_database_connection, auto_restore_on_startup},
};
use tauri::Manager;

#[tauri::command]
async fn close_splashscreen(app_handle: tauri::AppHandle) {
    if let Some(splashscreen) = app_handle.get_webview_window("splashscreen") {
        splashscreen.close().unwrap();
    }
    if let Some(main_window) = app_handle.get_webview_window("main") {
        main_window.maximize().unwrap();
        main_window.show().unwrap();
        main_window.set_focus().unwrap();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async {
                let pool = db::init_pool().await.expect("failed to initialize database");
                app.manage(pool.clone());
                
                // Attempt auto-restore on startup if database is corrupted
                let _ = commands::backup::auto_restore_on_startup(app_handle.clone()).await;
                
                // Start automatic backup scheduler (every 5 minutes)
                let _ = commands::backup::start_auto_backup(app_handle, Some(5)).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_categories,
            create_category,
            delete_category,
            list_products,
            create_product,
            update_product,
            delete_product,
            permanently_delete_product,
            adjust_stock,
            update_stock_qty,
            checkout,
            list_sales,
            get_sale,
            delete_sale,
            get_revenue_stats,
            get_settings,
            update_settings,
            login,
            list_users,
            create_user,
            update_user,
            update_password,
            delete_user,
            close_splashscreen,
            create_backup,
            list_backups,
            restore_backup,
            delete_backup,
            get_backup_status,
            start_auto_backup,
            stop_auto_backup,
            verify_database_connection,
            auto_restore_on_startup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
