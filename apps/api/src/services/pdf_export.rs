use printpdf::*;
use std::io::BufWriter;

use crate::errors::AppResult;
use crate::models::report::Report;

const FONT_SIZE_TITLE: f32 = 24.0;
const FONT_SIZE_HEADING: f32 = 14.0;
const FONT_SIZE_BODY: f32 = 11.0;
const FONT_SIZE_SMALL: f32 = 9.0;
const PAGE_WIDTH: f32 = 210.0;
const PAGE_HEIGHT: f32 = 297.0;
const MARGIN_LEFT: f32 = 25.0;
const MARGIN_TOP: f32 = 270.0;
const LINE_HEIGHT: f32 = 5.0;

fn get_str<'a>(val: &'a serde_json::Value, key: &str) -> &'a str {
    val.get(key).and_then(serde_json::Value::as_str).unwrap_or("")
}

fn get_i64(val: &serde_json::Value, key: &str) -> i64 {
    val.get(key).and_then(serde_json::Value::as_i64).unwrap_or(0)
}

/// Generate a real PDF report from scan data.
pub fn generate_pdf(report: &Report) -> AppResult<Vec<u8>> {
    let title = report.title.as_deref().unwrap_or("OwnSurface Security Report");
    let (doc, page1, layer1) = PdfDocument::new(title, Mm(PAGE_WIDTH), Mm(PAGE_HEIGHT), "Content");
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).unwrap();
    let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).unwrap();

    let layer = doc.get_page(page1).get_layer(layer1);
    let mut y = MARGIN_TOP;
    let result = &report.scan_result;

    // Title
    layer.use_text("OwnSurface", FONT_SIZE_TITLE, Mm(MARGIN_LEFT), Mm(y), &font_bold);
    y -= 8.0;
    layer.use_text("Security Intelligence Report", FONT_SIZE_HEADING, Mm(MARGIN_LEFT), Mm(y), &font);
    y -= 10.0;

    // Metadata
    layer.use_text(&format!("URL: {}", report.url), FONT_SIZE_BODY, Mm(MARGIN_LEFT), Mm(y), &font);
    y -= LINE_HEIGHT;
    layer.use_text(
        &format!("Generated: {}", report.created_at.format("%Y-%m-%d %H:%M UTC")),
        FONT_SIZE_BODY, Mm(MARGIN_LEFT), Mm(y), &font,
    );
    y -= 8.0;

    // Separator
    let line = Line {
        points: vec![
            (Point::new(Mm(MARGIN_LEFT), Mm(y)), false),
            (Point::new(Mm(PAGE_WIDTH - MARGIN_LEFT), Mm(y)), false),
        ],
        is_closed: false,
    };
    layer.add_line(line);
    y -= 8.0;

    // Security Score
    if let Some(security) = result.get("security") {
        let score = get_i64(security, "score");
        let grade = get_str(security, "grade");
        layer.use_text("Security Assessment", FONT_SIZE_HEADING, Mm(MARGIN_LEFT), Mm(y), &font_bold);
        y -= LINE_HEIGHT + 1.0;
        layer.use_text(&format!("Score: {}/100  Grade: {}", score, grade), FONT_SIZE_BODY, Mm(MARGIN_LEFT + 5.0), Mm(y), &font);
        y -= LINE_HEIGHT;

        if let Some(ssl) = security.get("ssl") {
            let valid = ssl.get("valid").and_then(serde_json::Value::as_bool).unwrap_or(false);
            let protocol = get_str(ssl, "protocol");
            layer.use_text(
                &format!("SSL: {} (valid: {})", protocol, if valid { "yes" } else { "no" }),
                FONT_SIZE_BODY, Mm(MARGIN_LEFT + 5.0), Mm(y), &font,
            );
            y -= LINE_HEIGHT;
        }

        if let Some(issues) = security.get("issues").and_then(serde_json::Value::as_array) {
            if !issues.is_empty() {
                layer.use_text(&format!("Issues: {}", issues.len()), FONT_SIZE_BODY, Mm(MARGIN_LEFT + 5.0), Mm(y), &font);
                y -= LINE_HEIGHT;
                for issue in issues.iter().take(8) {
                    if y < 30.0 { break; }
                    let text: String = issue.as_str().unwrap_or("").chars().take(90).collect();
                    layer.use_text(&format!("  - {}", text), FONT_SIZE_SMALL, Mm(MARGIN_LEFT + 8.0), Mm(y), &font);
                    y -= LINE_HEIGHT - 1.0;
                }
            }
        }
        y -= 5.0;
    }

    // Tech Stack
    if let Some(tech) = result.get("tech_stack").and_then(serde_json::Value::as_array) {
        if !tech.is_empty() && y > 50.0 {
            layer.use_text("Technology Stack", FONT_SIZE_HEADING, Mm(MARGIN_LEFT), Mm(y), &font_bold);
            y -= LINE_HEIGHT + 1.0;
            for t in tech.iter().take(12) {
                if y < 30.0 { break; }
                let name = get_str(t, "name");
                let category = get_str(t, "category");
                layer.use_text(&format!("  {} ({})", name, category), FONT_SIZE_BODY, Mm(MARGIN_LEFT + 5.0), Mm(y), &font);
                y -= LINE_HEIGHT - 1.0;
            }
            y -= 5.0;
        }
    }

    // New modules with issues
    let modules = [
        ("firebase_audit", "Firebase Audit"),
        ("supabase_audit", "Supabase Audit"),
        ("vibe_code", "AI Platform Detection"),
        ("env_leaks", "Environment Leaks"),
        ("llm_keys", "LLM Key Exposure"),
        ("csp_bypass", "CSP Analysis"),
        ("prototype_pollution", "Prototype Pollution"),
        ("api_auth", "API Authentication"),
        ("cors_deep", "CORS Analysis"),
        ("dependency_audit", "Dependency Audit"),
    ];

    for (key, label) in &modules {
        if y < 40.0 { break; }
        if let Some(module) = result.get(*key) {
            if let Some(issues) = module.get("issues").and_then(serde_json::Value::as_array) {
                if !issues.is_empty() {
                    layer.use_text(*label, FONT_SIZE_HEADING, Mm(MARGIN_LEFT), Mm(y), &font_bold);
                    y -= LINE_HEIGHT + 1.0;
                    for issue in issues.iter().take(3) {
                        if y < 30.0 { break; }
                        let text: String = issue.as_str().unwrap_or("").chars().take(90).collect();
                        layer.use_text(&format!("  - {}", text), FONT_SIZE_SMALL, Mm(MARGIN_LEFT + 5.0), Mm(y), &font);
                        y -= LINE_HEIGHT - 1.0;
                    }
                    y -= 3.0;
                }
            }
        }
    }

    // AI Summary
    if let Some(summary) = result.get("ai_summary").and_then(serde_json::Value::as_str) {
        if y > 50.0 && !summary.is_empty() {
            layer.use_text("AI Intelligence Summary", FONT_SIZE_HEADING, Mm(MARGIN_LEFT), Mm(y), &font_bold);
            y -= LINE_HEIGHT + 1.0;
            let chars: Vec<char> = summary.chars().collect();
            for chunk in chars.chunks(100) {
                if y < 30.0 { break; }
                let text: String = chunk.iter().collect();
                layer.use_text(&text, FONT_SIZE_SMALL, Mm(MARGIN_LEFT + 5.0), Mm(y), &font);
                y -= LINE_HEIGHT - 1.0;
            }
        }
    }

    // Footer
    layer.use_text(
        "Generated by OwnSurface — ownsurface.com",
        FONT_SIZE_SMALL, Mm(MARGIN_LEFT), Mm(15.0), &font,
    );

    let mut buf = BufWriter::new(Vec::new());
    doc.save(&mut buf).map_err(|e| {
        crate::errors::AppError::Internal(format!("PDF generation failed: {}", e))
    })?;

    Ok(buf.into_inner().map_err(|e| {
        crate::errors::AppError::Internal(format!("PDF buffer error: {}", e))
    })?)
}
