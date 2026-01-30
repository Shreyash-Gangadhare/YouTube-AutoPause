const checkbox = document.getElementById('enabled');

chrome.storage.sync.get(['enabled'], (result) => {
  checkbox.checked = result.enabled !== false;
});

checkbox.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: checkbox.checked });
});