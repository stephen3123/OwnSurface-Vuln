import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/lib/site";

/**
 * IndexNow — Instant URL submission to Bing, Yandex, Seznam, Naver.
 *
 * POST /api/indexnow
 * Body: { "urls": ["https://ownsurface.com/blog/new-post"] }
 *
 * This pings the IndexNow API so search engines crawl your page
 * within minutes instead of days.
 *
 * Protect with a simple shared secret so only your CI/CD or
 * admin dashboard can trigger it.
 */

const INDEXNOW_KEY = "f6611caf9a764cf592134b65d8f5c5e2";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const ADMIN_SECRET = process.env.INDEXNOW_ADMIN_SECRET || "";

export async function POST(request: NextRequest) {
  // Simple auth check
  const authHeader = request.headers.get("x-admin-secret");
  if (ADMIN_SECRET && authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const urls: string[] = body.urls;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Provide an array of URLs in the request body" },
        { status: 400 }
      );
    }

    // Cap at 10,000 URLs per IndexNow spec
    const batch = urls.slice(0, 10000);

    const payload = {
      host: new URL(siteConfig.url).hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${siteConfig.url}/${INDEXNOW_KEY}.txt`,
      urlList: batch,
    };

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      status: response.status,
      submitted: batch.length,
      message:
        response.status === 200
          ? "URLs submitted successfully — Bing, Yandex & others will crawl shortly."
          : `IndexNow responded with status ${response.status}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit to IndexNow", details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for quick health check
export async function GET() {
  return NextResponse.json({
    service: "IndexNow",
    key: INDEXNOW_KEY,
    keyUrl: `${siteConfig.url}/${INDEXNOW_KEY}.txt`,
    endpoint: INDEXNOW_ENDPOINT,
    usage:
      'POST /api/indexnow with body { "urls": ["https://ownsurface.com/page"] }',
  });
}
