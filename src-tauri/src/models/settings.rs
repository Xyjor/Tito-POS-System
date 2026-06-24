use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShopSettings {
    pub shop_name: String,
    pub shop_address: String,
    pub shop_contact: String,
    pub receipt_prefix: String,
}

impl Default for ShopSettings {
    fn default() -> Self {
        Self {
            shop_name: "Shop POS".to_string(),
            shop_address: String::new(),
            shop_contact: String::new(),
            receipt_prefix: "RCP".to_string(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsInput {
    pub shop_name: String,
    pub shop_address: String,
    pub shop_contact: String,
    pub receipt_prefix: String,
}

impl ShopSettings {
    pub fn from_map(map: HashMap<String, String>) -> Self {
        Self {
            shop_name: map
                .get("shop_name")
                .cloned()
                .unwrap_or_else(|| "Shop POS".to_string()),
            shop_address: map.get("shop_address").cloned().unwrap_or_default(),
            shop_contact: map.get("shop_contact").cloned().unwrap_or_default(),
            receipt_prefix: map
                .get("receipt_prefix")
                .cloned()
                .unwrap_or_else(|| "RCP".to_string()),
        }
    }
}
