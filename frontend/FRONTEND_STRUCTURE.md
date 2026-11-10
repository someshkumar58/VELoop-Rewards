# VELoop Rewards — Frontend Architecture & Structure

## 1. Directory Tree

```
internship/frontend/
├── .env.example
├── .env
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── FRONTEND_STRUCTURE.md
├── FRONTEND_PROGRESS.md
├── API_INTEGRATION_STATUS.md
└── src/
    ├── main.jsx                        # Application root entry point
    ├── App.jsx                         # Main Router & Route definitions
    │
    ├── constants/
    │   ├── apiEndpoints.js             # Centralized REST API endpoints contract
    │   ├── assetsInfo.js               # Definitions for 5 reward assets (VEs, SVEs, Gems, Tokens, XP)
    │   └── previewData.js              # Deterministic sample data for offline UI preview
    │
    ├── context/
    │   ├── AuthContext.jsx             # React Context for user/admin auth & preview mode toggle
    │   ├── ToastContext.jsx            # Toast alert notifications system
    │   └── Toast.module.css
    │
    ├── services/
    │   ├── apiClient.js                # Reusable Axios instance with JWT interceptor & error formatting
    │   ├── profileService.js           # Services for all 8 User Profile sections
    │   └── adminService.js             # Services for all 10 Admin Management modules
    │
    ├── styles/
    │   ├── variables.css               # Design tokens, color palette, typography, radii & shadows
    │   └── global.css                  # Bootstrap 5 overrides, reset, dark theme & scrollbars
    │
    ├── components/
    │   ├── common/
    │   │   ├── Button.jsx & .module.css         # Button with variants (gold, primary, danger, ghost)
    │   │   ├── Card.jsx & .module.css           # Modern card container with glow & hover animations
    │   │   ├── Badge.jsx & .module.css          # Status badges (success, warning, error, gold, purple)
    │   │   ├── ProgressBar.jsx & .module.css    # Animated progress bar with gradients & tooltips
    │   │   ├── Skeleton.jsx & .module.css       # Shimmer loading skeleton component
    │   │   ├── EmptyState.jsx & .module.css     # Clean empty state with icon & actions
    │   │   ├── ErrorState.jsx & .module.css     # Accessible error state with retry button
    │   │   ├── Modal.jsx & .module.css          # Accessible dialog modal (Escape & click-outside close)
    │   │   ├── ConfirmDialog.jsx & .module.css  # Specialized confirmation dialog for admin actions
    │   │   ├── InputField.jsx                   # Accessible form text/number/email/password inputs
    │   │   ├── SelectField.jsx                  # Accessible dropdown select input
    │   │   ├── Form.module.css                  # Shared form element styling
    │   │   ├── Table.jsx & .module.css          # Responsive table with skeleton and empty fallbacks
    │   │   ├── Pagination.jsx & .module.css     # Accessible pagination controls
    │   │   ├── DevPreviewBanner.jsx & .css      # Top preview mode indicator with live toggle modal
    │   │   └── RouteGuards.jsx                  # ProtectedRoute & AdminProtectedRoute
    │   │
    │   └── profile/
    │       ├── ProfileHero.jsx & .module.css         # Section A: Avatar, Name, ID, Badges, Level, Copy
    │       ├── RewardAssets.jsx & .module.css        # Section B: 5 Reward asset cards with tooltips
    │       ├── LevelAchievements.jsx & .module.css   # Section C: Level status, progress, achievement badges
    │       ├── WithdrawalOverview.jsx & .module.css  # Section D: Payout history (pending strictly separated)
    │       ├── QuickActions.jsx & .module.css        # Section E: 7 Quick action buttons & modals
    │       ├── ReferralSnapshot.jsx & .module.css    # Section F: Referral code, copy link, milestone
    │       ├── RecentActivity.jsx & .module.css      # Section G: Filterable recent transaction stream
    │       ├── AccountSecurity.jsx & .module.css     # Section H: Identity, 2FA, session telemetry
    │       ├── ProfileEditModal.jsx                  # Personal information edit modal
    │       └── WithdrawalRequestModal.jsx            # Payout request submission modal
    │
    ├── layouts/
    │   ├── UserProfileLayout.jsx & .module.css       # Topbar, collapsible sidebar, anchor navigation
    │   └── AdminLayout.jsx & .module.css             # Admin sidebar, role indicator, server status
    │
    └── pages/
        ├── profile/
        │   └── UserProfilePage.jsx                   # Complete User Profile with all 8 modules
        ├── admin/
        │   ├── AdminLoginPage.jsx & .module.css      # Secure Admin Login with demo credentials panel
        │   ├── AdminDashboardPage.jsx & .module.css  # Dashboard metrics, distribution chart & logs
        │   ├── AdminUsersPage.jsx & .module.css      # User directory, filters, suspend/restore
        │   ├── AdminUserDetailsPage.jsx & .css       # Individual member dossier and moderation
        │   ├── AdminRewardsPage.jsx & .module.css    # Vault balances & authorized adjustment UI
        │   ├── AdminLevelsPage.jsx                   # Level tier configuration & multipliers
        │   ├── AdminAchievementsPage.jsx             # Achievement milestones & badge awards
        │   ├── AdminWithdrawalsPage.jsx              # Payout review, approval/rejection modal
        │   ├── AdminReferralsPage.jsx                # Referral attribution ledger & search
        │   ├── AdminActivityPage.jsx                 # Live event activity stream
        │   ├── AdminAuditLogsPage.jsx                # Read-only security audit trail
        │   └── AdminSettingsPage.jsx                 # Platform parameters & tokenomics rules
        └── common/
            ├── UnauthorizedPage.jsx                  # 403 Access Denied
            └── NotFoundPage.jsx                      # 404 Route Not Found
```

## 2. Design System Tokens & Color Palette

- **Primary Background:** `#161827` (Mandatory Deep Navy)
- **Secondary Background:** `#1E2235`
- **Card Background:** `#252A40`
- **Card Hover:** `#303650`
- **Input Background:** `#1B1E30`
- **Gold Accent:** `#F4C76A`
- **Silver Accent:** `#C7CEDB`
- **Soft Blue:** `#6EA8FE`
- **Purple Accent:** `#A78BFA`
- **Primary Text:** `#F8FAFC`
- **Secondary Text:** `#AAB4C8`
- **Success:** `#34D399`
- **Warning:** `#FBBF24`
- **Error:** `#F87171`
- **Borders:** `#353B55`
