// Track which tabs have YouTube videos playing
const youtubeTabStates = new Map();

// Listen for tab activation (user switches to a different tab)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { tabId } = activeInfo;
  
  // Get all YouTube tabs
  const youtubeTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
  
  youtubeTabs.forEach((tab) => {
    if (tab.id === tabId) {
      // User switched TO this YouTube tab - signal resume
      chrome.tabs.sendMessage(tab.id, { action: "TAB_FOCUSED" }).catch(() => {});
    } else {
      // User switched AWAY from this YouTube tab - signal pause
      chrome.tabs.sendMessage(tab.id, { action: "TAB_UNFOCUSED" }).catch(() => {});
    }
  });
});

// Listen for window focus changes (user switches to different app/window)
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus entirely - pause all YouTube tabs
    const youtubeTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
    youtubeTabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: "WINDOW_UNFOCUSED" }).catch(() => {});
    });
  } else {
    // Browser gained focus - check active tab
    const [activeTab] = await chrome.tabs.query({ active: true, windowId });
    if (activeTab && activeTab.url && activeTab.url.includes("youtube.com")) {
      chrome.tabs.sendMessage(activeTab.id, { action: "WINDOW_FOCUSED" }).catch(() => {});
    }
  }
});

// Listen for tab updates (page navigation, reload)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.includes("youtube.com")) {
    // Page loaded - initialize state tracking
    chrome.tabs.sendMessage(tabId, { action: "INIT" }).catch(() => {});
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "VIDEO_STATE_CHANGED") {
    youtubeTabStates.set(sender.tab.id, {
      isPlaying: message.isPlaying,
      wasAutoPaused: message.wasAutoPaused
    });
  }
});