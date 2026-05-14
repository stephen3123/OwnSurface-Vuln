"use client";

export const CONSENT_COOKIE_NAME = "ownsurface_consent";
export const CONSENT_COOKIE_VERSION = 1;
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export interface ConsentPreferences {
  essential: true;
  analytics: boolean;
  version: number;
  timestamp: string;
}

export function createConsentPreferences(analytics: boolean): ConsentPreferences {
  return {
    essential: true,
    analytics,
    version: CONSENT_COOKIE_VERSION,
    timestamp: new Date().toISOString(),
  };
}

export function serializeConsentPreferences(preferences: ConsentPreferences) {
  return encodeURIComponent(JSON.stringify(preferences));
}

export function parseConsentPreferences(value?: string | null): ConsentPreferences | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<ConsentPreferences>;
    if (parsed.essential !== true || typeof parsed.analytics !== "boolean") {
      return null;
    }

    return {
      essential: true,
      analytics: parsed.analytics,
      version: typeof parsed.version === "number" ? parsed.version : CONSENT_COOKIE_VERSION,
      timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function readConsentCookie(): ConsentPreferences | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`));

  return parseConsentPreferences(cookie?.slice(CONSENT_COOKIE_NAME.length + 1) || null);
}

export function writeConsentCookie(preferences: ConsentPreferences) {
  if (typeof document === "undefined") return;

  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${serializeConsentPreferences(preferences)}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export function hasAnalyticsConsent(preferences: ConsentPreferences | null) {
  return Boolean(preferences?.analytics);
}

