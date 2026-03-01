# CLAUDE.md — Timeline Explorer

## Project Overview

An interactive educational web app where students explore a filterable chronological timeline of history events. Students submit events and cause-effect connections for teacher review; approved items appear on the shared timeline and events are archived to Google Sheets. Supports BCE dates, configurable time periods, dark mode, and per-section customization.

**Live site:** https://mr-munny.github.io/timeline-explorer

## Tech Stack

- **Frontend:** React 19 (Create React App) — JavaScript, no TypeScript
- **Backend:** Firebase Realtime Database + Firebase Authentication (Google OAuth)
- **Styling:** Inline CSS-in-JS (style objects in components, no CSS files)
- **Icons:** @iconify/react with @iconify-icons/mdi (Material Design Icons)
- **Deployment:** GitHub Pages via `gh-pages` package
- **Integration:** Google Sheets via Apps Script webhook

## Source Structure

```
src/
├── App.js                         # Main container — state, filtering, sorting, layout
├── index.js                       # Entry point, wraps App in AuthProvider + ThemeProvider
├── firebase.js                    # Firebase init, exports auth/db/provider/env vars
├── components/
│   ├── AddConnectionPanel.js      # Modal form for creating/editing cause-effect connections
│   ├── AddEventPanel.js           # Modal form for student event submission
│   ├── AdminPanel.js              # Teacher admin dropdown: periods, sections, fields, roster
│   ├── ConnectionLines.js         # SVG overlay drawing curved arcs between connected events
│   ├── ContributorSidebar.js      # Ranked leaderboard of student contributors
│   ├── EventCard.js               # Expandable card displaying a single event
│   ├── LoginScreen.js             # Google sign-in screen
│   ├── ModerationPanel.js         # Teacher review/approve/reject/edit queue (events + connections)
│   ├── SectionConfiguration.js    # AdminPanel sub-component: add/rename/delete sections
│   ├── SectionPicker.js           # Interstitial for students to self-select their class period
│   ├── StudentRoster.js           # AdminPanel sub-component: student list with reassign/remove
│   └── VisualTimeline.js          # Interactive era-band timeline visualization
├── contexts/
│   ├── AuthContext.js             # Auth state + role (teacher vs student) via Context API
│   └── ThemeContext.js            # Light/dark theme with localStorage persistence
├── services/
│   ├── database.js                # Firebase CRUD for events, connections, sections, settings
│   └── sheets.js                  # Google Sheets write-on-approve webhook
├── data/
│   ├── constants.js               # DEFAULT_PERIODS, PERIOD_COLORS, TAGS, SOURCE_TYPES, getPeriod()
│   └── seedEvents.js              # Pre-approved sample events for initial database seeding
└── utils/
    └── dateUtils.js               # Date formatting, comparison, and fractional year helpers
```

## Architecture

### State Management
- **AuthContext** (React Context) provides `user`, `isTeacher`, `login`, `logout` globally
- **ThemeContext** (React Context) provides `theme` tokens, `mode`, `toggleTheme`, and themed color helpers
- **App.js** owns all event/connection/settings state and filter/sort state using `useState`
- Firebase real-time listeners (`onValue`) push updates into component state automatically

### Data Flow
1. Google OAuth login → Firebase Auth → domain validation → AuthContext
2. Student selects section via SectionPicker → stored at `/studentSections/{uid}`
3. Firebase Realtime Database → `subscribeToEvents()` / `subscribeToConnections()` → state in App.js
4. Student submits event or connection → saved as `status: "pending"` → teacher sees in ModerationPanel
5. Teacher approves event → `status: "approved"` + `writeToSheet()` webhook fires (non-blocking)
6. Students can also propose edits to existing events (`editOf` field) or suggest connection deletions (`deleteOf` field)

### Roles
- **Teacher**: identified by `REACT_APP_TEACHER_EMAIL` env var. Can see all sections (`?section=all`), approve/reject/edit events and connections, manage sections/periods/settings, view student roster.
- **Student**: assigned to a section (self-selected on first login). Can view approved events, submit new events and connections, and propose edits.

### URL Parameters
- `?section=Period1` — selects the active class section (default: first section)
- `?section=all` — teacher-only view across all sections

### Per-Section Settings (Firebase)
Each section has independent settings stored at `/sectionSettings/{section}/`:
- **periods** — array of time period objects (label, era range, colors)
- **compellingQuestion** — `{ text, enabled }` hero banner above the timeline
- **timelineRange** — `{ start, end }` controlling the visual timeline year bounds
- **fieldConfig** — maps field names to `"mandatory" | "optional" | "hidden"`

Default templates are stored at `/defaultPeriods`, `/defaultCompellingQuestion`, `/defaultTimelineRange`, `/defaultFieldConfig` and applied when creating new sections.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values:

| Variable | Purpose |
|---|---|
| `REACT_APP_TEACHER_EMAIL` | Email address that grants teacher/admin role |
| `REACT_APP_SCHOOL_DOMAIN` | Allowed email domain for sign-in (e.g. `school.edu`) |
| `REACT_APP_SECTIONS` | Legacy; sections are now managed dynamically in Firebase via AdminPanel |
| `REACT_APP_APPS_SCRIPT_URL` | Deployed Google Apps Script URL for Sheets integration |
| `REACT_APP_ALLOW_ALL_DOMAINS` | Set to `"true"` to allow any email domain (useful for dev/testing) |

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
  editOf: string            // Optional, ID of original event when proposing an edit
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
  deleteOf: string          // Optional, ID of connection student wants deleted
}
```

### Time Periods (dynamic, stored in Firebase per-section)
Default periods are defined in `DEFAULT_PERIODS` (constants.js) and used as initial seeds. Teachers can add/rename/recolor/reorder/delete periods per section via AdminPanel.

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

`PERIOD_COLORS` in constants.js provides 8 color presets for new periods.

### Sections (stored at `/sections` in Firebase)
```js
[{ id: string, name: string }]
```
Teachers manage sections via AdminPanel > SectionConfiguration. Students self-select via SectionPicker, with assignments stored at `/studentSections/{uid}`.

## Firebase Database Paths

| Path | Data |
|---|---|
| `/events/{id}` | Event objects |
| `/connections/{id}` | Connection objects |
| `/sections` | Array of `{id, name}` section objects |
| `/studentSections/{uid}` | `{section, email, displayName, assignedAt, assignedBy}` |
| `/sectionSettings/{section}/periods` | Per-section time periods array |
| `/sectionSettings/{section}/compellingQuestion` | `{text, enabled}` |
| `/sectionSettings/{section}/timelineRange` | `{start, end}` |
| `/sectionSettings/{section}/fieldConfig` | Field visibility config object |
| `/defaultPeriods` | Default periods template |
| `/defaultCompellingQuestion` | Default compelling question template |
| `/defaultTimelineRange` | Default timeline range template |
| `/defaultFieldConfig` | Default field config template |

## Code Conventions

### Naming
- **Components:** PascalCase files and function names (`EventCard.js`, `export default function EventCard`)
- **Services/utilities:** camelCase files (`database.js`, `dateUtils.js`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_PERIODS`, `TAGS`, `SOURCE_TYPES`, `PERIOD_COLORS`)
- **Event handlers:** camelCase, descriptive (`handleApprove`, `switchSection`)

### Styling
- All styles are **inline style objects** — there are no CSS files or CSS-in-JS libraries
- Theme colors come from `ThemeContext` (`useTheme()` hook) — supports light and dark mode
- Fonts: `Newsreader` (serif, headlines/body), `Overpass Mono` (monospace, labels/metadata)
- Transitions: `all 0.15s` to `all 0.3s ease`
- A global `<style>` tag in App.js adds theme transition smoothing on `background-color`, `color`, and `border-color`

### Component Patterns
- **Container component:** App.js manages all state and passes props down
- **Presentational components:** EventCard, VisualTimeline, ContributorSidebar, LoginScreen
- **Modal pattern:** AddEventPanel, AddConnectionPanel, and ModerationPanel use fixed overlay with backdrop blur
- **Admin sub-components:** SectionConfiguration and StudentRoster render inside AdminPanel
- **Interstitial:** SectionPicker shown to students who haven't selected a section
- **Performance:** `useMemo` for filtered/sorted event lists, `useCallback` for stable handler references

### Error Handling
- Async Firebase operations use try/catch
- Google Sheets webhook is non-blocking (errors logged, not thrown)
- Auth errors surface via `authError` state in AuthContext

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
- The seed database feature (`seedDatabase`) is a one-time teacher action; seed events have `addedByUid: "seed"`
- Sections are managed dynamically in Firebase, not via env vars (the `REACT_APP_SECTIONS` env var is legacy)
- `readEvents` tracking in localStorage (`readEvents_{uid}`) marks which events a student has expanded
- Theme preference persists in localStorage under key `timeline-explorer-theme` and respects `prefers-color-scheme`