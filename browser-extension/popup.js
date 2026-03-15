// Mitt Digitala Minne - Browser Extension v1.1
(async function () {
  // DOM refs
  const pageUrlEl = document.getElementById("page-url");
  const pageTitleEl = document.getElementById("page-title");
  const pageSummaryEl = document.getElementById("page-summary");
  const tagInputEl = document.getElementById("tag-input");
  const tagsListEl = document.getElementById("tags-list");
  const addTagBtn = document.getElementById("add-tag-btn");
  const tagSuggestionsEl = document.getElementById("tag-suggestions");
  const typeSelectorEl = document.getElementById("type-selector");
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
  let selectedType = "link";

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

  // Fetch tag suggestions
  fetchTagSuggestions();

  // Content type selector
  typeSelectorEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".type-btn");
    if (!btn) return;
    typeSelectorEl.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type;
  });

  function setContentType(type) {
    selectedType = type;
    typeSelectorEl.querySelectorAll(".type-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.type === type);
    });
  }

  // Tag management
  addTagBtn.addEventListener("click", addTag);
  tagInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  });

  function addTag(name) {
    const val = (name || tagInputEl.value).trim().toLowerCase();
    if (val && !tags.includes(val)) {
      tags.push(val);
      renderTags();
    }
    if (!name) tagInputEl.value = "";
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
    // Update suggestion visibility
    updateSuggestions();
  }

  // Tag suggestions
  async function fetchTagSuggestions() {
    try {
      const res = await fetch(`${config.serverUrl}/api/tags`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      if (!res.ok) return;
      const { data } = await res.json();
      if (!data || data.length === 0) return;

      // Store suggestions
      tagSuggestionsEl.dataset.tags = JSON.stringify(data.map((t) => t.name));
      updateSuggestions();
    } catch {
      // Best-effort
    }
  }

  function updateSuggestions() {
    try {
      const allTags = JSON.parse(tagSuggestionsEl.dataset.tags || "[]");
      const available = allTags.filter((t) => !tags.includes(t)).slice(0, 8);

      if (available.length === 0) {
        tagSuggestionsEl.classList.add("hidden");
        return;
      }

      tagSuggestionsEl.innerHTML = available
        .map((t) => `<button class="suggestion-chip" data-tag="${t}">${t}</button>`)
        .join("");
      tagSuggestionsEl.classList.remove("hidden");

      tagSuggestionsEl.querySelectorAll(".suggestion-chip").forEach((chip) => {
        chip.addEventListener("click", () => addTag(chip.dataset.tag));
      });
    } catch {
      // ignore
    }
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

      // Pre-fill summary from description
      if (data.description && !pageSummaryEl.value) {
        pageSummaryEl.value = data.description;
      }

      // Auto-detect content type
      if (data.content_type_hint) {
        setContentType(data.content_type_hint);
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

    const summary = pageSummaryEl.value.trim() || null;

    const body = {
      content_type: selectedType,
      title,
      link_url: currentUrl,
      summary: summary || (unfurlData?.description || null),
      original_content: unfurlData?.article_text || null,
      snapshot_html: unfurlData?.snapshot_html || null,
      snapshot_taken_at: new Date().toISOString(),
      is_inbox: toInbox,
      source: "extension",
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
