# CLAUDE.md — Timeline Explorer

## Project Overview

An interactive educational web app where students explore a filterable chronological timeline of history events. Students submit events and cause-effect connections for teacher review; approved items appear on the shared timeline and events are archived to Google Sheets. Supports BCE dates, configurable time periods, dark mode, per-section customization, multi-teacher administration, an interactive world map view, AI auto-moderation, hidden Easter egg games, and a teacher-driven bounty board system.

**Live site:** https://mr-munny.github.io/timeline-explorer

## Tech Stack

- **Frontend:** React 19 (Create React App) — JavaScript, no TypeScript
- **Backend:** Firebase Realtime Database + Firebase Authentication (Google OAuth)
- **Styling:** Inline CSS-in-JS (style objects in components, no CSS files)
- **Icons:** @iconify/react with @iconify-icons/mdi (Material Design Icons)
- **Maps:** MapLibre GL JS via react-map-gl
- **Deployment:** GitHub Pages via `gh-pages` package
- **Integrations:** Google Sheets via Apps Script webhook; AI auto-moderator via Power Automate webhook; AI similarity/duplicate checker via Power Automate webhook

## Source Structure

```
src/
├── App.js                         # Main container — state, filtering, sorting, layout
├── index.js                       # Entry point, wraps App in AuthProvider + ThemeProvider
├── firebase.js                    # Firebase init, exports auth/db/provider/env vars
├── components/
│   ├── AddConnectionPanel.js      # Modal form for creating/editing cause-effect connections
│   ├── AddEventPanel.js           # Modal form for student event submission
│   ├── BountyBoard.js             # Student-facing modal listing open/completed bounties
│   ├── BountyEditor.js            # Teacher bounty management in admin section settings
│   ├── AdminSectionSettings.js    # Per-section settings: periods, range, question, fields, palette, roster
│   ├── AdminSidebar.js            # Tab navigation for admin views (moderation/settings/teachers)
│   ├── AdminView.js               # Top-level admin container with sidebar + content panels
│   ├── AwaitingRevisionSection.js # Collapsible section for student revisions awaiting re-review
│   ├── CompellingQuestionEditor.js # Textarea + visibility toggle for compelling question
│   ├── CompellingQuestionHero.js  # Hero banner displaying the compelling question
│   ├── ConnectionItem.js          # Single connection display with scroll-to-target
│   ├── ConnectionLines.js         # SVG overlay drawing curved arcs between connected events
│   ├── ContributorSidebar.js      # Ranked leaderboard of student contributors
│   ├── CopySettingsDialog.js      # Dialog for copying section settings to other sections
│   ├── EasterEggLinkDialog.js     # Dialog to link an Easter egg game to an event
│   ├── EventCard.js               # Expandable card displaying a single event
│   ├── EventConnections.js        # Causes + effects list using ConnectionItem
│   ├── EventList.js               # Filterable/sortable event list with sidebar and connections
│   ├── FeedbackBanner.js          # Amber alert banner for teacher feedback on submissions
│   ├── FieldConfigEditor.js       # Per-field mandatory/optional/hidden toggles
│   ├── FilterBar.js               # Search, period/tag filters, sort, view mode toggle
│   ├── IconButton.js              # Reusable icon button with hover states and sizes
│   ├── LoginScreen.js             # Google sign-in screen
│   ├── MapEventPopup.js           # Popup content for map markers
│   ├── ModalShell.js              # Standardized modal wrapper with focus trap + backdrop blur
│   ├── ModerationPanel.js         # Teacher review/approve/reject/edit queue (events + connections)
│   ├── PaletteSelector.js         # Radio-style color palette picker
│   ├── PendingConnectionCard.js   # Individual pending connection card for moderation
│   ├── PendingEventCard.js        # Individual pending event card for moderation
│   ├── RevisionPanel.js           # Modal for viewing revision/diff history
│   ├── SectionPicker.js           # Interstitial for students to self-select their class period
│   ├── StudentRoster.js           # Student list with reassign/remove actions
│   ├── TeacherManagement.js       # Super admin: invite teachers, manage join codes, roster
│   ├── TimePeriodsEditor.js       # Inline editor for period label, era range, and colors
│   ├── TimeRangeSlider.js         # Dual-thumb range slider for year bounds
│   ├── TimelineHeader.js          # Header bar with pending/revision badges, section selector
│   ├── TimelineRangeEditor.js     # Start/end year inputs with decade snapping
│   ├── VisualTimeline.js          # Interactive Gantt-style era-band timeline visualization
│   └── WorldMapView.js            # Interactive MapLibre GL map with event markers
├── contexts/
│   ├── AuthContext.js             # Auth state, roles (student/teacher/super admin), impersonation
│   └── ThemeContext.js            # Light/dark theme with localStorage persistence
├── easterEggs/
│   ├── EasterEggShell.js          # Lazy-loaded modal wrapper for Easter egg games
│   ├── registry.js                # Registry of available Easter eggs by ID
│   └── games/
│       └── WWIDecisions.js        # Interactive WWI branching-scenario decision game
├── hooks/
│   ├── useConnectionHandlers.js   # Connection CRUD + suggest-delete proposals
│   ├── useEventHandlers.js        # Event CRUD + auto-moderator integration + range auto-expansion
│   ├── useFirebaseSubscriptions.js # Central Firebase real-time subscription orchestration
│   ├── useFocusTrap.js            # Modal focus management (Tab/Escape key handling)
│   └── useReadEvents.js           # localStorage-persisted tracking of read/unread events
├── services/
│   ├── autoModerator.js           # Power Automate webhook for AI content review
│   ├── database.js                # Firebase CRUD for events, connections, sections, teachers, settings
│   ├── sheets.js                  # Google Sheets write-on-approve webhook
│   └── similarityChecker.js       # Power Automate webhook for AI duplicate/similarity detection
├── data/
│   ├── constants.js               # COLOR_PALETTES, DEFAULT_PERIODS, TAGS, SOURCE_TYPES, getPeriod()
│   ├── regionCentroids.js         # Region name → [lat, lon] mapping for map markers
│   └── seedEvents.js              # Pre-approved sample events for demo seeding
└── utils/
    ├── dateUtils.js               # Date formatting, comparison, and fractional year helpers
    └── diffUtils.js               # Word-level diff for revision comparison
```

## Architecture

### State Management
- **AuthContext** (React Context) provides `user`, `isTeacher`, `isSuperAdmin`, `teacherData`, `impersonatingTeacher`, `userSection`, `login`, `logout`
- **ThemeContext** (React Context) provides `theme` tokens, `mode`, `toggleTheme`, and themed color helpers
- **App.js** uses `useReducer` for modal state and `useState` for event/connection/settings/filter state
- **Custom hooks** (`useFirebaseSubscriptions`, `useEventHandlers`, `useConnectionHandlers`, `useReadEvents`) extract logic from App.js
- Firebase real-time listeners (`onValue`) push updates into component state automatically

### Data Flow
1. Google OAuth login → Firebase Auth → domain validation → AuthContext
2. Teacher record checked in `/teachers/{uid}` (or invite auto-promoted) → sets `isTeacher`/`isSuperAdmin`
3. Student selects section via SectionPicker → stored at `/studentSections/{uid}`
4. Firebase Realtime Database → `useFirebaseSubscriptions` hook → state in App.js
5. Student submits event or connection → saved as `status: "pending"` → optional AI auto-moderator review → teacher sees in ModerationPanel
6. Teacher approves event → `status: "approved"` + `writeToSheet()` webhook fires (non-blocking)
7. Teacher can request revision → student sees feedback banner → resubmits → teacher re-reviews
8. Students can also propose edits to existing events (`editOf` field) or suggest connection deletions (`deleteOf` field)

### Roles
- **Super Admin**: the initial teacher identified by `REACT_APP_TEACHER_EMAIL` env var. Can manage other teachers, impersonate teacher views, toggle AI moderator visibility.
- **Teacher**: invited via join code or email. Owns assigned sections, can approve/reject/edit events and connections, manage section settings, view student roster.
- **Student**: assigned to a section (self-selected on first login). Can view approved events, submit new events and connections, propose edits, and revise rejected submissions.

### URL Parameters
- `?section=Period1` — selects the active class section (default: first section)

### Per-Section Settings (Firebase)
Each section has independent settings stored at `/sectionSettings/{section}/`:
- **periods** — array of time period objects (label, era range, colors)
- **paletteId** — selected color palette ID (`"classic"`, `"earth"`, `"jewel"`, `"ocean"`)
- **compellingQuestion** — `{ text, enabled }` hero banner above the timeline
- **timelineRange** — `{ start, end }` controlling the visual timeline year bounds
- **fieldConfig** — maps field names to `"mandatory" | "optional" | "hidden"`

Default templates are stored at `/defaultPeriods`, `/defaultCompellingQuestion`, `/defaultTimelineRange`, `/defaultFieldConfig` and applied when creating new sections.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values:

| Variable | Purpose |
|---|---|
| `REACT_APP_TEACHER_EMAIL` | Email address that grants super admin role |
| `REACT_APP_SCHOOL_DOMAIN` | Allowed email domain for sign-in (e.g. `school.edu`) |
| `REACT_APP_SECTIONS` | Legacy; sections are now managed dynamically in Firebase via AdminPanel |
| `REACT_APP_APPS_SCRIPT_URL` | Deployed Google Apps Script URL for Sheets integration |
| `REACT_APP_ALLOW_ALL_DOMAINS` | Set to `"true"` to allow any email domain (useful for dev/testing) |
| `REACT_APP_AUTOMOD_WEBHOOK_URL` | Power Automate webhook URL for AI auto-moderator |
| `REACT_APP_SIMILARITY_WEBHOOK_URL` | Power Automate webhook URL for AI similarity/duplicate detection |

## Key Data Models

### Event (stored at `/events/{id}` in Firebase)
```js
{
  title: string,            // Required
  year: number,             // Any integer, including negative for BCE
  month: number,            // Optional, 1–12
  day: number,              // Optional, 1–31
  endYear: number,          // Optional, for date ranges
  endMonth: number,         // Optional
  endDay: number,           // Optional
  period: string,           // Dynamic period ID from section's period list
  tags: string[],           // At least 1 from TAGS constant
  sourceType: string,       // "primary" or "secondary"
  description: string,      // Required
  sourceNote: string,       // Citation / source info
  sourceUrl: string,        // Optional URL to source
  imageUrl: string,         // Optional image URL
  region: string,           // Optional geographic context
  section: string,          // Class section code
  addedBy: string,          // Display name
  addedByEmail: string,     // Google account email
  addedByUid: string,       // Firebase UID (or "seed" for seed data)
  status: "pending" | "approved",
  dateAdded: string,        // ISO 8601
  editHistory: array,       // Optional [{name, email, date, changes}]
  editOf: string,           // Optional, ID of original event when proposing an edit
  bountyId: string,         // Optional, ID of bounty this event fulfills
  aiReview: { score, reason } // Optional, result from AI auto-moderator
  similarityReport: { noveltyScore, mostSimilarEventId, mostSimilarEventTitle, similarity, reasoning } // Optional, result from AI similarity checker
}
```

### Connection (stored at `/connections/{id}` in Firebase)
```js
{
  causeEventId: string,     // ID of the cause event
  effectEventId: string,    // ID of the effect event
  description: string,      // Explanation of the cause-effect relationship
  status: "pending" | "approved",
  addedBy: string,
  addedByEmail: string,
  addedByUid: string,
  section: string,
  dateAdded: string,        // ISO 8601
  editHistory: array,       // Optional [{name, email, date, changes}]
  editOf: string,           // Optional, ID of original connection (edit proposal)
  deleteOf: string,         // Optional, ID of connection student wants deleted
  bountyId: string          // Optional, ID of bounty this connection fulfills
}
```

### Bounty (stored at `/bounties/{id}` in Firebase)
```js
{
  type: "event" | "connection", // What kind of submission is requested
  title: string,                // Bounty display title
  description: string,          // Teacher instructions/context
  hints: {                      // Pre-fill hints shown as placeholders
    title: string,              // For event bounties
    year: string,
    period: string,
    description: string,
    tags: string[],
    region: string,
    causeEventId: string,       // For connection bounties
    effectEventId: string,
    connectionDescription: string,
  },
  section: string,
  createdBy: string,            // Teacher display name
  createdByUid: string,
  createdAt: string,            // ISO 8601
  status: "open" | "completed",
  completedBy: string,          // Student name (set on approval)
  completedByUid: string,
  completedAt: string,
}
```

### Teacher Record (stored at `/teachers/{uid}` in Firebase)
```js
{
  email: string,
  displayName: string,
  sections: string[],       // Owned section IDs
  isSuperAdmin: boolean,
  joinCode: string,         // For inviting other teachers
  autoModeratorEnabled: boolean, // Per-teacher AI mod toggle
  createdAt: string,        // ISO 8601
  joinedVia: "invite" | "env-var",
  promotedBy: string        // UID of inviting teacher (if invited)
}
```

### Time Periods (dynamic, stored in Firebase per-section)
Default periods are defined in `DEFAULT_PERIODS` (constants.js) and used as initial seeds. Teachers can add/rename/recolor/reorder/delete periods per section via AdminSectionSettings.

Each period object:
```js
{
  id: string,               // e.g. "wwi", "depression"
  label: string,            // Display name
  era: [startYear, endYear],
  color: string,            // Theme color hex
  bg: string,               // Background color hex
  accent: string            // Accent color hex
}
```

`COLOR_PALETTES` in constants.js provides 4 named palettes (classic, earth, jewel, ocean) with 8 WCAG AA color presets each.

### Sections (stored at `/sections` in Firebase)
```js
[{ id: string, name: string }]
```
Teachers manage sections via AdminSectionSettings. Students self-select via SectionPicker, with assignments stored at `/studentSections/{uid}`.

## Firebase Database Paths

| Path | Data |
|---|---|
| `/events/{id}` | Event objects |
| `/connections/{id}` | Connection objects |
| `/sections` | Array of `{id, name}` section objects |
| `/studentSections/{uid}` | `{section, email, displayName, teacherUid, assignedAt, assignedBy}` |
| `/teachers/{uid}` | Teacher record (email, sections, joinCode, etc.) |
| `/teacherInvites/{emailKey}` | Pending teacher invitations |
| `/sectionSettings/{section}/periods` | Per-section time periods array |
| `/sectionSettings/{section}/paletteId` | Selected color palette ID |
| `/sectionSettings/{section}/compellingQuestion` | `{text, enabled}` |
| `/sectionSettings/{section}/timelineRange` | `{start, end}` |
| `/sectionSettings/{section}/fieldConfig` | Field visibility config object |
| `/events/{id}/similarityReport` | AI similarity/duplicate analysis result |
| `/settings/autoModerator` | AI moderator global config (visible, per-teacher toggles) |
| `/easterEggs/{eventId}` | Easter egg metadata linked to events |
| `/easterEggDiscoveries/{eventId}/{uid}` | Per-user Easter egg discovery records |
| `/bounties/{id}` | Bounty objects (per-section, teacher-posted) |
| `/defaultPeriods` | Default periods template |
| `/defaultCompellingQuestion` | Default compelling question template |
| `/defaultTimelineRange` | Default timeline range template |
| `/defaultFieldConfig` | Default field config template |

## Code Conventions

### Naming
- **Components:** PascalCase files and function names (`EventCard.js`, `export default function EventCard`)
- **Services/utilities:** camelCase files (`database.js`, `dateUtils.js`)
- **Constants:** UPPER_SNAKE_CASE (`COLOR_PALETTES`, `DEFAULT_PERIODS`, `TAGS`, `SOURCE_TYPES`)
- **Hooks:** camelCase with `use` prefix (`useFirebaseSubscriptions.js`)
- **Event handlers:** camelCase, descriptive (`handleApprove`, `switchSection`)

### Styling
- All styles are **inline style objects** — there are no CSS files or CSS-in-JS libraries
- Theme colors come from `ThemeContext` (`useTheme()` hook) — supports light and dark mode
- Rem-based design tokens for consistent spacing and sizing
- All color palettes verified to meet WCAG AA 4.5:1 contrast ratio
- Fonts: `Newsreader` (serif, headlines/body), `Overpass Mono` (monospace, labels/metadata)
- Transitions: `all 0.15s` to `all 0.3s ease`
- A global `<style>` tag in App.js adds theme transition smoothing on `background-color`, `color`, and `border-color`

### Component Patterns
- **Container component:** App.js manages all state and passes props down
- **Custom hooks:** `useFirebaseSubscriptions`, `useEventHandlers`, `useConnectionHandlers`, `useReadEvents` extract logic from App.js
- **Presentational components:** EventCard, VisualTimeline, ContributorSidebar, LoginScreen, WorldMapView
- **Modal pattern:** ModalShell provides standardized overlay with focus trap, backdrop blur, and close handling; used by AddEventPanel, AddConnectionPanel, ModerationPanel, RevisionPanel, etc.
- **Admin views:** AdminView contains AdminSidebar for tab navigation, with AdminSectionSettings, ModerationPanel, and TeacherManagement as content panels
- **Interstitial:** SectionPicker shown to students who haven't selected a section
- **Performance:** `useMemo` for filtered/sorted event lists, `useCallback` for stable handler references

### Error Handling
- Async Firebase operations use try/catch
- Google Sheets and AI auto-moderator webhooks are non-blocking (errors logged, not thrown)
- Auth errors surface via `authError` state in AuthContext
- Teacher invite cleanup failures don't cascade into role assignment failures

## Linting & Formatting

- ESLint: default Create React App config (`react-app` + `react-app/jest` presets) — configured in package.json
- No Prettier or custom ESLint config file
- No Husky, lint-staged, or pre-commit hooks

## Testing

- **Framework:** Jest + React Testing Library (installed, configured via react-scripts)
- **Status:** No test files exist yet
- **Run:** `npm test` (interactive watch mode)

## Deployment

1. `npm run deploy` triggers `predeploy` (build) then pushes `/build` to gh-pages branch
2. GitHub Pages serves from gh-pages branch at the homepage URL
3. No CI/CD pipelines (GitHub Actions, etc.) are configured

## Git Conventions

- Branch prefixes: feature/, fix/, refactor/, chore/, docs/, test/
- Format: type/short-description (e.g., feature/admin-panel)
- Use conventional commits: feat, fix, refactor, chore, docs, test

## Things to Know

- Firebase config (API key, project ID) is committed in `firebase.js` — this is intentional for a client-side Firebase app with security rules on the backend
- `HANDOFF.md` is gitignored (contains PII-sensitive local documentation)
- `.claude/` directory is gitignored (local tool config)
- The demo seed/wipe feature in AdminSectionSettings lets teachers populate or clear section data for training purposes
- Sections are managed dynamically in Firebase, not via env vars (the `REACT_APP_SECTIONS` env var is legacy)
- `readEvents` tracking in localStorage (`readEvents_{uid}`) marks which events a student has expanded
- Theme preference persists in localStorage under key `timeline-explorer-theme` and respects `prefers-color-scheme`
- The "All Sections" cross-section view has been removed; teachers see only their assigned sections
- Multi-teacher support uses join codes and email invites; the env var teacher is automatically the super admin
- AI auto-moderator is a per-teacher opt-in setting; super admin controls global visibility of the feature
- Easter eggs are linked to specific events and tracked per-user in Firebase
- Bounty board is per-section: teachers post bounties in AdminSectionSettings, students see them via a header button, and completed bounties show as "kill counter" target icons in the leaderboard
