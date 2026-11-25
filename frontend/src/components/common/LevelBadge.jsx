import React from 'react';
import styles from './LevelBadge.module.css';

/**
 * VELoop Rewards — High-End Gamified Level Badges
 * Handcrafted multi-layered vector crests for the 5 canonical progression tiers:
 * Tier 1: Bronze Initiate (Shield with forged blades & copper star)
 * Tier 2: Silver Explorer (Beveled chrome hex crest with compass star & angel wings)
 * Tier 3: Titanium Voyager (Futuristic cybernetic armor with glowing ion plasma reactor)
 * Tier 4: Gold Pioneer (Royal imperial crest with 5-point jeweled crown & victory laurels)
 * Tier 5: Diamond Legend (Celestial brilliant-cut mythic diamond with radiant prismatic wings)
 */

export const TIER_CONFIG = {
  1: {
    level: 1,
    name: 'Bronze Initiate',
    shortName: 'Bronze',
    ribbonText: 'LEVEL 1 • BRONZE',
    accentColor: '#CD7F32',
    secondaryColor: '#E28743',
    glowColor: 'rgba(205, 127, 50, 0.55)',
    shadowColor: 'rgba(141, 91, 40, 0.45)',
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
    glowColor: 'rgba(199, 206, 219, 0.55)',
    shadowColor: 'rgba(100, 116, 139, 0.45)',
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
    glowColor: 'rgba(72, 202, 228, 0.65)',
    shadowColor: 'rgba(3, 4, 94, 0.5)',
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
    glowColor: 'rgba(244, 199, 106, 0.65)',
    shadowColor: 'rgba(217, 119, 6, 0.5)',
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
    glowColor: 'rgba(0, 242, 254, 0.75)',
    shadowColor: 'rgba(167, 139, 250, 0.55)',
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
  size = 'md', // 'xs' (42px) | 'sm' (64px) | 'md' (96px) | 'lg' (140px) | 'xl' (180px) | number
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

  // Generate deterministic ID prefix based on tier to avoid hydration mismatch
  const gradId = `badge-t${tierNum}`;

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
            <stop offset="0%" stopColor={config.accentColor} stopOpacity="0.5" />
            <stop offset="65%" stopColor={config.accentColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={config.accentColor} stopOpacity="0" />
          </radialGradient>

          {/* Tier 1: Bronze Gradients */}
          <linearGradient id={`${gradId}-bronze-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="35%" stopColor="#EA580C" />
            <stop offset="70%" stopColor="#C2410C" />
            <stop offset="100%" stopColor="#7C2D12" />
          </linearGradient>
          <linearGradient id={`${gradId}-bronze-border`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="40%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#431407" />
          </linearGradient>
          <linearGradient id={`${gradId}-bronze-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A1B14" />
            <stop offset="100%" stopColor="#140B07" />
          </linearGradient>

          {/* Tier 2: Silver Gradients */}
          <linearGradient id={`${gradId}-silver-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E2E8F0" />
            <stop offset="65%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id={`${gradId}-silver-border`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id={`${gradId}-silver-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0B0F19" />
          </linearGradient>

          {/* Tier 3: Titanium Gradients */}
          <linearGradient id={`${gradId}-titanium-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="35%" stopColor="#22D3EE" />
            <stop offset="70%" stopColor="#0891B2" />
            <stop offset="100%" stopColor="#0C4A6E" />
          </linearGradient>
          <linearGradient id={`${gradId}-titanium-border`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
          <linearGradient id={`${gradId}-titanium-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#082F49" />
            <stop offset="100%" stopColor="#021422" />
          </linearGradient>

          {/* Tier 4: Gold Gradients */}
          <linearGradient id={`${gradId}-gold-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="25%" stopColor="#FDE047" />
            <stop offset="60%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#854D0E" />
          </linearGradient>
          <linearGradient id={`${gradId}-gold-border`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id={`${gradId}-gold-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2E2006" />
            <stop offset="100%" stopColor="#140D02" />
          </linearGradient>

          {/* Tier 5: Diamond Gradients */}
          <linearGradient id={`${gradId}-diamond-main`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#67E8F9" />
            <stop offset="45%" stopColor="#818CF8" />
            <stop offset="75%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
          <linearGradient id={`${gradId}-diamond-border`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#38BDF8" />
            <stop offset="70%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
          <linearGradient id={`${gradId}-diamond-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#0B091E" />
          </linearGradient>

          {/* Realistic Metallic Drop Shadows & Bloom Filters */}
          <filter id={`${gradId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor={config.shadowColor} />
          </filter>
          <filter id={`${gradId}-glow-filter`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer Halo Flare */}
        <circle cx="100" cy="94" r="92" fill={`url(#${gradId}-ambient)`} />

        {/* ==============================================================
            TIER 1: BRONZE INITIATE (Gladiator Crest & Dual Cross-Blades)
            ============================================================== */}
        {tierNum === 1 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Outer Beveled Heater Shield */}
            <path
              d="M100 18 L160 36 C160 94 138 144 100 170 C62 144 40 94 40 36 Z"
              fill={`url(#${gradId}-bronze-border)`}
              stroke="#FED7AA"
              strokeWidth="2.5"
            />
            {/* Inner Dark Iron Cavity */}
            <path
              d="M100 26 L152 42 C152 92 132 136 100 160 C68 136 48 92 48 42 Z"
              fill={`url(#${gradId}-bronze-inner)`}
              stroke="#7C2D12"
              strokeWidth="1.5"
            />
            {/* Bronze Armor Plate */}
            <path
              d="M100 34 L144 48 C144 88 126 126 100 148 C74 126 56 88 56 48 Z"
              fill={`url(#${gradId}-bronze-main)`}
              opacity="0.9"
            />

            {/* Heavy Forged Rivets */}
            <circle cx="54" cy="46" r="3" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />
            <circle cx="146" cy="46" r="3" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />
            <circle cx="66" cy="116" r="3" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />
            <circle cx="134" cy="116" r="3" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1" />

            {/* Crossed Initiation Blades with Central Medallion */}
            <g transform="translate(100, 88)">
              {/* Crossed Swords */}
              <path d="M-32 -26 L26 32 L20 38 L-38 -20 Z" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1.2" />
              <path d="M32 -26 L-26 32 L-20 38 L38 -20 Z" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1.2" />
              {/* Bronze Sun Star Medallion */}
              <circle cx="0" cy="5" r="18" fill={`url(#${gradId}-bronze-border)`} stroke="#FED7AA" strokeWidth="1.8" />
              <polygon points="0,-7 4,1 12,1 6,7 8,15 0,10 -8,15 -6,7 -12,1 -4,1" fill="#FFFBEB" />
              <circle cx="0" cy="4" r="3" fill="#7C2D12" />
            </g>
          </g>
        )}

        {/* ==============================================================
            TIER 2: SILVER EXPLORER (Chrome Beveled Hexagon & Compass Rose)
            ============================================================== */}
        {tierNum === 2 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Explorer Chrome Flank Wings */}
            <path d="M38 68 L12 52 L22 84 L38 96 Z" fill={`url(#${gradId}-silver-main)`} stroke="#E2E8F0" strokeWidth="1.2" />
            <path d="M162 68 L188 52 L178 84 L162 96 Z" fill={`url(#${gradId}-silver-main)`} stroke="#E2E8F0" strokeWidth="1.2" />

            {/* Outer Chrome Hex Shield */}
            <path
              d="M100 16 L162 46 L162 116 L100 170 L38 116 L38 46 Z"
              fill={`url(#${gradId}-silver-border)`}
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            {/* Deep Obsidian Cavity */}
            <path
              d="M100 26 L152 52 L152 110 L100 158 L48 110 L48 52 Z"
              fill={`url(#${gradId}-silver-inner)`}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Mirrored Platinum Facet */}
            <path
              d="M100 34 L144 58 L100 146 L56 58 Z"
              fill={`url(#${gradId}-silver-main)`}
              opacity="0.85"
            />

            {/* 8-Point Nautical Compass Star */}
            <g transform="translate(100, 92)">
              {/* Outer Cyan Ring */}
              <circle cx="0" cy="0" r="28" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
              {/* Main Compass Points */}
              <polygon points="0,-38 7,-9 38,0 7,9 0,38 -7,9 -38,0 -7,-9" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />
              {/* Diagonal Subtle Points */}
              <polygon points="0,-24 4,-6 24,0 4,6 0,24 -4,6 -24,0 -4,-6" fill="#93C5FD" opacity="0.8" transform="rotate(45)" />
              {/* Center Radiant Sapphire Core */}
              <circle cx="0" cy="0" r="8" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" filter={`url(#${gradId}-glow-filter)`} />
              <circle cx="-2" cy="-2" r="2.5" fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ==============================================================
            TIER 3: TITANIUM VOYAGER (Cybernetic Vanguard & Plasma Reactor)
            ============================================================== */}
        {tierNum === 3 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Cyber Titanium Armor Plates */}
            <path
              d="M65 16 L135 16 L170 50 L170 122 L135 170 L65 170 L30 122 L30 50 Z"
              fill={`url(#${gradId}-titanium-border)`}
              stroke="#E0F2FE"
              strokeWidth="2.5"
            />
            {/* Inner Dark Cyan Chamber */}
            <path
              d="M70 24 L130 24 L160 54 L160 118 L130 160 L70 160 L40 118 L40 54 Z"
              fill={`url(#${gradId}-titanium-inner)`}
              stroke="#0891B2"
              strokeWidth="1.5"
            />
            {/* Titanium Body Shell */}
            <path
              d="M75 32 L125 32 L150 58 L150 112 L125 150 L75 150 L50 112 L50 58 Z"
              fill={`url(#${gradId}-titanium-main)`}
              opacity="0.8"
            />

            {/* Glowing Tech Circuit Traces */}
            <line x1="30" y1="86" x2="60" y2="86" stroke="#67E8F9" strokeWidth="2.5" />
            <line x1="140" y1="86" x2="170" y2="86" stroke="#67E8F9" strokeWidth="2.5" />

            {/* Hyper-Drive Cosmic Ion Reactor */}
            <g transform="translate(100, 91)">
              {/* Outer Quantum Accelerator Ring */}
              <circle cx="0" cy="0" r="32" stroke="#00F2FE" strokeWidth="2" strokeDasharray="8 4" opacity="0.85" />
              <circle cx="0" cy="0" r="24" fill="#082F49" stroke="#67E8F9" strokeWidth="2" />
              {/* 4 Ion Thruster Emitters */}
              <polygon points="0,-28 6,-14 0,-10 -6,-14" fill="#A5F3FC" />
              <polygon points="0,28 6,14 0,10 -6,14" fill="#A5F3FC" />
              <polygon points="-28,0 -14,6 -10,0 -14,-6" fill="#A5F3FC" />
              <polygon points="28,0 14,6 10,0 14,-6" fill="#A5F3FC" />
              {/* Glowing Plasma Core */}
              <circle cx="0" cy="0" r="11" fill="#22D3EE" filter={`url(#${gradId}-glow-filter)`} />
              <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ==============================================================
            TIER 4: GOLD PIONEER (Imperial Sovereign Crown & Laurel Wreath)
            ============================================================== */}
        {tierNum === 4 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Royal Golden Filigree Crest Shield */}
            <path
              d="M100 14 L166 34 C166 98 142 150 100 176 C58 150 34 98 34 34 Z"
              fill={`url(#${gradId}-gold-border)`}
              stroke="#FEF08A"
              strokeWidth="2.5"
            />
            {/* Inner Velvet Gold Cavity */}
            <path
              d="M100 22 L156 38 C156 94 134 142 100 166 C66 142 44 94 44 38 Z"
              fill={`url(#${gradId}-gold-inner)`}
              stroke="#B45309"
              strokeWidth="1.5"
            />
            {/* 24K Mirror Gold Inlay */}
            <path
              d="M100 30 L146 44 C146 90 128 132 100 154 C72 132 54 90 54 44 Z"
              fill={`url(#${gradId}-gold-main)`}
              opacity="0.92"
            />

            {/* Victory Laurel Leaves */}
            <g fill="#FEF08A" opacity="0.9">
              <path d="M58 68 Q48 83 62 93 Q66 83 58 68 Z" />
              <path d="M63 93 Q56 108 70 118 Q72 106 63 93 Z" />
              <path d="M142 68 Q152 83 138 93 Q134 83 142 68 Z" />
              <path d="M137 93 Q144 108 130 118 Q128 106 137 93 Z" />
            </g>

            {/* Imperial 5-Peak Sovereign Crown */}
            <g transform="translate(100, 86)">
              {/* Crown Base */}
              <path d="M-32 14 L32 14 L28 22 L-28 22 Z" fill="#B45309" stroke="#FEF08A" strokeWidth="1" />
              {/* Inlaid Crown Gemstones */}
              <circle cx="-18" cy="18" r="2.5" fill="#EF4444" />
              <circle cx="0" cy="18" r="3" fill="#3B82F6" />
              <circle cx="18" cy="18" r="2.5" fill="#10B981" />

              {/* 5 Crown Peaks */}
              <path
                d="M-32 14 L-30 -5 L-16 8 L0 -16 L16 8 L30 -5 L32 14 Z"
                fill={`url(#${gradId}-gold-main)`}
                stroke="#78350F"
                strokeWidth="1.5"
              />
              {/* Crown Apex Pearl Orbs */}
              <circle cx="-30" cy="-6" r="3.5" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />
              <circle cx="-16" cy="8" r="3" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />
              <circle cx="0" cy="-17" r="5" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1.5" />
              <circle cx="16" cy="8" r="3" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />
              <circle cx="30" cy="-6" r="3.5" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />

              {/* Central Diamond Starburst */}
              <circle cx="0" cy="2" r="6" fill="#FFFFFF" filter={`url(#${gradId}-glow-filter)`} />
            </g>
          </g>
        )}

        {/* ==============================================================
            TIER 5: DIAMOND LEGEND (Prismatic Crystal & Angelic Wings)
            ============================================================== */}
        {tierNum === 5 && (
          <g filter={`url(#${gradId}-shadow)`}>
            {/* Celestial Prismatic Wings */}
            <g fill={`url(#${gradId}-diamond-border)`} opacity="0.95">
              <path d="M46 58 C16 38 2 64 8 94 C24 84 44 80 46 84 Z" />
              <path d="M40 84 C12 76 2 104 16 128 C28 114 40 108 40 112 Z" />
              <path d="M154 58 C184 38 198 64 192 94 C176 84 156 80 154 84 Z" />
              <path d="M160 84 C188 76 198 104 184 128 C172 114 160 108 160 112 Z" />
            </g>

            {/* Main Diamond Shield Body */}
            <polygon
              points="100,12 168,56 142,156 100,180 58,156 32,56"
              fill={`url(#${gradId}-diamond-border)`}
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            {/* Deep Violet Cosmic Core */}
            <polygon
              points="100,22 156,60 134,146 100,168 66,146 44,60"
              fill={`url(#${gradId}-diamond-inner)`}
              stroke="#A855F7"
              strokeWidth="1.5"
            />

            {/* Brilliant Cut 3D Diamond Gemstone */}
            <g transform="translate(100, 90)">
              {/* Base Table */}
              <polygon points="-26,-18 26,-18 38,0 0,40 -38,0" fill={`url(#${gradId}-diamond-main)`} stroke="#FFFFFF" strokeWidth="1.5" />
              {/* Facet Geometries */}
              <polygon points="-18,-18 18,-18 26,0 -26,0" fill="#E0F2FE" opacity="0.9" />
              <polygon points="-18,-18 -26,0 -38,0" fill="#67E8F9" opacity="0.8" />
              <polygon points="18,-18 26,0 38,0" fill="#C084FC" opacity="0.8" />
              <polygon points="-26,0 0,40 0,0" fill="#818CF8" opacity="0.9" />
              <polygon points="26,0 0,40 0,0" fill="#A855F7" opacity="0.9" />
              <polygon points="-38,0 -26,0 0,40" fill="#38BDF8" opacity="0.75" />
              <polygon points="38,0 26,0 0,40" fill="#F472B6" opacity="0.75" />

              {/* Apex Diamond Flare Flares */}
              <circle cx="0" cy="0" r="16" fill="#FFFFFF" filter={`url(#${gradId}-glow-filter)`} opacity="0.95" />
              <polygon points="0,-30 4,-7 30,0 4,7 0,30 -4,7 -30,0 -4,-7" fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ==============================================================
            LOCKED OVERLAY
            ============================================================== */}
        {locked && (
          <g>
            <rect x="0" y="0" width="200" height="200" fill="rgba(10, 12, 20, 0.65)" rx="100" />
            <circle cx="100" cy="95" r="28" fill="#1E2235" stroke="#475569" strokeWidth="2.5" />
            <path
              d="M93 92 V84 C93 80.1 96.1 77 100 77 C103.9 77 107 80.1 107 84 V92 M90 92 H110 C111.1 92 112 92.9 112 94 V107 C112 108.1 111.1 109 110 109 H90 C88.9 109 88 108.1 88 107 V94 C88 92.9 88.9 92 90 92 Z"
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
            {/* Ribbon Tails */}
            <path d="M-72 6 L-88 0 L-80 18 L-72 16 Z" fill="#0F172A" stroke={config.accentColor} strokeWidth="1" />
            <path d="M72 6 L88 0 L80 18 L72 16 Z" fill="#0F172A" stroke={config.accentColor} strokeWidth="1" />

            {/* Main Ribbon Plaque */}
            <path
              d="M-70 -2 L70 -2 L64 18 L-64 18 Z"
              fill="#0F172A"
              stroke={config.accentColor}
              strokeWidth="1.8"
            />
            {/* Top Gloss Edge */}
            <line x1="-66" y1="0" x2="66" y2="0" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />

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
