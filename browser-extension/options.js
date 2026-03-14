// Options page for Mitt Digitala Minne extension
const serverUrlInput = document.getElementById("server-url");
const apiKeyInput = document.getElementById("api-key");
const saveBtn = document.getElementById("save-btn");
const testBtn = document.getElementById("test-btn");
const statusEl = document.getElementById("status");

// Load saved settings
chrome.storage.sync.get(["serverUrl", "apiKey"], (data) => {
  if (data.serverUrl) serverUrlInput.value = data.serverUrl;
  if (data.apiKey) apiKeyInput.value = data.apiKey;
});

// Save
saveBtn.addEventListener("click", () => {
  const serverUrl = serverUrlInput.value.trim().replace(/\/$/, "");
  const apiKey = apiKeyInput.value.trim();

  if (!serverUrl) {
    showStatus("Ange en server-URL", "error");
    return;
  }

  chrome.storage.sync.set({ serverUrl, apiKey }, () => {
    showStatus("Inställningar sparade!", "success");
  });
});

// Test connection
testBtn.addEventListener("click", async () => {
  const serverUrl = serverUrlInput.value.trim().replace(/\/$/, "");
  const apiKey = apiKeyInput.value.trim();

  if (!serverUrl) {
    showStatus("Ange en server-URL först", "error");
    return;
  }

  showStatus("Testar anslutning...", "");

  try {
    const res = await fetch(`${serverUrl}/api/statistics`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });

    if (res.ok) {
      const { data } = await res.json();
      showStatus(
        `Anslutning OK! ${data.total} minnen i arkivet.`,
        "success"
      );
    } else {
      showStatus(`Fel: HTTP ${res.status}`, "error");
    }
  } catch (err) {
    showStatus(`Kunde inte ansluta: ${err.message}`, "error");
  }
});

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = type || "";
  statusEl.classList.remove("hidden");
}
