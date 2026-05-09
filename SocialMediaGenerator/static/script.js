/**
 * script.js — CaptionAI Frontend Logic
 * ======================================
 * Handles:
 * - Form submission and validation
 * - Fetching captions from the Flask /generate endpoint
 * - Rendering captions, hashtags, and emojis dynamically
 * - Copy-to-clipboard for captions and hashtags
 * - Dark/Light mode toggle (persisted to localStorage)
 * - Character counter for the topic textarea
 */

// ────────────────────────────────────────────────────────────────
//  DOM REFERENCES
// ────────────────────────────────────────────────────────────────
const form            = document.getElementById("generatorForm");
const generateBtn     = document.getElementById("generateBtn");
const loadingState    = document.getElementById("loadingState");
const errorBanner     = document.getElementById("errorBanner");
const errorMessage    = document.getElementById("errorMessage");
const closeError      = document.getElementById("closeError");
const resultsSection  = document.getElementById("resultsSection");
const captionsGrid    = document.getElementById("captionsGrid");
const hashtagsContainer = document.getElementById("hashtagsContainer");
const emojiRow        = document.getElementById("emojiRow");
const emojiDescription = document.getElementById("emojiDescription");
const copyHashtagsBtn = document.getElementById("copyHashtags");
const regenerateBtn   = document.getElementById("regenerateBtn");
const themeToggle     = document.getElementById("themeToggle");
const topicTextarea   = document.getElementById("topic");
const topicCharCount  = document.getElementById("topicCharCount");
const copyToast       = document.getElementById("copyToast");
const platformTip     = document.getElementById("platformTip");
const platformTipText = document.getElementById("platformTipText");

// ────────────────────────────────────────────────────────────────
//  THEME TOGGLE
//  Persists user preference in localStorage
// ────────────────────────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem("captionai-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  updateToggleIcon(saved);
})();

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("captionai-theme", next);
  updateToggleIcon(next);
});

function updateToggleIcon(theme) {
  themeToggle.querySelector(".toggle-icon").textContent =
    theme === "dark" ? "🌙" : "☀️";
}

// ────────────────────────────────────────────────────────────────
//  CHARACTER COUNTER — Topic textarea
// ────────────────────────────────────────────────────────────────
topicTextarea.addEventListener("input", () => {
  const len = topicTextarea.value.length;
  const max = parseInt(topicTextarea.getAttribute("maxlength"), 10);
  topicCharCount.textContent = len;

  const counter = topicCharCount.parentElement;
  counter.classList.toggle("warn",   len > max * 0.75);
  counter.classList.toggle("danger", len > max * 0.9);
});

// ────────────────────────────────────────────────────────────────
//  FORM SUBMIT
// ────────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Collect form values
  const payload = {
    platform:        document.getElementById("platform").value,
    post_type:       document.getElementById("post_type").value,
    tone:            document.getElementById("tone").value,
    target_audience: document.getElementById("target_audience").value.trim(),
    topic:           topicTextarea.value.trim(),
  };

  // Client-side validation
  if (!payload.platform || !payload.post_type || !payload.tone) {
    showError("Please select a Platform, Post Type, and Tone.");
    return;
  }
  if (!payload.target_audience) {
    showError("Please describe your target audience.");
    return;
  }
  if (!payload.topic) {
    showError("Please enter a topic or keyword for the post.");
    return;
  }

  // Kick off generate flow
  await generateCaptions(payload);
});

// Regenerate with same form values
regenerateBtn.addEventListener("click", () => form.dispatchEvent(new Event("submit")));

// ────────────────────────────────────────────────────────────────
//  MAIN API CALL
// ────────────────────────────────────────────────────────────────
async function generateCaptions(payload) {
  // UI state: start loading
  setLoading(true);
  hideError();
  resultsSection.classList.add("hidden");

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Handle server-side errors returned as JSON
    if (!response.ok || data.error) {
      throw new Error(data.error || `Server error (${response.status})`);
    }

    // Render results
    renderResults(data, payload.platform);

  } catch (err) {
    showError(err.message || "An unexpected error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
}

// ────────────────────────────────────────────────────────────────
//  RENDER RESULTS
// ────────────────────────────────────────────────────────────────
function renderResults(data, platform) {
  // ── Platform tip
  if (data.platform_tip) {
    platformTipText.textContent = data.platform_tip;
    platformTip.classList.remove("hidden");
  } else {
    platformTip.classList.add("hidden");
  }

  // ── Captions
  captionsGrid.innerHTML = "";
  if (Array.isArray(data.captions)) {
    data.captions.forEach((item) => {
      captionsGrid.appendChild(buildCaptionCard(item));
    });
  }

  // ── Hashtags
  hashtagsContainer.innerHTML = "";
  if (Array.isArray(data.hashtags)) {
    data.hashtags.forEach((tag) => {
      const el = document.createElement("span");
      el.className = "hashtag-tag";
      el.textContent = tag;
      el.title = "Click to copy";
      el.addEventListener("click", () => copyText(tag));
      hashtagsContainer.appendChild(el);
    });
  }

  // ── Emojis
  emojiRow.innerHTML = "";
  if (data.emojis && Array.isArray(data.emojis.recommended)) {
    data.emojis.recommended.forEach((emoji) => {
      const el = document.createElement("span");
      el.className = "emoji-chip";
      el.textContent = emoji;
      el.title = "Click to copy";
      el.addEventListener("click", () => copyText(emoji));
      emojiRow.appendChild(el);
    });
    emojiDescription.textContent = data.emojis.description || "";
  }

  // Show the results section with animation
  resultsSection.classList.remove("hidden");

  // Smooth scroll to results
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
}

// ────────────────────────────────────────────────────────────────
//  BUILD CAPTION CARD
// ────────────────────────────────────────────────────────────────
function buildCaptionCard(item) {
  const card = document.createElement("div");
  card.className = "caption-card";

  // Calculate word/char counts (use API values or compute locally)
  const text      = item.caption || "";
  const wordCount = item.word_count ?? text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = item.char_count ?? text.length;

  card.innerHTML = `
    <div class="caption-card-header">
      <div class="caption-label">
        <span class="caption-num">${item.id || "•"}</span>
        Caption ${item.id || ""}
      </div>
      <button class="copy-btn" data-caption="${escapeAttr(text)}" aria-label="Copy caption ${item.id}">
        📋 Copy
      </button>
    </div>
    <p class="caption-text">${escapeHtml(text)}</p>
    <div class="caption-meta">
      <span class="meta-chip">📝 Words: <strong>${wordCount}</strong></span>
      <span class="meta-chip">🔤 Chars: <strong>${charCount}</strong></span>
    </div>
  `;

  // Copy button handler
  card.querySelector(".copy-btn").addEventListener("click", (e) => {
    const caption = e.currentTarget.dataset.caption;
    copyText(caption);
  });

  return card;
}

// ────────────────────────────────────────────────────────────────
//  COPY ALL HASHTAGS BUTTON
// ────────────────────────────────────────────────────────────────
copyHashtagsBtn.addEventListener("click", () => {
  const tags = Array.from(hashtagsContainer.querySelectorAll(".hashtag-tag"))
    .map((el) => el.textContent)
    .join(" ");
  copyText(tags);
});

// ────────────────────────────────────────────────────────────────
//  COPY TO CLIPBOARD UTILITY
// ────────────────────────────────────────────────────────────────
let toastTimer = null;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("✅ Copied to clipboard!");
  } catch {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("✅ Copied to clipboard!");
  }
}

function showToast(message) {
  copyToast.textContent = message;
  copyToast.classList.remove("hidden");

  // Trigger CSS transition on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => copyToast.classList.add("show"));
  });

  // Hide after 2.5 seconds
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    copyToast.classList.remove("show");
    setTimeout(() => copyToast.classList.add("hidden"), 300);
  }, 2500);
}

// ────────────────────────────────────────────────────────────────
//  UI HELPERS
// ────────────────────────────────────────────────────────────────

/** Toggle loading state — disables button and shows spinner */
function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  generateBtn.querySelector(".btn-text").textContent = isLoading
    ? "Generating…"
    : "Generate Captions";

  loadingState.classList.toggle("hidden", !isLoading);
}

/** Show the error banner with a message */
function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove("hidden");
  errorBanner.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** Hide the error banner */
function hideError() {
  errorBanner.classList.add("hidden");
}

// Dismiss error on ✕ click
closeError.addEventListener("click", hideError);

// ────────────────────────────────────────────────────────────────
//  SECURITY HELPERS
// ────────────────────────────────────────────────────────────────

/** Escape HTML to prevent XSS when injecting user-ish content */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape for use inside an HTML attribute value */
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
