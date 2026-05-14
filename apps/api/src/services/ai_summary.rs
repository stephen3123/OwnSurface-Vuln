use crate::models::scan_result::ScanResult;

pub fn generate_summary(result: &ScanResult) -> String {
    let mut insights = Vec::new();

    // Tech stack size
    let tech_count = result.tech_stack.len();
    if tech_count > 20 {
        insights.push(
            "This is a complex, enterprise-grade application with a large technology footprint."
                .to_string(),
        );
    } else if tech_count > 10 {
        insights.push("This website uses a modern, well-rounded tech stack.".to_string());
    } else if tech_count > 0 {
        insights.push(
            "This website has a lean technology stack, suggesting a focused approach.".to_string(),
        );
    }

    // Security assessment
    match result.security.score {
        90..=100 => insights.push(
            "Excellent security posture with comprehensive protections in place.".to_string(),
        ),
        70..=89 => insights
            .push("Good security practices, though some improvements could be made.".to_string()),
        50..=69 => insights.push(
            "Moderate security — several important headers or protections are missing.".to_string(),
        ),
        _ => insights
            .push("Security concerns detected — critical protections are missing.".to_string()),
    }

    // Business signals
    if result.business_signals.has_pricing && !result.business_signals.payment_processors.is_empty()
    {
        insights.push("Active SaaS business with pricing page and payment processing.".to_string());
    } else if result.business_signals.has_pricing {
        insights
            .push("Has a pricing page, indicating a commercial product or service.".to_string());
    }

    if result.business_signals.has_careers || result.business_signals.is_hiring {
        insights.push("Currently hiring — the company is growing.".to_string());
    }

    if !result.business_signals.ad_pixels.is_empty() {
        let pixels = result.business_signals.ad_pixels.join(", ");
        insights.push(format!("Running advertising with: {}.", pixels));
    }

    if !result.business_signals.chat_widgets.is_empty() {
        insights.push(
            "Uses live chat for customer support, indicating B2B or customer-focused business."
                .to_string(),
        );
    }

    // Traffic
    match result.traffic.traffic_tier.as_str() {
        "Very High" => insights.push("Major website with very high traffic levels.".to_string()),
        "High" => insights.push("Popular website with significant traffic.".to_string()),
        "Medium" => insights.push("Moderately trafficked website.".to_string()),
        _ => {}
    }

    // SEO
    if result.seo.score >= 80 {
        insights.push("Strong SEO fundamentals in place.".to_string());
    } else if result.seo.score < 50 {
        insights.push("SEO needs improvement — missing important elements.".to_string());
    }

    // Cost estimate
    if result.cost_estimate.total_monthly_max > 5000.0 {
        insights.push(format!(
            "Estimated infrastructure cost: ${}-${}/month, indicating significant scale.",
            result.cost_estimate.total_monthly_min as i64,
            result.cost_estimate.total_monthly_max as i64
        ));
    }

    // Social presence
    let social_count = result.social_links.len();
    if social_count >= 5 {
        insights.push("Strong social media presence across multiple platforms.".to_string());
    } else if social_count == 0 {
        insights.push(
            "No social media links detected — may be early stage or internal tool.".to_string(),
        );
    }

    // Competitors
    if !result.competitors.is_empty() {
        insights.push(format!(
            "Competes with {} similar websites in this space.",
            result.competitors.len()
        ));
    }

    if insights.is_empty() {
        return "Scan completed. No significant signals detected.".to_string();
    }

    insights.join(" ")
}
