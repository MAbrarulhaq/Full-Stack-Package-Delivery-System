/**
 * The login screen's one deliberate visual flourish: a quiet, looping dot
 * traveling a pickup -> drop-off path. Pure CSS (offset-path/offset-distance)
 * applied to an SVG circle IN THE SAME COORDINATE SPACE as the static path
 * (rather than a separately-positioned HTML element), so it stays aligned
 * regardless of how the SVG itself is scaled by its container. No JS, no
 * animation library -- respects prefers-reduced-motion via the global rule
 * in index.css since it's a standard CSS animation, not SMIL.
 */
export function RouteIllustration() {
  const pathD = "M 40 260 C 120 260, 140 60, 260 60 S 380 200, 460 200";

  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 500 320" className="h-auto w-full max-w-md" aria-hidden="true">
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth="2"
          strokeDasharray="6 8"
          strokeLinecap="round"
        />
        <circle cx="40" cy="260" r="6" fill="var(--color-primary)" />
        <circle cx="460" cy="200" r="6" fill="var(--color-foreground)" />

        <text x="16" y="288" fontSize="13" fill="var(--color-muted)" fontFamily="var(--font-sans)">
          Pickup
        </text>
        <text x="424" y="228" fontSize="13" fill="var(--color-muted)" fontFamily="var(--font-sans)">
          Drop-off
        </text>

        <circle
          cx="40"
          cy="260"
          r="7"
          fill="var(--color-primary)"
          style={{
            offsetPath: `path("${pathD}")`,
            animation: "route-travel 4.5s ease-in-out infinite",
          }}
        />
      </svg>

      <style>{`
        @keyframes route-travel {
          0% { offset-distance: 0%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
