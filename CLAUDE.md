# CLAUDE.md — Timeline Explorer (Historian's Workshop)

## Project Overview

An interactive educational web app where students explore a filterable chronological timeline of 20th-century history events (WWI through the Cold War). Students submit events for teacher review; approved events appear on the shared timeline and are archived to Google Sheets.

**Live site:** https://mr-munny.github.io/timeline-explorer

## Tech Stack

- **Frontend:** React 19 (Create React App) — JavaScript, no TypeScript
- **Backend:** Firebase Realtime Database + Firebase Authentication (Google OAuth)
- **Styling:** Inline CSS-in-JS (style objects in components, no CSS files)
- **Deployment:** GitHub Pages via `gh-pages` package
- **Integration:** Google Sheets via Apps Script webhook

## Source Structure

```
src/
├── App.js                     # Main container — state, filtering, sorting, layout
├── index.js                   # Entry point, wraps App in AuthProvider
├── firebase.js                # Firebase init, exports auth/db/provider/env vars
├── components/
│   ├── AddEventPanel.js       # Modal form for student event submission
│   ├── ContributorSidebar.js  # Ranked leaderboard of student contributors
│   ├── EventCard.js           # Expandable card displaying a single event
│   ├── LoginScreen.js         # Google sign-in screen
│   ├── ModerationPanel.js     # Teacher review/approve/reject/edit queue
│   └── VisualTimeline.js      # Interactive era-band timeline visualization
├── contexts/
│   └── AuthContext.js         # Auth state + role (teacher vs student) via Context API
├── services/
│   ├── database.js            # Firebase CRUD: subscribe, submit, approve, reject, update, seed
│   └── sheets.js              # Google Sheets write-on-approve webhook
├── data/
│   ├── constants.js           # UNITS, TAGS, SOURCE_TYPES, getUnit()
│   └── seedEvents.js          # 25 pre-approved sample events for initial database seeding
```

## Architecture

### State Management
- **AuthContext** (React Context) provides `user`, `isTeacher`, `login`, `logout` globally
- **App.js** owns all event state and filter/sort state using `useState`
- Firebase real-time listeners (`onValue`) push updates into component state automatically

### Data Flow
1. Google OAuth login → Firebase Auth → domain validation → AuthContext
2. Firebase Realtime Database → `subscribeToEvents()` listener → `allEvents` state in App.js
3. Student submits event → saved as `status: "pending"` → teacher sees in ModerationPanel
4. Teacher approves → `status: "approved"` + `writeToSheet()` webhook fires (non-blocking)

### Roles
- **Teacher**: identified by `REACT_APP_TEACHER_EMAIL` env var. Can see all sections (`?section=all`), approve/reject/edit events, seed the database.
- **Student**: restricted to their section. Can view approved events and submit new ones.

### URL Parameters
- `?section=Period1` — selects the active class section (default: Period1)
- `?section=all` — teacher-only view across all sections

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values:

| Variable | Purpose |
|---|---|
| `REACT_APP_TEACHER_EMAIL` | Email address that grants teacher/admin role |
| `REACT_APP_SCHOOL_DOMAIN` | Allowed email domain for sign-in (e.g. `school.edu`) |
| `REACT_APP_SECTIONS` | Comma-separated section names (e.g. `Period1,Period2,Period3`) |
| `REACT_APP_APPS_SCRIPT_URL` | Deployed Google Apps Script URL for Sheets integration |

## Key Data Models

### Event (stored at `/events/{id}` in Firebase)
```js
{
  title: string,            // Required
  year: number,             // 1900–2000
  unit: string,             // "wwi" | "depression" | "wwii" | "coldwar"
  tags: string[],           // At least 1 from TAGS constant
  sourceType: string,       // "Primary" or "Secondary"
  description: string,      // Required, 2-3+ sentences
  sourceNote: string,       // Citation / source info
  region: string,           // Optional geographic context
  section: string,          // Class section code
  addedBy: string,          // Display name
  addedByEmail: string,     // Google account email
  addedByUid: string,       // Firebase UID (or "seed" for seed data)
  status: "pending" | "approved",
  dateAdded: string         // ISO 8601
}
```

### Historical Units (constants.js)
| ID | Label | Era | Theme Color |
|---|---|---|---|
| `wwi` | World War I | 1914–1920 | #991B1B (red) |
| `depression` | Great Depression | 1929–1941 | #92400E (orange) |
| `wwii` | World War II | 1939–1945 | #1E40AF (blue) |
| `coldwar` | Cold War | 1945–1991 | #5B21B6 (purple) |

## Code Conventions

### Naming
- **Components:** PascalCase files and function names (`EventCard.js`, `export default function EventCard`)
- **Services/utilities:** camelCase files (`database.js`, `sheets.js`)
- **Constants:** UPPER_SNAKE_CASE (`UNITS`, `TAGS`, `SOURCE_TYPES`)
- **Event handlers:** camelCase, descriptive (`handleApprove`, `switchSection`)

### Styling
- All styles are **inline style objects** — there are no CSS files or CSS-in-JS libraries
- Fonts: `Newsreader` (serif, headlines/body), `Overpass Mono` (monospace, labels/metadata)
- Transitions: `all 0.15s` to `all 0.3s ease`
- Color palette anchored around dark (#18181B), cream (#F7F7F5), amber accent (#F59E0B), and per-unit theme colors

### Component Patterns
- **Container component:** App.js manages all state and passes props down
- **Presentational components:** EventCard, VisualTimeline, ContributorSidebar, LoginScreen
- **Modal pattern:** AddEventPanel and ModerationPanel use fixed overlay with backdrop blur
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
- Year validation is 1900–2000 on the client side (AddEventPanel form)
