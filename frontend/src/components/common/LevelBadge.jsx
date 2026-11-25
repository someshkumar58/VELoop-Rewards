import React from 'react';
import styles from './LevelBadge.module.css';

/**
 * VELoop Rewards — High-End Gamified Level Badges
 * Handcrafted multi-layered vector crests for the 5 canonical progression tiers:
 * Tier 1: Bronze Initiate (Shield with forged blades)
 * Tier 2: Silver Explorer (Hexagonal chrome crest with compass star & wings)
 * Tier 3: Titanium Voyager (Cybernetic titanium plate with ion reactor)
 * Tier 4: Gold Pioneer (Royal heraldic crest with imperial crown & laurels)
 * Tier 5: Diamond Legend (Prismatic crystalline emblem with celestial wings)
 */

export const TIER_CONFIG = {
  1: {
    level: 1,
    name: 'Bronze Initiate',
    shortName: 'Bronze',
    ribbonText: 'LEVEL 1 • BRONZE',
    accentColor: '#CD7F32',
    secondaryColor: '#E28743',
    glowColor: 'rgba(205, 127, 50, 0.45)',
    shadowColor: 'rgba(141, 91, 40, 0.4)',
    multiplier: '1.00x',
    minXP: 0,
    maxXP: 2499,
    theme: 'bronze',
    tagline: 'Initiate of the Rewards Realm',
    perksSummary: 'Standard baseline earning rates & daily check-in rewards'
  },
  2: {
    level: 2,
    name: 'Silver Explorer',
    shortName: 'Silver',
    ribbonText: 'LEVEL 2 • SILVER',
    accentColor: '#C7CEDB',
    secondaryColor: '#E2E8F0',
    glowColor: 'rgba(199, 206, 219, 0.45)',
    shadowColor: 'rgba(100, 116, 139, 0.4)',
    multiplier: '1.10x',
    minXP: 2500,
    maxXP: 5999,
    theme: 'silver',
    tagline: 'Pathfinder of Infinite Quests',
    perksSummary: '+10% ad bonuses & expedited verification queue'
  },
  3: {
    level: 3,
    name: 'Titanium Voyager',
    shortName: 'Titanium',
    ribbonText: 'LEVEL 3 • TITANIUM',
    accentColor: '#48CAE4',
    secondaryColor: '#00F2FE',
    glowColor: 'rgba(72, 202, 228, 0.5)',
    shadowColor: 'rgba(3, 4, 94, 0.45)',
    multiplier: '1.15x',
    minXP: 6000,
    maxXP: 9999,
    theme: 'titanium',
    tagline: 'Master of Cosmic Velocities',
    perksSummary: 'Free monthly Gem crate & 12h withdrawal settlements'
  },
  4: {
    level: 4,
    name: 'Gold Pioneer',
    shortName: 'Gold',
    ribbonText: 'LEVEL 4 • GOLD',
    accentColor: '#F4C76A',
    secondaryColor: '#FFE57F',
    glowColor: 'rgba(244, 199, 106, 0.55)',
    shadowColor: 'rgba(217, 119, 6, 0.45)',
    multiplier: '1.25x',
    minXP: 10000,
    maxXP: 14999,
    theme: 'gold',
    tagline: 'Imperial Sovereign of Rewards',
    perksSummary: '+25% all reward multipliers & zero-fee token swaps'
  },
  5: {
    level: 5,
    name: 'Diamond Legend',
    shortName: 'Diamond',
    ribbonText: 'LEVEL 5 • DIAMOND',
    accentColor: '#00F2FE',
    secondaryColor: '#A78BFA',
    glowColor: 'rgba(0, 242, 254, 0.6)',
    shadowColor: 'rgba(167, 139, 250, 0.5)',
    multiplier: '1.50x',
    minXP: 15000,
    maxXP: Infinity,
    theme: 'diamond',
    tagline: 'Ascended Mythic Legend',
    perksSummary: 'VIP Telegram access, instant payouts & physical swag kit'
  }
};

const LevelBadge = ({
  tier = 1,
  size = 'md', // 'sm' (56px) | 'md' (96px) | 'lg' (140px) | 'xl' (180px) | number
  showRibbon = true,
  glow = true,
  animated = false,
  locked = false,
  className = '',
  onClick
}) => {
  const tierNum = Math.min(5, Math.max(1, Number(tier) || 1));
  const config = TIER_CONFIG[tierNum] || TIER_CONFIG[1];

  let dimension = 96;
  if (typeof size === 'number') {
    dimension = size;
  } else {
    switch (size) {
      case 'xs': dimension = 42; break;
      case 'sm': dimension = 64; break;
      case 'md': dimension = 96; break;
      case 'lg': dimension = 140; break;
      case 'xl': dimension = 180; break;
      default: dimension = 96;
    }
  }

  // Unique ID prefix for SVG gradient definitions to prevent cross-badge collisions
  const gradId = `badge-t${tierNum}-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <div
      className={`
        ${styles.badgeContainer}
        ${styles[config.theme]}
        ${glow ? styles.hasGlow : ''}
        ${animated ? styles.animated : ''}
        ${locked ? styles.locked : ''}
        ${className}
      `}
      style={{
        width: `${dimension}px`,
        height: `${dimension}px`,
        '--badge-glow': config.glowColor,
        '--badge-accent': config.accentColor
      }}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={`${config.name} Badge (Level ${config.level})`}
      tabIndex={onClick ? 0 : undefined}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        className={styles.svgElement}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Ambient Glow */}
          <radialGradient id={`${gradId}-ambient`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={config.accentColor} stopOpacity="0.4" />
            <stop offset="70%" stopColor={config.accentColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={config.accentColor} stopOpacity="0" />
          </radialGradient>

          {/* Tier Specific Gradient Shading */}
          {tierNum === 1 && (
            <>
              <linearGradient id={`${gradId}-bronze-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E28743" />
                <stop offset="40%" stopColor="#CD7F32" />
                <stop offset="100%" stopColor="#6C3A15" />
              </linearGradient>
              <linearGradient id={`${gradId}-bronze-border`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="50%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#451A03" />
              </linearGradient>
              <linearGradient id={`${gradId}-bronze-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A1B14" />
                <stop offset="100%" stopColor="#150E0A" />
              </linearGradient>
            </>
          )}

          {tierNum === 2 && (
            <>
              <linearGradient id={`${gradId}-silver-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#CBD5E1" />
                <stop offset="70%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <linearGradient id={`${gradId}-silver-border`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="50%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id={`${gradId}-silver-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </>
          )}

          {tierNum === 3 && (
            <>
              <linearGradient id={`${gradId}-titanium-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67E8F9" />
                <stop offset="40%" stopColor="#06B6D4" />
                <stop offset="80%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0C4A6E" />
              </linearGradient>
              <linearGradient id={`${gradId}-titanium-border`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A5F3FC" />
                <stop offset="50%" stopColor="#0891B2" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>
              <linearGradient id={`${gradId}-titanium-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#082F49" />
                <stop offset="100%" stopColor="#031525" />
              </linearGradient>
            </>
          )}

          {tierNum === 4 && (
            <>
              <linearGradient id={`${gradId}-gold-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="35%" stopColor="#FACC15" />
                <stop offset="70%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#854D0E" />
              </linearGradient>
              <linearGradient id={`${gradId}-gold-border`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF9C3" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id={`${gradId}-gold-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2E2108" />
                <stop offset="100%" stopColor="#181103" />
              </linearGradient>
            </>
          )}

          {tierNum === 5 && (
            <>
              <linearGradient id={`${gradId}-diamond-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#67E8F9" />
                <stop offset="50%" stopColor="#818CF8" />
                <stop offset="75%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
              <linearGradient id={`${gradId}-diamond-border`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
              <linearGradient id={`${gradId}-diamond-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E1B4B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </>
          )}

          {/* Drop Shadows */}
          <filter id={`${gradId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={config.shadowColor} />
          </filter>
          <filter id={`${gradId}-glow-filter`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Back Glow Circle */}
        <circle cx="100" cy="95" r="90" fill={`url(#${gradId}-ambient)`} />

        {/* ==============================================================
            TIER 1: BRONZE INITIATE (Medieval Heater Shield & Crossblades)
            ============================================================== */}
        {tierNum === 1 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Outer Bronze Shield */}
            <path
              d="M100 20 L158 36 C158 92 136 142 100 168 C64 142 42 92 42 36 Z"
              fill={`url(#${gradId}-bronze-border)`}
              stroke="#FDBA74"
              strokeWidth="2"
            />
            {/* Inner Shield Cavity */}
            <path
              d="M100 28 L150 42 C150 90 130 134 100 158 C70 134 50 90 50 42 Z"
              fill={`url(#${gradId}-bronze-inner)`}
              stroke="#9A3412"
              strokeWidth="1.5"
            />

            {/* Shield Plate Layer */}
            <path
              d="M100 36 L142 48 C142 86 126 124 100 146 C74 124 58 86 58 48 Z"
              fill={`url(#${gradId}-bronze-main)`}
              opacity="0.85"
            />

            {/* Bronze Rivets */}
            <circle cx="56" cy="45" r="2.5" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />
            <circle cx="144" cy="45" r="2.5" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />
            <circle cx="68" cy="115" r="2.5" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />
            <circle cx="132" cy="115" r="2.5" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />

            {/* Crossed Initiation Blades / Anvil Crest */}
            <g transform="translate(100, 88)">
              {/* Blade 1 */}
              <path d="M-30 -25 L25 30 L20 35 L-35 -20 Z" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />
              {/* Blade 2 */}
              <path d="M30 -25 L-25 30 L-20 35 L35 -20 Z" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />
              {/* Center Bronze Medallion */}
              <circle cx="0" cy="5" r="16" fill={`url(#${gradId}-bronze-border)`} stroke="#FED7AA" strokeWidth="1.5" />
              <polygon points="0,-6 4,2 12,2 6,7 8,15 0,10 -8,15 -6,7 -12,2 -4,2" fill="#FEF3C7" />
            </g>
          </g>
        )}

        {/* ==============================================================
            TIER 2: SILVER EXPLORER (Chrome Beveled Hexagon & Compass Star)
            ============================================================== */}
        {tierNum === 2 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Outer Hexagon Shield with Wing Accents */}
            <path
              d="M100 18 L160 48 L160 115 L100 168 L40 115 L40 48 Z"
              fill={`url(#${gradId}-silver-border)`}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* Explorer Wing Flanks */}
            <path d="M40 70 L15 55 L25 85 L40 95 Z" fill={`url(#${gradId}-silver-main)`} stroke="#94A3B8" strokeWidth="1" />
            <path d="M160 70 L185 55 L175 85 L160 95 Z" fill={`url(#${gradId}-silver-main)`} stroke="#94A3B8" strokeWidth="1" />

            {/* Inner Hex Cavity */}
            <path
              d="M100 28 L150 53 L150 110 L100 156 L50 110 L50 53 Z"
              fill={`url(#${gradId}-silver-inner)`}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Mirror Sheen Reflection Facet */}
            <path
              d="M100 35 L142 58 L100 145 L58 58 Z"
              fill={`url(#${gradId}-silver-main)`}
              opacity="0.8"
            />

            {/* 8-Point Nautical Compass Star */}
            <g transform="translate(100, 92)">
              {/* Star Core Glow */}
              <circle cx="0" cy="0" r="24" fill="#38BDF8" opacity="0.25" />
              {/* Compass Main Points */}
              <polygon points="0,-36 6,-8 36,0 6,8 0,36 -6,8 -36,0 -6,-8" fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
              {/* Compass Diagonals */}
              <polygon points="0,-22 4,-5 22,0 4,5 0,22 -4,5 -22,0 -4,-5" fill="#93C5FD" opacity="0.8" transform="rotate(45)" />
              {/* Center Sapphire Core */}
              <circle cx="0" cy="0" r="7" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="-2" cy="-2" r="2" fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ==============================================================
            TIER 3: TITANIUM VOYAGER (Cybernetic Octagonal Fusion Shield)
            ============================================================== */}
        {tierNum === 3 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Futuristic Tech Shield */}
            <path
              d="M65 18 L135 18 L168 52 L168 122 L135 168 L65 168 L32 122 L32 52 Z"
              fill={`url(#${gradId}-titanium-border)`}
              stroke="#A5F3FC"
              strokeWidth="2.5"
            />
            {/* Inner Cyber Cavity */}
            <path
              d="M70 26 L130 26 L158 56 L158 118 L130 158 L70 158 L42 118 L42 56 Z"
              fill={`url(#${gradId}-titanium-inner)`}
              stroke="#0891B2"
              strokeWidth="1.5"
            />
            {/* Tech Armor Plate */}
            <path
              d="M75 34 L125 34 L148 60 L148 112 L125 148 L75 148 L52 112 L52 60 Z"
              fill={`url(#${gradId}-titanium-main)`}
              opacity="0.75"
            />

            {/* Glowing Tech Circuits */}
            <line x1="32" y1="87" x2="60" y2="87" stroke="#67E8F9" strokeWidth="2" />
            <line x1="140" y1="87" x2="168" y2="87" stroke="#67E8F9" strokeWidth="2" />

            {/* Hyper-Drive Cosmic Ion Reactor */}
            <g transform="translate(100, 91)">
              {/* Outer Energy Ring */}
              <circle cx="0" cy="0" r="30" stroke="#00F2FE" strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
              <circle cx="0" cy="0" r="22" fill="#082F49" stroke="#67E8F9" strokeWidth="2" />
              {/* 4 Ion Thruster Wings */}
              <polygon points="0,-26 5,-12 0,-8 -5,-12" fill="#A5F3FC" />
              <polygon points="0,26 5,12 0,8 -5,12" fill="#A5F3FC" />
              <polygon points="-26,0 -12,5 -8,0 -12,-5" fill="#A5F3FC" />
              <polygon points="26,0 12,5 8,0 12,-5" fill="#A5F3FC" />
              {/* Cyan Plasma Core */}
              <circle cx="0" cy="0" r="10" fill="#22D3EE" filter={`url(#${gradId}-glow-filter)`} />
              <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ==============================================================
            TIER 4: GOLD PIONEER (Imperial Gold Crest, Crown & Laurels)
            ============================================================== */}
        {tierNum === 4 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Royal Gold Filigree Shield */}
            <path
              d="M100 16 L164 34 C164 96 140 148 100 174 C60 148 36 96 36 34 Z"
              fill={`url(#${gradId}-gold-border)`}
              stroke="#FEF08A"
              strokeWidth="2.5"
            />
            {/* Inner Imperial Cavity */}
            <path
              d="M100 24 L154 40 C154 92 132 140 100 164 C68 140 46 92 46 40 Z"
              fill={`url(#${gradId}-gold-inner)`}
              stroke="#B45309"
              strokeWidth="1.5"
            />
            {/* 24K Mirror Gold Inlay */}
            <path
              d="M100 32 L144 46 C144 88 126 130 100 152 C74 130 56 88 56 46 Z"
              fill={`url(#${gradId}-gold-main)`}
              opacity="0.9"
            />

            {/* Golden Laurels of Victory Flanking */}
            <g fill="#FEF08A" opacity="0.85">
              <path d="M60 70 Q50 85 64 95 Q68 85 60 70 Z" />
              <path d="M65 95 Q58 110 72 120 Q74 108 65 95 Z" />
              <path d="M140 70 Q150 85 136 95 Q132 85 140 70 Z" />
              <path d="M135 95 Q142 110 128 120 Q126 108 135 95 Z" />
            </g>

            {/* Imperial 5-Peak Sovereign Crown */}
            <g transform="translate(100, 86)">
              {/* Crown Base */}
              <path
                d="M-30 14 L30 14 L26 22 L-26 22 Z"
                fill="#B45309"
                stroke="#FEF08A"
                strokeWidth="1"
              />
              {/* Crown Jewels on Base */}
              <circle cx="-16" cy="18" r="2" fill="#EF4444" />
              <circle cx="0" cy="18" r="2.5" fill="#3B82F6" />
              <circle cx="16" cy="18" r="2" fill="#10B981" />

              {/* 5 Crown Peaks */}
              <path
                d="M-30 14 L-28 -4 L-15 8 L0 -14 L15 8 L28 -4 L30 14 Z"
                fill={`url(#${gradId}-gold-main)`}
                stroke="#78350F"
                strokeWidth="1.5"
              />
              {/* Pearl orbs on peaks */}
              <circle cx="-28" cy="-5" r="3" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />
              <circle cx="-15" cy="8" r="2.5" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />
              <circle cx="0" cy="-15" r="4.5" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1.5" />
              <circle cx="15" cy="8" r="2.5" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />
              <circle cx="28" cy="-5" r="3" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />

              {/* Radiant Diamond Starburst at Center */}
              <circle cx="0" cy="3" r="5" fill="#FFFFFF" filter={`url(#${gradId}-glow-filter)`} />
            </g>
          </g>
        )}

        {/* ==============================================================
            TIER 5: DIAMOND LEGEND (Prismatic Crystal Emblem & Angelic Wings)
            ============================================================== */}
        {tierNum === 5 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Prismatic Radiant Wings */}
            <g fill={`url(#${gradId}-diamond-border)`} opacity="0.9">
              {/* Left Wing Feathers */}
              <path d="M48 60 C20 40 5 65 10 95 C25 85 45 80 48 85 Z" />
              <path d="M42 85 C15 78 5 105 18 128 C30 115 42 108 42 112 Z" />
              {/* Right Wing Feathers */}
              <path d="M152 60 C180 40 195 65 190 95 C175 85 155 80 152 85 Z" />
              <path d="M158 85 C185 78 195 105 182 128 C170 115 158 108 158 112 Z" />
            </g>

            {/* Main Diamond Shield Body */}
            <polygon
              points="100,14 165,58 140,154 100,178 60,154 35,58"
              fill={`url(#${gradId}-diamond-border)`}
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            {/* Deep Cosmic Void Cavity */}
            <polygon
              points="100,24 154,62 132,144 100,166 68,144 46,62"
              fill={`url(#${gradId}-diamond-inner)`}
              stroke="#A855F7"
              strokeWidth="1.5"
            />

            {/* Brilliant Cut 3D Diamond Gemstone */}
            <g transform="translate(100, 90)">
              {/* Diamond Table Facets */}
              <polygon points="-24,-18 24,-18 36,0 0,38 -36,0" fill={`url(#${gradId}-diamond-main)`} stroke="#FFFFFF" strokeWidth="1.5" />
              {/* Facet Cuts */}
              <polygon points="-16,-18 16,-18 24,0 -24,0" fill="#E0F2FE" opacity="0.9" />
              <polygon points="-16,-18 -24,0 -36,0" fill="#67E8F9" opacity="0.75" />
              <polygon points="16,-18 24,0 36,0" fill="#C084FC" opacity="0.75" />
              <polygon points="-24,0 0,38 0,0" fill="#818CF8" opacity="0.85" />
              <polygon points="24,0 0,38 0,0" fill="#A855F7" opacity="0.85" />
              <polygon points="-36,0 -24,0 0,38" fill="#38BDF8" opacity="0.7" />
              <polygon points="36,0 24,0 0,38" fill="#F472B6" opacity="0.7" />

              {/* Apex Diamond Light Flares */}
              <circle cx="0" cy="0" r="14" fill="#FFFFFF" filter={`url(#${gradId}-glow-filter)`} opacity="0.9" />
              <polygon points="0,-28 3,-6 28,0 3,6 0,28 -3,6 -28,0 -3,-6" fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ==============================================================
            LOCKED OVERLAY (When locked flag is active)
            ============================================================== */}
        {locked && (
          <g>
            <rect x="0" y="0" width="200" height="200" fill="rgba(10, 12, 20, 0.6)" rx="100" />
            <circle cx="100" cy="95" r="26" fill="#1E2235" stroke="#475569" strokeWidth="2" />
            <path
              d="M93 92 V85 C93 81.1 96.1 78 100 78 C103.9 78 107 81.1 107 85 V92 M91 92 H109 C110.1 92 111 92.9 111 94 V106 C111 107.1 110.1 108 109 108 H91 C89.9 108 89 107.1 89 106 V94 C89 92.9 89.9 92 91 92 Z"
              stroke="#94A3B8"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {/* ==============================================================
            BOTTOM 3D SCULPTED METALLIC RIBBON BANNER
            ============================================================== */}
        {showRibbon && (
          <g transform="translate(100, 168)" filter={`url(#${gradId}-shadow)`}>
            {/* Ribbon Tails / Wings */}
            <path d="M-72 6 L-88 0 L-80 18 L-72 16 Z" fill="#1E293B" stroke={config.accentColor} strokeWidth="1" />
            <path d="M72 6 L88 0 L80 18 L72 16 Z" fill="#1E293B" stroke={config.accentColor} strokeWidth="1" />

            {/* Main Ribbon Plaque */}
            <path
              d="M-70 -2 L70 -2 L64 18 L-64 18 Z"
              fill="#0F172A"
              stroke={config.accentColor}
              strokeWidth="1.5"
            />
            {/* Top Gloss Edge */}
            <line x1="-66" y1="0" x2="66" y2="0" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />

            {/* Embossed Ribbon Text */}
            <text
              x="0"
              y="11"
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="9.5"
              fontWeight="900"
              fontFamily="var(--font-sans), sans-serif"
              letterSpacing="1"
            >
              {config.ribbonText}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default LevelBadge;
