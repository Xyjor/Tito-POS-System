pub mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod services;

use commands::{
    categories::{list_categories, create_category, delete_category},
    products::{adjust_stock, create_product, delete_product, list_products, update_product, update_stock_qty},
    sales::{checkout, get_sale, list_sales, get_revenue_stats},
    settings::{get_settings, update_settings},
    auth::login,
    users::{list_users, create_user, update_user, update_password, delete_user},
};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            tauri::async_runtime::block_on(async {
                let pool = db::init_pool().await.expect("failed to initialize database");
                app.manage(pool);
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
            adjust_stock,
            update_stock_qty,
            checkout,
            list_sales,
            get_sale,
            get_revenue_stats,
            get_settings,
            update_settings,
            login,
            list_users,
            create_user,
            update_user,
            update_password,
            delete_user,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
