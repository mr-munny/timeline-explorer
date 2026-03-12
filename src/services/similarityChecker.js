// Power Automate webhook integration for AI event similarity checking.
// Compares a new/pending event against existing events in the same section
// to detect duplicates. The webhook URL is configured via
// REACT_APP_SIMILARITY_WEBHOOK_URL env var. Power Automate receives the
// candidate event + existing events, runs an AI comparison, and writes
// the result back to Firebase at /events/{eventId}/similarityReport.

const WEBHOOK_URL = process.env.REACT_APP_SIMILARITY_WEBHOOK_URL;

const DATABASE_URL = "https://timeline-explorer-79df5-default-rtdb.firebaseio.com";

/**
 * Send a pending event + existing section events to Power Automate for
 * AI similarity analysis. Non-blocking — errors are logged but not thrown.
 *
 * @param {string} eventId - Firebase key of the candidate event
 * @param {object} eventData - The candidate event object
 * @param {Array} existingEvents - All events in the same section (approved + pending)
 */
export async function sendToSimilarityChecker(eventId, eventData, existingEvents = []) {
  console.log("[Similarity] sendToSimilarityChecker called", { eventId, webhookUrl: WEBHOOK_URL ? "SET" : "NOT SET" });

  if (!WEBHOOK_URL) {
    console.warn("[Similarity] No REACT_APP_SIMILARITY_WEBHOOK_URL set — skipping");
    return;
  }

  // Build compact candidate (no tags/region per user decision)
  const candidate = {
    title: eventData.title || "",
    year: eventData.year,
    description: (eventData.description || "").substring(0, 500),
  };

  // Build compact existing events list, excluding the candidate itself
  const compactEvents = existingEvents
    .filter((e) => e.id !== eventId)
    .map((e) => ({
      id: e.id,
      title: e.title || "",
      year: e.year,
      description: (e.description || "").substring(0, 300),
    }));

  const payload = {
    eventId,
    databaseUrl: DATABASE_URL,
    candidate,
    existingEvents: compactEvents,
  };

  console.log("[Similarity] Sending payload:", { eventId, candidateTitle: candidate.title, existingCount: compactEvents.length });

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("[Similarity] Response:", res.status, res.statusText);

    if (!res.ok) {
      console.error("[Similarity] Webhook failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[Similarity] Webhook error:", err);
  }
}