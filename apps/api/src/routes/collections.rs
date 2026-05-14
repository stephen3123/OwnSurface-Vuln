use axum::{extract::State, http::StatusCode, Extension, Json};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

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
    pub url: Option<String>,
    pub note: Option<String>,
}

pub async fn create_collection(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<CreateCollectionRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    if req.title.trim().is_empty() {
        return Err(AppError::BadRequest("Title is required".into()));
    }

    // Enforce collection limit per plan
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let max_collections = plan.max_collections();
    if max_collections >= 0 {
        let existing = db::get_collections(&state.db, auth_user.id).await?;
        if existing.len() >= max_collections as usize {
            return Err(AppError::Forbidden(format!(
                "Free plan allows {} collection(s). Upgrade to Pro for unlimited.",
                max_collections
            )));
        }
    }

    let collection = db::create_collection(
        &state.db,
        auth_user.id,
        &req.title,
        req.description.as_deref(),
        req.is_public.unwrap_or(false),
    )
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "id": collection.id,
            "title": collection.title,
            "description": collection.description,
            "is_public": collection.is_public,
            "created_at": collection.created_at,
        })),
    ))
}

pub async fn list_collections(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let collections = db::get_collections(&state.db, auth_user.id).await?;

    Ok(Json(json!({
        "collections": collections,
        "count": collections.len(),
    })))
}

pub async fn get_collection(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let collection = db::get_collection_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Collection not found".into()))?;

    // Allow access if owner or if collection is public
    if collection.user_id != auth_user.id && !collection.is_public {
        return Err(AppError::Forbidden("Not your collection".into()));
    }

    let items = db::get_collection_items(&state.db, id).await?;

    Ok(Json(json!({
        "collection": collection,
        "items": items,
        "item_count": items.len(),
    })))
}

pub async fn update_collection(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
    Json(req): Json<UpdateCollectionRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let existing = db::get_collection_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Collection not found".into()))?;

    if existing.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your collection".into()));
    }

    let updated = db::update_collection(
        &state.db,
        id,
        req.title.as_deref(),
        req.description.as_deref(),
        req.is_public,
    )
    .await?;

    Ok(Json(json!({
        "id": updated.id,
        "title": updated.title,
        "description": updated.description,
        "is_public": updated.is_public,
        "updated_at": updated.updated_at,
    })))
}

pub async fn delete_collection(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<StatusCode> {
    let existing = db::get_collection_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Collection not found".into()))?;

    if existing.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your collection".into()));
    }

    db::delete_collection(&state.db, id, auth_user.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn add_collection_item(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
    Json(req): Json<AddCollectionItemRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    if req.scan_id.is_none() && req.url.is_none() {
        return Err(AppError::BadRequest(
            "Either scan_id or url is required".into(),
        ));
    }

    let existing = db::get_collection_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Collection not found".into()))?;

    if existing.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your collection".into()));
    }

    let url = req.url.as_deref().unwrap_or("");
    if url.is_empty() && req.scan_id.is_none() {
        return Err(AppError::BadRequest("A valid URL or scan_id is required".into()));
    }
    let item =
        db::add_collection_item(&state.db, id, req.scan_id, url, req.note.as_deref()).await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "id": item.id,
            "collection_id": item.collection_id,
            "scan_id": item.scan_id,
            "url": item.url,
            "note": item.note,
            "created_at": item.created_at,
        })),
    ))
}

pub async fn remove_collection_item(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path((id, item_id)): axum::extract::Path<(Uuid, Uuid)>,
) -> AppResult<StatusCode> {
    let existing = db::get_collection_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Collection not found".into()))?;

    if existing.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your collection".into()));
    }

    db::remove_collection_item(&state.db, id, item_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
