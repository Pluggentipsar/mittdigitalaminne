// Mitt Digitala Minne - Browser Extension
(async function () {
  // DOM refs
  const pageUrlEl = document.getElementById("page-url");
  const pageTitleEl = document.getElementById("page-title");
  const tagInputEl = document.getElementById("tag-input");
  const tagsListEl = document.getElementById("tags-list");
  const addTagBtn = document.getElementById("add-tag-btn");
  const saveInboxBtn = document.getElementById("save-inbox");
  const saveNowBtn = document.getElementById("save-now");
  const loadingEl = document.getElementById("loading");
  const unfurlPreviewEl = document.getElementById("unfurl-preview");
  const unfurlImageEl = document.getElementById("unfurl-image");
  const unfurlDomainEl = document.getElementById("unfurl-domain");
  const mainContent = document.getElementById("main-content");
  const successState = document.getElementById("success-state");
  const successSub = document.getElementById("success-sub");
  const errorState = document.getElementById("error-state");
  const errorText = document.getElementById("error-text");
  const retryBtn = document.getElementById("retry-btn");
  const notConfigured = document.getElementById("not-configured");
  const openOptionsBtn = document.getElementById("open-options");

  let tags = [];
  let unfurlData = null;
  let currentUrl = "";
  let config = {};

  // Load config
  const stored = await chrome.storage.sync.get(["serverUrl", "apiKey"]);
  config = {
    serverUrl: (stored.serverUrl || "").replace(/\/$/, ""),
    apiKey: stored.apiKey || "",
  };

  if (!config.serverUrl || !config.apiKey) {
    mainContent.classList.add("hidden");
    notConfigured.classList.remove("hidden");
    openOptionsBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;

  currentUrl = tab.url;
  pageUrlEl.textContent = currentUrl;
  pageTitleEl.value = tab.title || "";

  // Auto-unfurl
  unfurlUrl(currentUrl);

  // Tag management
  addTagBtn.addEventListener("click", addTag);
  tagInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  });

  function addTag() {
    const val = tagInputEl.value.trim().toLowerCase();
    if (val && !tags.includes(val)) {
      tags.push(val);
      renderTags();
    }
    tagInputEl.value = "";
  }

  function removeTag(tag) {
    tags = tags.filter((t) => t !== tag);
    renderTags();
  }

  function renderTags() {
    tagsListEl.innerHTML = tags
      .map(
        (t) =>
          `<span class="tag">${t}<button class="tag-remove" data-tag="${t}">&times;</button></span>`
      )
      .join("");
    tagsListEl.querySelectorAll(".tag-remove").forEach((btn) => {
      btn.addEventListener("click", () => removeTag(btn.dataset.tag));
    });
  }

  // Unfurl
  async function unfurlUrl(url) {
    loadingEl.classList.remove("hidden");
    try {
      const res = await fetch(`${config.serverUrl}/api/unfurl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Unfurl failed");
      const { data } = await res.json();
      unfurlData = data;

      if (data.title && !pageTitleEl.value) {
        pageTitleEl.value = data.title;
      }

      if (data.image) {
        unfurlImageEl.src = data.image;
        unfurlDomainEl.textContent = data.domain || "";
        unfurlPreviewEl.classList.remove("hidden");
      }
    } catch {
      // Unfurl is best-effort
    } finally {
      loadingEl.classList.add("hidden");
    }
  }

  // Save
  saveInboxBtn.addEventListener("click", () => saveMemory(true));
  saveNowBtn.addEventListener("click", () => saveMemory(false));

  async function saveMemory(toInbox) {
    const title = pageTitleEl.value.trim();
    if (!title) {
      pageTitleEl.focus();
      return;
    }

    saveInboxBtn.disabled = true;
    saveNowBtn.disabled = true;

    // Detect content type
    let contentType = "link";
    if (unfurlData?.content_type_hint) {
      contentType = unfurlData.content_type_hint;
    }

    const body = {
      content_type: contentType,
      title,
      link_url: currentUrl,
      summary: unfurlData?.description || null,
      original_content: unfurlData?.article_text || null,
      snapshot_html: unfurlData?.snapshot_html || null,
      snapshot_taken_at: new Date().toISOString(),
      is_inbox: toInbox,
      tags,
      link_metadata: unfurlData
        ? {
            og_title: unfurlData.title || undefined,
            og_description: unfurlData.description || undefined,
            og_image: unfurlData.image || undefined,
            favicon: unfurlData.favicon || undefined,
            domain: unfurlData.domain || undefined,
            video_id: unfurlData.video_id || undefined,
            channel_name: unfurlData.channel_name || undefined,
            thumbnail_url: unfurlData.image || undefined,
          }
        : null,
    };

    try {
      const res = await fetch(`${config.serverUrl}/api/memories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Sparning misslyckades");
      }

      // Success
      mainContent.classList.add("hidden");
      successState.classList.remove("hidden");
      successSub.textContent = toInbox ? "Sparad till inkorg" : "Sparad till minnen";

      // Auto-close after 1.5s
      setTimeout(() => window.close(), 1500);
    } catch (err) {
      mainContent.classList.add("hidden");
      errorState.classList.remove("hidden");
      errorText.textContent = err.message;
    }

    saveInboxBtn.disabled = false;
    saveNowBtn.disabled = false;
  }

  // Retry
  retryBtn.addEventListener("click", () => {
    errorState.classList.add("hidden");
    mainContent.classList.remove("hidden");
  });
})();
