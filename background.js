const DEFAULTS = {
  focusActive: false,
  focusStartedAt: null,
  accumulatedMs: 0,
  stats: { days: {} }
};

chrome.runtime.onInstalled.addListener(async () => {
  const saved = await chrome.storage.local.get(DEFAULTS);
  await chrome.storage.local.set({ ...DEFAULTS, ...saved });
});

const today = () => new Date().toISOString().slice(0, 10);

async function updateStats(kind, amount = 1) {
  const { stats = { days: {} } } = await chrome.storage.local.get("stats");
  const day = stats.days[today()] || { focusMs: 0, studyVideos: 0, blocked: 0 };
  day[kind] = (day[kind] || 0) + amount;
  stats.days[today()] = day;
  await chrome.storage.local.set({ stats });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === "video-allowed") await updateStats("studyVideos");
    if (message.type === "content-blocked") await updateStats("blocked", message.count || 1);
    if (message.type === "focus-stopped" && message.durationMs) {
      await updateStats("focusMs", Math.max(0, message.durationMs));
    }
    sendResponse({ ok: true });
  })();
  return true;
});
