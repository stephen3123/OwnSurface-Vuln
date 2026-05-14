import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "OwnSurface website intelligence preview";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background:
            "radial-gradient(circle at top left, rgba(14,165,144,0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(14,165,144,0.08), transparent 40%), linear-gradient(180deg, #0b1716 0%, #0d1f1d 100%)",
          color: "#f7fdfc",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: 70,
            height: 540,
            width: 540,
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.06)",
            transform: "scale(1.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -80,
            top: 100,
            height: 460,
            width: 460,
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.04)",
            transform: "scale(1.05)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 74px",
            width: "100%",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                height: 72,
                width: 72,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 24,
                background: "linear-gradient(145deg, #071214 0%, #102a2b 100%)",
                boxShadow: "0 18px 36px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <svg width="44" height="44" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path
                  d="M13 33c0-10.9 8.9-19.8 19.8-19.8 6.1 0 11.6 2.8 15.2 7.2"
                  stroke="rgba(215,255,250,0.18)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M16.8 36.7c0 9.1 7.4 16.5 16.5 16.5 5.6 0 10.6-2.8 13.6-7"
                  stroke="rgba(215,255,250,0.16)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M20.8 31.9c0-6.8 5.5-12.3 12.3-12.3 3.9 0 7.5 1.8 9.8 4.7"
                  stroke="rgba(56,243,220,0.4)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M43.4 21.7c-2.1-2.9-5.5-4.6-9.8-4.6-5.8 0-10 3-10 7.3 0 3.8 2.8 5.7 8.3 7l3.2.8c3 .7 4.6 1.5 4.6 3.6 0 2.5-2.7 4.4-6.8 4.4-3.9 0-7.1-1.5-9.5-4.5"
                  stroke="rgba(247,252,252,0.98)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="46.2" cy="19.3" r="3.25" fill="rgb(56 243 220)" />
                <circle cx="46.2" cy="19.3" r="6.6" stroke="rgba(56,243,220,0.22)" strokeWidth="1.4" />
              </svg>
            </div>
            <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.05em", color: "#ffffff" }}>OwnSurface</div>
          </div>

          {/* Main content */}
          <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 26 }}>
            <div
              style={{
                fontSize: 18,
                textTransform: "uppercase",
                letterSpacing: "0.24em",
                color: "#2dd4bf",
                fontWeight: 700,
              }}
            >
              Website intelligence, traffic analysis, and security recon
            </div>
            <div style={{ fontSize: 78, lineHeight: 0.95, letterSpacing: "-0.08em", fontWeight: 700, color: "#ffffff" }}>
              See any website the way an operator does.
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.45, color: "rgba(255,255,255,0.5)", maxWidth: 880 }}>
              Scan domains to reveal stack, SEO, traffic clues, security posture, competitor context, and owned-domain risks from one workspace.
            </div>
          </div>

          {/* Bottom tags */}
          <div style={{ display: "flex", gap: 32, fontSize: 22, color: "rgba(255,255,255,0.4)" }}>
            <div>Tech stack</div>
            <div>Traffic analysis</div>
            <div>Security posture</div>
            <div>Owned domains</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
