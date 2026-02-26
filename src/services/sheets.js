// Replace this with your deployed Apps Script web app URL.
// See: Google Sheet > Extensions > Apps Script > Deploy > Web app
const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

// Append a row to the Google Sheet when an event is approved.
// Sheet must have headers: Title | Year | Period | Tags | SourceType | Description | SourceNote | AddedBy | Section | ApprovedDate
export async function writeToSheet(event) {
  const row = [
    event.title,
    event.year,
    event.period,
    (event.tags || []).join(", "),
    event.sourceType,
    event.description,
    event.sourceNote,
    event.addedBy,
    event.section,
    new Date().toISOString(),
  ];

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ row }),
    });

    if (!res.ok) {
      console.error("Google Sheets write failed:", res.status);
    }
  } catch (err) {
    // Non-blocking: log but don't throw — the event is already approved in Firebase
    console.error("Google Sheets bridge error:", err);
  }
}
