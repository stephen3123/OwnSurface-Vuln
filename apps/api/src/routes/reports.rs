use axum::{
    extract::State,
    http::{header, StatusCode},
    response::IntoResponse,
    Extension, Json,
};
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::models::report::*;
use crate::services::{db, pdf_export};
use crate::state::AppState;

pub async fn create_report(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<CreateReportRequest>,
) -> AppResult<(StatusCode, Json<Report>)> {
    // Enforce report limit for Free plan
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let max_reports = plan.max_reports();
    if max_reports >= 0 {
        let existing = db::get_user_reports(&state.db, auth_user.id).await?;
        if existing.len() >= max_reports as usize {
            return Err(AppError::Forbidden(format!(
                "Free plan allows {} report(s). Upgrade to Pro for unlimited.",
                max_reports
            )));
        }
    }

    let report = db::create_report(
        &state.db,
        auth_user.id,
        &req.url,
        req.title.as_deref(),
        &req.scan_result,
        req.is_public.unwrap_or(false),
    )
    .await?;

    Ok((StatusCode::CREATED, Json(report)))
}

pub async fn list_reports(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<Vec<Report>>> {
    let reports = db::get_user_reports(&state.db, auth_user.id).await?;
    Ok(Json(reports))
}

pub async fn get_report(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<Report>> {
    let report = db::get_report_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Report not found".into()))?;

    if report.user_id != Some(auth_user.id) && !report.is_public {
        return Err(AppError::Forbidden("Not your report".into()));
    }

    Ok(Json(report))
}

pub async fn get_public_report(
    State(state): State<AppState>,
    axum::extract::Path(slug): axum::extract::Path<String>,
) -> AppResult<Json<Report>> {
    let report = db::get_report_by_slug(&state.db, &slug)
        .await?
        .ok_or_else(|| AppError::NotFound("Report not found".into()))?;

    Ok(Json(report))
}

pub async fn export_pdf(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    if !plan.has_pdf_export() {
        return Err(AppError::Forbidden(
            "PDF export requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let report = db::get_report_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Report not found".into()))?;

    if report.user_id != Some(auth_user.id) {
        return Err(AppError::Forbidden("Not your report".into()));
    }

    let pdf_bytes = pdf_export::generate_pdf(&report)?;

    Ok((
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, "application/pdf"),
            (
                header::CONTENT_DISPOSITION,
                "attachment; filename=\"xrayai-report.pdf\"",
            ),
        ],
        pdf_bytes,
    ))
}
