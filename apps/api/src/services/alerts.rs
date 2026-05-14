use serde_json::Value;

use crate::errors::AppResult;

#[derive(Debug, Clone, serde::Serialize)]
pub struct Change {
    pub change_type: String,
    pub description: String,
    pub old_value: Option<Value>,
    pub new_value: Option<Value>,
}

pub fn detect_changes(old_result: &Value, new_result: &Value) -> Vec<Change> {
    let mut changes = Vec::new();

    // Compare tech stacks
    if let (Some(old_tech), Some(new_tech)) = (
        old_result["tech_stack"].as_array(),
        new_result["tech_stack"].as_array(),
    ) {
        let old_names: Vec<&str> = old_tech.iter().filter_map(|t| t["name"].as_str()).collect();
        let new_names: Vec<&str> = new_tech.iter().filter_map(|t| t["name"].as_str()).collect();

        for name in &new_names {
            if !old_names.contains(name) {
                changes.push(Change {
                    change_type: "tech_added".into(),
                    description: format!("Technology added: {}", name),
                    old_value: None,
                    new_value: Some(Value::String(name.to_string())),
                });
            }
        }

        for name in &old_names {
            if !new_names.contains(name) {
                changes.push(Change {
                    change_type: "tech_removed".into(),
                    description: format!("Technology removed: {}", name),
                    old_value: Some(Value::String(name.to_string())),
                    new_value: None,
                });
            }
        }
    }

    // Compare security scores
    if let (Some(old_score), Some(new_score)) = (
        old_result["security"]["score"].as_u64(),
        new_result["security"]["score"].as_u64(),
    ) {
        if old_score != new_score {
            let change_type = if new_score > old_score {
                "security_improved"
            } else {
                "security_degraded"
            };
            changes.push(Change {
                change_type: change_type.into(),
                description: format!("Security score changed from {} to {}", old_score, new_score),
                old_value: Some(Value::Number(old_score.into())),
                new_value: Some(Value::Number(new_score.into())),
            });
        }
    }

    // Compare business signals
    let old_pricing = old_result["business_signals"]["has_pricing"].as_bool();
    let new_pricing = new_result["business_signals"]["has_pricing"].as_bool();
    if old_pricing != new_pricing {
        changes.push(Change {
            change_type: "business_signal".into(),
            description: format!(
                "Pricing page {}",
                if new_pricing == Some(true) {
                    "added"
                } else {
                    "removed"
                }
            ),
            old_value: old_pricing.map(Value::Bool),
            new_value: new_pricing.map(Value::Bool),
        });
    }

    let old_careers = old_result["business_signals"]["has_careers"].as_bool();
    let new_careers = new_result["business_signals"]["has_careers"].as_bool();
    if old_careers != new_careers {
        changes.push(Change {
            change_type: "business_signal".into(),
            description: format!(
                "Careers page {}",
                if new_careers == Some(true) {
                    "added"
                } else {
                    "removed"
                }
            ),
            old_value: old_careers.map(Value::Bool),
            new_value: new_careers.map(Value::Bool),
        });
    }

    // Compare security grade
    if let (Some(old_grade), Some(new_grade)) = (
        old_result["security"]["grade"].as_str(),
        new_result["security"]["grade"].as_str(),
    ) {
        if old_grade != new_grade {
            changes.push(Change {
                change_type: "security_grade_changed".into(),
                description: format!("Security grade changed from {} to {}", old_grade, new_grade),
                old_value: Some(Value::String(old_grade.to_string())),
                new_value: Some(Value::String(new_grade.to_string())),
            });
        }
    }

    // SSL expiry warning
    if let Some(days) = new_result["security"]["ssl"]["days_until_expiry"].as_i64() {
        if days > 0 && days <= 30 {
            changes.push(Change {
                change_type: "ssl_expiring".into(),
                description: format!("SSL certificate expires in {} days", days),
                old_value: None,
                new_value: Some(Value::Number(days.into())),
            });
        }
    }

    // SEO score changes (> 10 point swing)
    if let (Some(old_seo), Some(new_seo)) = (
        old_result["seo"]["score"].as_u64(),
        new_result["seo"]["score"].as_u64(),
    ) {
        let diff = (new_seo as i64) - (old_seo as i64);
        if diff.abs() > 10 {
            changes.push(Change {
                change_type: if diff > 0 { "seo_improved" } else { "seo_degraded" }.into(),
                description: format!("SEO score changed from {} to {} ({:+})", old_seo, new_seo, diff),
                old_value: Some(Value::Number(old_seo.into())),
                new_value: Some(Value::Number(new_seo.into())),
            });
        }
    }

    // New sensitive files exposed
    let old_files_count = old_result["vulnerability"]["sensitive_files"]["exposed_files"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);
    let new_files_count = new_result["vulnerability"]["sensitive_files"]["exposed_files"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);
    if new_files_count > old_files_count {
        changes.push(Change {
            change_type: "sensitive_file_exposed".into(),
            description: format!(
                "{} new sensitive file(s) exposed (total: {})",
                new_files_count - old_files_count,
                new_files_count
            ),
            old_value: Some(Value::Number(old_files_count.into())),
            new_value: Some(Value::Number(new_files_count.into())),
        });
    }

    // New CVEs detected
    let old_cves = old_result["vulnerability"]["cve_matches"]["total_found"]
        .as_u64()
        .unwrap_or(0);
    let new_cves = new_result["vulnerability"]["cve_matches"]["total_found"]
        .as_u64()
        .unwrap_or(0);
    if new_cves > old_cves {
        changes.push(Change {
            change_type: "cve_detected".into(),
            description: format!(
                "{} new CVE(s) detected (total: {})",
                new_cves - old_cves,
                new_cves
            ),
            old_value: Some(Value::Number(old_cves.into())),
            new_value: Some(Value::Number(new_cves.into())),
        });
    }

    // Carbon grade changes
    if let (Some(old_carbon), Some(new_carbon)) = (
        old_result["carbon"]["sustainability_grade"].as_str(),
        new_result["carbon"]["sustainability_grade"].as_str(),
    ) {
        if old_carbon != new_carbon {
            changes.push(Change {
                change_type: "carbon_grade_changed".into(),
                description: format!("Sustainability grade changed from {} to {}", old_carbon, new_carbon),
                old_value: Some(Value::String(old_carbon.to_string())),
                new_value: Some(Value::String(new_carbon.to_string())),
            });
        }
    }

    changes
}

pub async fn send_alert_email(_to: &str, _url: &str, _changes: &[Change]) -> AppResult<()> {
    // Email sending via SendGrid/Resend would go here
    tracing::info!("Alert email would be sent (email service not configured)");
    Ok(())
}
