// --- api.js ---
const SHEET_URL = "https://anil-diagnostics-billing-1.vercel.app/api/proxy";

/**
 * Send bill JSON to Google Sheets via Apps Script Web App
 * @param {Object} payload - The billing data payload
 */
async function saveToGoogleSheet(payload) {
  try {
    await fetch(SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("✅ Saved to Google Sheet");
  } catch (err) {
    console.error("❌ Sheet error:", err);
  }
}
