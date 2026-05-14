import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #071214 0%, #102a2b 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 26,
            borderRadius: 80,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "radial-gradient(circle at 28% 20%, rgba(56,243,220,0.16), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))",
          }}
        />
        <svg width="316" height="316" viewBox="0 0 64 64" fill="none" aria-hidden="true">
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
    ),
    size
  );
}
