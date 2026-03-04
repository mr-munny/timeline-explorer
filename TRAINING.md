# Timeline Explorer — Training Guide

A walkthrough script for training colleagues on using and managing the Timeline Explorer app. This guide is structured as a live demo you can deliver in roughly 30–40 minutes, broken into sections you can pause between or skip as needed.

---

## Before You Begin

### What to have ready

- The app open in a browser tab: https://mr-munny.github.io/timeline-explorer
- A second browser or incognito window for demoing the student view
- Access to the teacher account (the Google account matching `REACT_APP_TEACHER_EMAIL`)
- A student-domain Google account to demonstrate submissions (any `@school.edu` account works)

### Setting the stage

> "Timeline Explorer is a shared class timeline where students research and submit historical events. You review what they submit, and approved events become part of the class's collective timeline. Everything stays synced in real time — when you approve something, every student sees it immediately."

---

## Part 1: The Login Experience (3 min)

Start from a logged-out state so participants can see what students encounter first.

### What to show

The login screen displays a centered card with the heading **"Timeline Explorer"** under a small amber badge reading **HISTORIAN'S WORKSHOP**. Below the title it says *"Sign in with your school account to continue"* and a single **Sign in with Google** button.

At the bottom, a note reads *"Requires an @school.edu account"* — this is pulled from the environment config, not hardcoded.

### Talking points

- **Domain lock**: Only accounts on your school domain can sign in. If someone tries a personal Gmail, they'll get a red error message and be signed out automatically. No one outside the school can access the app.
- **Role detection**: The app checks the signed-in email against one configured teacher email. That's the only thing that separates a teacher from a student — no manual role assignment, no admin panel. If your email matches, you're the teacher. Everyone else is a student.
- **Sign in now** with the teacher account to proceed with the demo.

---

## Part 2: First Launch & Seeding the Database (3 min)

> Skip this section if the database already has events in it. This only applies the very first time the app is set up for a new class.

### What to show

When the teacher logs in to a fresh, empty database, a purple **Seed Database** button appears in the header. Clicking it opens a confirmation prompt:

> "Seed the database with 25 sample events? Only do this once."

After confirming, 25 pre-written historical events covering WWI, the Great Depression, WWII, and the Cold War are loaded into the timeline. They appear immediately.

### Talking points

- **One-time action**: The seed button only appears when the database is empty. Once you seed, the button disappears permanently. These events give students something to explore on day one before anyone has submitted anything.
- **All seed events are pre-approved**: They show up on the timeline right away — they don't go through the moderation queue.
- **Seed events are credited to "Teacher"**: Students will see these attributed to you, not to other students.

---

## Part 3: The Teacher's Dashboard (5 min)

Now that there are events loaded, walk through what the teacher sees.

### The header

Point out these elements left to right:

- **HISTORIAN'S WORKSHOP** badge (amber) and **Timeline Explorer** title
- **Teacher View** badge (green) — this only appears for the teacher account
- **Stats line**: shows event count, number of student contributors, and unit count
- **Section switcher**: a row of buttons — **All Sections** plus one per class period (e.g., Period1, Period2). The active section has an amber highlight. Students don't see this; they're locked to their own section.

On the right side of the header:

- **Review (N)** button (red) — appears only when there are pending student submissions. The number is the queue count.
- **+ Add Event** button (amber) — yes, teachers can submit events too
- **Sign Out** button

### The visual timeline

Below the header is a horizontal timeline bar with colored bands representing the four historical units:

| Color | Unit |
|-------|------|
| Red | World War I (1914–1920) |
| Orange | Great Depression (1929–1941) |
| Blue | World War II (1939–1945) |
| Purple | Cold War (1945–1991) |

Small dots on the timeline represent individual events, positioned by year. Hovering a dot shows the event's year and title.

**Key interaction**: Clicking an era band filters the event list to that unit. This is a quick way to narrow down the view — worth pointing out because it's easy to miss.

### The filter controls

Below the timeline is a row of controls. Walk through each:

1. **Search bar** — *"Search events, people, regions..."* — filters in real time as you type, searching across title, description, contributor name, and region
2. **All Units dropdown** — filters by historical unit
3. **All Tags dropdown** — filters by category (Political, Economic, Social, Cultural, Military, Geographic, Legal, Technological, Religious)
4. **Sort toggle** — switches between **Oldest** (chronological) and **Newest** (reverse)
5. **Contributors button** — toggles a sidebar showing a ranked leaderboard

When any filter is active, a bar appears below the controls showing colored badges for each active filter and a **Clear** button to reset everything.

### The event cards

Each event appears as a card with:

- A **colored year badge** on the left (color matches the unit)
- The **event title**
- A metadata line showing the unit, first few tags, and who added it

**Clicking a card expands it** to show the full description, all tags, source citation, source type (primary or secondary), contributor name, region, and section.

> "The cards are designed so students can scan quickly but drill into details when they're ready. The source type callout — primary vs. secondary — reinforces the sourcing skills we want them to practice."

**Teacher-only detail**: Expanded cards show a red **Delete Event** button at the bottom. Students never see this.

### The contributors sidebar

Toggle this on with the **Contributors** button. It shows a ranked list of students by number of approved events, with small progress bars. Teacher-contributed events appear in gray italic to distinguish them.

> "This is a low-key leaderboard. It's not competitive by design — there's no 'winner' — but it gives students visibility into who's contributing and can motivate participation."

---

## Part 4: The Student Experience (5 min)

Switch to your second browser window and sign in with a student account. If you're presenting on a projector, you can show both windows side by side.

### What's different

- **No "Teacher View" badge** in the header
- **No section switcher** — students only see events from their own section
- **No "Review" button** — students can't access the moderation queue
- **No "Delete Event" button** on expanded cards
- **No "Seed Database" button**

Everything else looks the same: the timeline, filters, search, event cards, and contributors sidebar all work identically.

### Submitting an event

Click the **+ Add Event** button. A modal form opens with the heading **"Add a Historical Event"** and a note: *"Submitting as [Student Name] · Requires teacher approval"*.

Walk through the form fields:

| Field | What to say |
|-------|-------------|
| **Event Title** | *"What happened? Keep it specific — 'Battle of Midway' not 'WWII battle'."* |
| **Year** | *"Must be between 1900 and 2000. This positions the event on the timeline."* |
| **Unit** | *"Which unit does this event belong to? This determines the card's color."* |
| **Tags** | *"Pick at least one category. Students can select multiple — this helps with filtering later."* |
| **Source Type** | *"Primary or secondary source. Defaults to primary. This maps to the sourcing skills we're assessing."* |
| **Description** | *"This is where the real work happens. We're looking for 2–3 sentences minimum — what happened and why it matters."* |
| **Source Citation** | *"Where did they learn about this? Textbook page, article title, archive URL."* |
| **Region** | *"Optional. Geographic context like 'Europe,' 'Pacific,' 'National.'"* |

At the bottom of the form there's a **Historian's Tip** box that reminds students which skills the assignment practices (sourcing, contextualization, classification).

Click **Submit Event for Approval**. The modal closes. The event is now in the teacher's review queue — it does **not** appear on the student's timeline yet.

> "Students see their submission disappear into the void. They have to trust the process. That's by design — it keeps the shared timeline authoritative and prevents spam or low-effort posts."

---

## Part 5: Moderating Submissions (7 min)

Switch back to the teacher window. The **Review** button in the header should now show a count (at least 1, from the submission you just made).

### The moderation queue

Click **Review (N)**. A modal opens showing all pending submissions as cards. Each card shows:

- The event title, year, unit, contributor name, section, and full description
- Source citation and source type
- Tags

Below each card are three buttons: **Reject**, **Edit**, and **Approve**.

### Approving an event

> "If the submission looks good — solid description, proper sourcing, correct unit — you approve it."

Click **Approve**. The card disappears from the queue. Now switch to the student window — the event should appear on their timeline within seconds.

> "That's the real-time sync. You approved it, and every student in that section sees it immediately. No refresh needed."

When you approve an event, it's also automatically sent to the linked Google Sheet as a new row. This happens silently in the background — if the sheet connection has a hiccup, it won't block the approval.

### Editing before approving

> "Sometimes a submission is close but needs polish — a typo in the title, a vague description, a missing tag."

Click **Edit** on a pending submission. The card transforms into an inline editing form. You can change the title, year, unit, tags, description, and source citation. Click **Save Edits** to save your changes, then **Approve** as normal.

> "You're not rewriting their work — you're cleaning it up so it meets the bar for the shared timeline. Think of it like editorial review."

### Rejecting a submission

Click **Reject**. A confirmation prompt asks: *"Reject this submission? It will be removed."*

On confirm, the submission is deleted from the database entirely.

> "Rejections are permanent — the student would need to resubmit from scratch. Use this for off-topic submissions, joke entries, or duplicates. For fixable issues, editing is usually the better path."

---

## Part 6: Sections & Multi-Class Management (3 min)

### How sections work

Each student is assigned to a section through the URL parameter `?section=Period1` (or Period2, etc.). Students only see events from their own section.

As the teacher, you can:

- **View a single section**: Click a section button in the header (e.g., "Period1"). You'll see only that section's events and contributors.
- **View all sections**: Click **All Sections**. A section filter dropdown appears in the filter row so you can narrow down if needed. The URL updates to `?section=all`.

> "Each section builds its own timeline independently. You might see Period 1 heavily focused on WWII while Period 3 has more Cold War events — that's fine. It reflects what each class is researching."

### Sharing section links

You can share a direct link to a specific section by including the query parameter:

```
https://mr-munny.github.io/timeline-explorer?section=Period2
```

This is useful for posting in your LMS or class page so students land in the right section automatically.

---

## Part 7: Day-to-Day Workflow (5 min)

This section isn't a demo — it's a conversation about how to integrate the tool into your teaching routine.

### Suggested workflow

1. **Beginning of a unit**: Share the timeline link with students. If it's the first unit, seed the database so there's something to explore.
2. **During the unit**: Assign students to submit events as they encounter significant moments in their reading or research. Set a minimum (e.g., "submit at least 3 events this unit").
3. **Daily or weekly**: Check the moderation queue. Approve strong submissions, edit near-misses, reject off-topic entries. A quick 5-minute pass keeps the queue manageable.
4. **End of unit**: Use the timeline as a review tool. Have students filter by the unit and walk through the timeline chronologically. The contributor sidebar shows participation at a glance.
5. **Assessment**: The Google Sheet accumulates all approved events with timestamps, contributor names, and sections — you can use it for grading participation without manually tracking anything.

### Common questions

**Q: What if a student submits the same event as someone else?**
> Approve the better version and reject the duplicate. Or edit one to focus on a different angle — the same event can appear twice if the descriptions offer genuinely different perspectives.

**Q: Can students see who rejected their submission?**
> No. Rejected submissions simply disappear. Students don't receive any notification. If you want to give feedback, you'll need to do that outside the app (in class, via email, etc.).

**Q: What if I need to delete an approved event later?**
> Expand the event card and click **Delete Event** at the bottom. You'll get a confirmation prompt. This is permanent.

**Q: Can I edit an event after it's already been approved?**
> Not through the app's UI — editing is only available in the moderation queue before approval. If you need to fix something post-approval, you'd delete it and re-add it, or update it directly in Firebase.

**Q: What happens to the Google Sheet if I delete an event?**
> The row stays in the sheet. Deletions don't propagate to Google Sheets — only approvals write to it. You'd need to remove the row manually if needed.

---

## Quick Reference

### Teacher account capabilities

| Action | Where |
|--------|-------|
| View all sections | Header section switcher or `?section=all` |
| Review pending submissions | Header **Review (N)** button |
| Approve / Edit / Reject submissions | Inside moderation queue |
| Delete approved events | Expanded event card, bottom |
| Seed database (first time) | Header **Seed Database** button |
| Add events directly | Header **+ Add Event** button |

### Keyboard & interaction shortcuts

| Action | How |
|--------|-----|
| Filter by unit | Click an era band on the visual timeline |
| Expand/collapse event | Click anywhere on the event card |
| Clear all filters | Click **Clear** in the active filters bar |
| Toggle contributor sidebar | Click **Contributors** button in filter row |

### Environment setup checklist

If you're setting up a new instance of the app:

- [ ] Copy `.env.example` to `.env.local`
- [ ] Set `REACT_APP_TEACHER_EMAIL` to the teacher's Google account email
- [ ] Set `REACT_APP_SCHOOL_DOMAIN` to your school's email domain (e.g., `school.edu`)
- [ ] Set `REACT_APP_SECTIONS` to comma-separated section names (e.g., `Period1,Period2,Period3`)
- [ ] Set `REACT_APP_APPS_SCRIPT_URL` to the deployed Google Apps Script webhook URL
- [ ] Run `npm install` and `npm start` to test locally
- [ ] Deploy with `npm run deploy` (pushes to GitHub Pages)
