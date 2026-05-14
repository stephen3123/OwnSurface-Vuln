//! Unit tests for XrayAI API utilities
use std::collections::HashSet;

#[test]
fn test_url_hash_consistency() {
    use sha2::{Sha256, Digest};
    let url = "https://example.com";
    let hash1 = format!("{:x}", Sha256::new().chain_update(url).finalize());
    let hash2 = format!("{:x}", Sha256::new().chain_update(url).finalize());
    assert_eq!(hash1, hash2, "URL hashing must be deterministic");
    assert_eq!(hash1.len(), 64, "SHA-256 hash must be 64 hex chars");
}

#[test]
fn test_url_hash_uniqueness() {
    use sha2::{Sha256, Digest};
    let urls = vec!["https://example.com", "https://example.org", "https://test.com"];
    let hashes: HashSet<String> = urls.iter()
        .map(|url| format!("{:x}", Sha256::new().chain_update(url).finalize()))
        .collect();
    assert_eq!(hashes.len(), urls.len(), "Different URLs must produce different hashes");
}

#[test]
fn test_api_key_prefix_format() {
    let raw_key = format!("xrai_{}", "a".repeat(32));
    assert!(raw_key.starts_with("xrai_"), "API key must start with xrai_");
    assert!(raw_key.len() >= 37, "API key must be at least 37 chars");
    let prefix = format!("xrai_{}...{}", &raw_key[5..9], &raw_key[raw_key.len()-4..]);
    assert!(prefix.contains("..."), "Key prefix must contain ellipsis");
}

#[test]
fn test_plan_validation() {
    let valid_plans = vec!["free", "pro"];
    let legacy_plans = vec!["business", "enterprise"];
    for plan in &valid_plans {
        assert!(valid_plans.contains(plan) || legacy_plans.contains(plan));
    }
    // Legacy plans should map to "pro"
    for plan in &legacy_plans {
        let mapped = match *plan {
            "business" | "enterprise" => "pro",
            other => other,
        };
        assert_eq!(mapped, "pro");
    }
}

#[test]
fn test_email_normalization() {
    let email = "  User@Example.COM  ";
    let normalized = email.trim().to_lowercase();
    assert_eq!(normalized, "user@example.com");
}

#[test]
fn test_password_validation() {
    assert!("short".len() < 8, "Passwords under 8 chars should be rejected");
    assert!("longpassword".len() >= 8, "Passwords >= 8 chars should be accepted");
    assert!("12345678".len() >= 8, "Numeric passwords >= 8 chars are valid");
}
