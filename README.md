# Timeline Explorer

An interactive educational web app where students explore a filterable chronological timeline of history events. Students submit events and cause-effect connections for teacher review; approved items appear on the shared class timeline and are archived to Google Sheets.

**Live site:** https://mr-munny.github.io/timeline-explorer

## Features

- **Interactive timeline** with Gantt-style era bands, tooltips, and visual event markers
- **World map view** with interactive MapLibre GL map showing events by region
- **Filter & search** by period, tags (Political, Economic, Military, etc.), source type, and free text
- **Cause-effect connections** between events, displayed as SVG arcs on the timeline
- **Student submissions** — students propose new events and connections that enter a moderation queue
- **Needs-revision workflow** — teachers can request changes; students see feedback and resubmit
- **Teacher moderation** — approve, reject, edit, or request revision on submissions
- **Multi-teacher support** — invite additional teachers via join codes or email; per-teacher section ownership
- **AI auto-moderator** — optional Power Automate webhook for automated content pre-screening
- **Per-section customization** — independent time periods, color palettes, compelling question, field visibility, and timeline range per class section
- **Contributor leaderboard** — ranked sidebar showing top student contributors
- **Google Sheets archival** — approved events are automatically logged to a spreadsheet
- **Dark mode** — light/dark theme with system preference detection
- **Easter eggs** — hidden interactive games linked to events (e.g., WWI Decisions branching scenario)
- **Accessibility** — WCAG AA color contrast, focus traps in modals, semantic HTML

## Tech Stack

- **React 19** (Create React App) — JavaScript, no TypeScript
- **Firebase** — Realtime Database + Authentication (Google OAuth)
- **MapLibre GL JS** — Interactive map rendering via react-map-gl
- **GitHub Pages** — deployment via `gh-pages`
- **Google Sheets** — Apps Script webhook for archival
- **Power Automate** — Optional AI auto-moderator webhook

## Getting Started

### Prerequisites

- Node.js (v16+)
- A Firebase project with Realtime Database and Google Auth enabled
- A Google Apps Script deployment for Sheets integration (optional)
- A Power Automate flow for AI auto-moderation (optional)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mr-munny/timeline-explorer.git
   cd timeline-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file from the example:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your environment variables in `.env.local`:
   | Variable | Purpose |
   |---|---|
   | `REACT_APP_TEACHER_EMAIL` | Email that grants super admin role |
   | `REACT_APP_SCHOOL_DOMAIN` | Allowed email domain (e.g. `school.edu`) |
   | `REACT_APP_APPS_SCRIPT_URL` | Google Apps Script URL for Sheets integration |
   | `REACT_APP_ALLOW_ALL_DOMAINS` | Set to `"true"` to allow any email domain (dev/testing) |
   | `REACT_APP_AUTOMOD_WEBHOOK_URL` | Power Automate webhook URL for AI auto-moderator (optional) |

5. Start the dev server:
   ```bash
   npm start
   ```

### Deployment

```bash
npm run deploy
```

This builds the app and pushes to the `gh-pages` branch, which GitHub Pages serves automatically.

## Project Structure

```
src/
├── App.js                      # Main container — state, filtering, sorting, layout
├── index.js                    # Entry point, wraps App in AuthProvider + ThemeProvider
├── firebase.js                 # Firebase config and initialization
├── components/
│   ├── AddConnectionPanel.js   # Cause-effect connection submission modal
│   ├── AddEventPanel.js        # Student event submission modal
│   ├── AdminView.js            # Admin container with sidebar navigation
│   ├── AdminSectionSettings.js # Per-section settings (periods, palette, fields, etc.)
│   ├── EventCard.js            # Expandable event display card
│   ├── EventList.js            # Filterable/sortable event list with sidebar
│   ├── FilterBar.js            # Search, filters, sort, and view mode controls
│   ├── LoginScreen.js          # Google sign-in
│   ├── ModerationPanel.js      # Teacher review queue for pending submissions
│   ├── TeacherManagement.js    # Multi-teacher invite and roster management
│   ├── VisualTimeline.js       # Gantt-style era-band timeline visualization
│   ├── WorldMapView.js         # Interactive map with event markers
│   └── ...                     # Additional UI components (see CLAUDE.md for full list)
├── contexts/
│   ├── AuthContext.js           # Auth state, roles, impersonation via Context API
│   └── ThemeContext.js          # Light/dark theme with localStorage persistence
├── easterEggs/                  # Easter egg games framework
├── hooks/                       # Custom hooks (Firebase subscriptions, event/connection handlers)
├── services/
│   ├── autoModerator.js         # AI auto-moderator webhook integration
│   ├── database.js              # Firebase CRUD operations
│   └── sheets.js                # Google Sheets webhook
├── data/
│   ├── constants.js             # Color palettes, periods, tags, source types
│   ├── regionCentroids.js       # Region → coordinates mapping for map
│   └── seedEvents.js            # Sample events for demo seeding
└── utils/
    ├── dateUtils.js             # Date formatting and comparison helpers
    └── diffUtils.js             # Word-level diff for revision comparison
```

## URL Parameters

- `?section=Period1` — select a class section (default: first section)
