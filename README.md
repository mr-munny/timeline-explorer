# Timeline Explorer — Historian's Workshop

An interactive educational web app where students explore a filterable chronological timeline of 20th-century history events. Students submit events for teacher review; approved events appear on the shared class timeline and are archived to Google Sheets.

**Live site:** https://mr-munny.github.io/timeline-explorer

## Features

- **Interactive timeline** with era bands spanning WWI, the Great Depression, WWII, and the Cold War
- **Filter & search** by unit, tags (Political, Economic, Military, etc.), source type, and free text
- **Student submissions** — students propose new events that enter a moderation queue
- **Teacher moderation** — approve, reject, or edit submissions before they go live
- **Contributor leaderboard** — ranked sidebar showing top student contributors
- **Google Sheets archival** — approved events are automatically logged to a spreadsheet
- **Section support** — multiple class periods with isolated event pools

## Tech Stack

- **React 19** (Create React App) — JavaScript, no TypeScript
- **Firebase** — Realtime Database + Authentication (Google OAuth)
- **GitHub Pages** — deployment via `gh-pages`
- **Google Sheets** — Apps Script webhook for archival

## Getting Started

### Prerequisites

- Node.js (v16+)
- A Firebase project with Realtime Database and Google Auth enabled
- A Google Apps Script deployment for Sheets integration (optional)

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
   | `REACT_APP_TEACHER_EMAIL` | Email that grants teacher/admin role |
   | `REACT_APP_SCHOOL_DOMAIN` | Allowed email domain (e.g. `school.edu`) |
   | `REACT_APP_SECTIONS` | Comma-separated section names (e.g. `Period1,Period2`) |
   | `REACT_APP_APPS_SCRIPT_URL` | Google Apps Script URL for Sheets integration |

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
├── App.js                  # Main container — state, filtering, sorting, layout
├── index.js                # Entry point, wraps App in AuthProvider
├── firebase.js             # Firebase config and initialization
├── components/
│   ├── AddEventPanel.js    # Student event submission modal
│   ├── ContributorSidebar.js
│   ├── EventCard.js        # Expandable event display card
│   ├── LoginScreen.js      # Google sign-in
│   ├── ModerationPanel.js  # Teacher review queue
│   └── VisualTimeline.js   # Era-band timeline visualization
├── contexts/
│   └── AuthContext.js      # Auth state + role via Context API
├── services/
│   ├── database.js         # Firebase CRUD operations
│   └── sheets.js           # Google Sheets webhook
└── data/
    ├── constants.js        # Units, tags, source types
    └── seedEvents.js       # 25 sample events for initial seeding
```

## URL Parameters

- `?section=Period1` — select a class section (default: Period1)
- `?section=all` — teacher-only cross-section view
