import React from 'react';

/**
 * DevCollab Official Logo
 * Minimalist developer collaboration mark: Code chevrons bridging into a central team nexus.
 */
export default function Logo({ size = 30, showText = false, textStyle = {} }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', lineHeight: 1 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, display: 'block' }}
        aria-label="DevCollab Logo"
      >
        {/* Sleek rounded obsidian squircle */}
        <rect
          width="32"
          height="32"
          rx="8"
          fill="#0f172a"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />

        {/* Left Developer Bracket */}
        <path
          d="M10 11L5.5 16L10 21"
          stroke="#94a3b8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Developer Bracket */}
        <path
          d="M22 11L26.5 16L22 21"
          stroke="#94a3b8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Team Collaboration Node */}
        <circle cx="16" cy="16" r="3" fill="#8b5cf6" />

        {/* Connection Linkages */}
        <path
          d="M10.5 16H13"
          stroke="#8b5cf6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        <path
          d="M19 16H21.5"
          stroke="#8b5cf6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
      </svg>

      {showText && (
        <span
          style={{
            fontWeight: 700,
            fontSize: '1.2rem',
            letterSpacing: '-0.025em',
            color: 'var(--text-main)',
            userSelect: 'none',
            ...textStyle
          }}
        >
          DevCollab
        </span>
      )}
    </div>
  );
}
