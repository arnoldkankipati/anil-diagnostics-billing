// --- api.js ---
const SHEET_URL = "https://anildiagnostics.vercel.app/api/proxy";

/**
 * Send bill JSON to Google Sheets via Apps Script Web App
 * @param {Object} payload - The billing data payload
 */
async function saveToGoogleSheet(payload) {
  try {
    const response = await fetch(SHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("✅ Receipt response:", data);
    return data;
  } catch (err) {
    console.error("❌ Sheet error:", err);
    return { success: false, error: err.message };
  }
}
