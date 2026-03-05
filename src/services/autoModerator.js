// Power Automate webhook integration for AI auto-moderation of pending events.
// The webhook URL is configured via REACT_APP_AUTOMOD_WEBHOOK_URL env var.
// Power Automate receives the event data, runs an AI evaluation, and writes
// the result back to Firebase at /events/{eventId}/aiReview.

const WEBHOOK_URL = process.env.REACT_APP_AUTOMOD_WEBHOOK_URL;

const DATABASE_URL = "https://timeline-explorer-79df5-default-rtdb.firebaseio.com";

/**
 * Send a pending event to Power Automate for AI review.
 * Non-blocking — errors are logged but not thrown.
 *
 * @param {string} eventId - Firebase event key
 * @param {object} eventData - The event object (title, year, description, period, etc.)
 * @param {Array} periods - Section's period objects (to resolve period ID → label)
 */
export async function sendToAutoModerator(eventId, eventData, periods = []) {
  console.log("[AutoMod] sendToAutoModerator called", { eventId, webhookUrl: WEBHOOK_URL ? "SET" : "NOT SET" });

  if (!WEBHOOK_URL) {
    console.warn("[AutoMod] No REACT_APP_AUTOMOD_WEBHOOK_URL set — skipping");
    return;
  }

  const periodObj = periods.find((p) => p.id === eventData.period);
  const periodLabel = periodObj?.label || eventData.period || "";

  const payload = {
    eventId,
    databaseUrl: DATABASE_URL,
    title: eventData.title || "",
    year: eventData.year,
    description: eventData.description || "",
    period: periodLabel,
  };

  console.log("[AutoMod] Sending payload:", payload);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("[AutoMod] Response:", res.status, res.statusText);

    if (!res.ok) {
      console.error("[AutoMod] Webhook failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[AutoMod] Webhook error:", err);
  }
}
