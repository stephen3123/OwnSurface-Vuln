use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// --- Database Models ---

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Collection {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub is_public: bool,
    pub likes_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CollectionItem {
    pub id: Uuid,
    pub collection_id: Uuid,
    pub scan_id: Option<Uuid>,
    pub url: String,
    pub note: Option<String>,
    pub position: i32,
    pub created_at: DateTime<Utc>,
}

// --- Request Structs ---

#[derive(Debug, Deserialize)]
pub struct CreateCollectionRequest {
    pub title: String,
    pub description: Option<String>,
    pub is_public: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCollectionRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub is_public: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct AddCollectionItemRequest {
    pub scan_id: Option<Uuid>,
    pub url: String,
    pub note: Option<String>,
    pub position: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct ReorderCollectionItemsRequest {
    pub item_ids: Vec<Uuid>,
}

// --- Response Structs ---

#[derive(Debug, Serialize)]
pub struct CollectionResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub username: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub is_public: bool,
    pub likes_count: i32,
    pub item_count: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct CollectionDetailResponse {
    pub collection: CollectionResponse,
    pub items: Vec<CollectionItemResponse>,
}

#[derive(Debug, Serialize)]
pub struct CollectionItemResponse {
    pub id: Uuid,
    pub scan_id: Option<Uuid>,
    pub url: String,
    pub note: Option<String>,
    pub position: i32,
    pub created_at: DateTime<Utc>,
}

impl From<CollectionItem> for CollectionItemResponse {
    fn from(item: CollectionItem) -> Self {
        Self {
            id: item.id,
            scan_id: item.scan_id,
            url: item.url,
            note: item.note,
            position: item.position,
            created_at: item.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct CollectionListResponse {
    pub items: Vec<CollectionResponse>,
    pub total: i64,
}
