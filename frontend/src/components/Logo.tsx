interface LogoProps {
  size?: number;
}

/**
 * Inline SVG so it inherits the theme's CSS variables directly (light/dark
 * both handled for free) instead of shipping a static asset that would need
 * a separate dark-mode variant.
 */
export default function Logo({ size = 26 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="brand-logo">
      <rect width="64" height="64" rx="16" fill="var(--primary)" />
      <path
        d="M20 14h16l8 8v28a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z"
        fill="var(--primary-ink)"
      />
      <path
        d="M36 14v6a2 2 0 0 0 2 2h6"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M23 30h12M23 35h12M23 40h8"
        stroke="var(--primary)"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="45" cy="45" r="12" fill="var(--accent)" />
      <path
        d="M39.5 45.3l3.4 3.4 7-7.4"
        fill="none"
        stroke="var(--accent-ink)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
