use serde_json::json;

/// MCP (Model Context Protocol) server manifest for AI agent discovery.
/// Returns the list of available tools that AI agents can invoke.
pub fn mcp_manifest() -> serde_json::Value {
    json!({
        "name": "ownsurface",
        "version": "1.0.0",
        "description": "OwnSurface Website Intelligence — scan and analyze any website. Tech stack, security, SEO, company data, carbon footprint.",
        "setup": {
            "npm": "npx @ownsurface/mcp-server",
            "env": {
                "OWNSURFACE_API_KEY": "Get your API key at https://ownsurface.com/dashboard/api-keys"
            }
        },
        "tools": [
            {
                "name": "scan_website",
                "description": "Scan a website and return comprehensive intelligence: tech stack, security, SEO, company info, business signals, traffic, vulnerabilities, carbon footprint, and AI summary.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "The full URL to scan (e.g., https://stripe.com)"
                        }
                    },
                    "required": ["url"]
                }
            },
            {
                "name": "get_tech_stack",
                "description": "Get the technology stack of a website: frameworks, CMS, analytics, payments, CDN, hosting, and estimated infrastructure costs.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "domain": {
                            "type": "string",
                            "description": "Domain name (e.g., stripe.com) or full URL"
                        }
                    },
                    "required": ["domain"]
                }
            },
            {
                "name": "check_security",
                "description": "Check a website's security posture: SSL status, security headers, grade (A+ to F), vulnerabilities, and actionable fix recommendations with copy-paste server configs.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "The URL to check security for"
                        }
                    },
                    "required": ["url"]
                }
            },
            {
                "name": "get_company_info",
                "description": "Get company information from a domain: name, description, industry, location, employee range, social links, and email patterns. Clearbit alternative.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "domain": {
                            "type": "string",
                            "description": "Domain name (e.g., notion.so) or full URL"
                        }
                    },
                    "required": ["domain"]
                }
            },
            {
                "name": "compare_websites",
                "description": "Compare two websites side by side: tech stacks, security scores, SEO, traffic, and business signals.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url1": {
                            "type": "string",
                            "description": "First website URL"
                        },
                        "url2": {
                            "type": "string",
                            "description": "Second website URL"
                        }
                    },
                    "required": ["url1", "url2"]
                }
            },
            {
                "name": "get_scan_history",
                "description": "Get historical scan data for a URL to track changes over time: tech stack additions/removals, security score trends, SEO changes.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "The URL to get history for"
                        }
                    },
                    "required": ["url"]
                }
            },
            {
                "name": "check_carbon",
                "description": "Check a website's carbon footprint: CO2 per visit, sustainability grade (A+ to F), green hosting status, annual environmental impact, and recommendations.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "The URL to check carbon footprint for"
                        }
                    },
                    "required": ["url"]
                }
            }
        ]
    })
}
