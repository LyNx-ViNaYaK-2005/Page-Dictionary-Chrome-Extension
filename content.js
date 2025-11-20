// Toggle mode: if already active, turn off; otherwise start
if (window.__static_dict_active) {
  cleanup();
} else {
  startStaticDictionaryMode();
}

function startStaticDictionaryMode() {
  window.__static_dict_active = true;

  // 1. Visual overlay (does NOT block pointer events)
  const overlay = document.createElement("div");
  overlay.id = "static-dict-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0, 0, 0, 0.05)";
  overlay.style.zIndex = "2147483646";
  overlay.style.cursor = "text";
  overlay.style.backdropFilter = "blur(1px)";
  overlay.style.pointerEvents = "none"; // allow selection on page

  document.body.appendChild(overlay);

  // 2. Exit button (clickable)
  const closeBtn = document.createElement("button");
  closeBtn.id = "static-dict-exit-btn";
  closeBtn.textContent = "Exit dictionary mode ✕";
  closeBtn.style.position = "fixed";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "10px";
  closeBtn.style.zIndex = "2147483647";
  closeBtn.style.padding = "6px 10px";
  closeBtn.style.fontSize = "12px";
  closeBtn.style.border = "none";
  closeBtn.style.borderRadius = "4px";
  closeBtn.style.background = "#222";
  closeBtn.style.color = "#fff";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.pointerEvents = "auto";

  closeBtn.addEventListener("click", () => {
    cleanup();
  });

  document.body.appendChild(closeBtn);

  // 3. Listen for selection on the whole document
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("dblclick", onMouseUp);
}

function onMouseUp(e) {
  if (!window.__static_dict_active) return;

  const selection = window.getSelection().toString().trim();
  if (!selection) return;

  // Remove punctuation around word
  const word = selection.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
  if (!word) return;

  fetchMeaning(word, e.clientX, e.clientY);
}

async function fetchMeaning(word, x, y) {
  showTooltip(x, y, `Looking up “${word}”...`);

  try {
    const url =
      "https://freedictionaryapi.com/api/v1/entries/en/" +
      encodeURIComponent(word);
    console.log("Requesting:", url);

    const res = await fetch(url);
    console.log("Status:", res.status, res.statusText);

    if (!res.ok) {
      const text = await res.text();
      console.log("Error body:", text);
      showTooltip(
        x,
        y,
        `API error (${res.status}): ${
          text || "No definition found for this word."
        }`
      );
      return;
    }

    const data = await res.json();
    console.log("Response JSON:", data);

    // --- BEGIN FreeDictionaryAPI parsing ---
    let def = "No definition.";
    let partOfSpeech = "";

    try {
      const entries = Array.isArray(data.entries) ? data.entries : [];
      const firstEntry = entries[0];

      if (firstEntry) {
        if (firstEntry.partOfSpeech) {
          partOfSpeech = " (" + firstEntry.partOfSpeech + ")";
        }

        if (
          Array.isArray(firstEntry.senses) &&
          firstEntry.senses[0] &&
          firstEntry.senses[0].definition
        ) {
          def = firstEntry.senses[0].definition;
        }
      }
    } catch (parseErr) {
      console.error("Error parsing dictionary response:", parseErr);
    }
    // --- END FreeDictionaryAPI parsing ---

    showTooltip(x, y, `${word}${partOfSpeech}: ${def}`);
  } catch (err) {
    console.error("Fetch error:", err);
    showTooltip(
      x,
      y,
      `Network error fetching “${word}”. Open console for details.`
    );
  }
}

function showTooltip(x, y, text) {
  let tooltip = document.getElementById("static-dict-tooltip");
  if (tooltip) {
    tooltip.remove();
  }

  tooltip = document.createElement("div");
  tooltip.id = "static-dict-tooltip";
  tooltip.textContent = text;
  tooltip.style.position = "fixed";
  tooltip.style.left = x + 10 + "px";
  tooltip.style.top = y + 10 + "px";
  tooltip.style.maxWidth = "320px";
  tooltip.style.background = "#222";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "8px 10px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.fontSize = "13px";
  tooltip.style.lineHeight = "1.4";
  tooltip.style.zIndex = "2147483647";
  tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
  tooltip.style.cursor = "default";

  tooltip.addEventListener("click", () => tooltip.remove());

  document.body.appendChild(tooltip);
}

function cleanup() {
  const overlay = document.getElementById("static-dict-overlay");
  if (overlay) overlay.remove();

  const btn = document.getElementById("static-dict-exit-btn");
  if (btn) btn.remove();

  const tooltip = document.getElementById("static-dict-tooltip");
  if (tooltip) tooltip.remove();

  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("dblclick", onMouseUp);

  window.__static_dict_active = false;
}
