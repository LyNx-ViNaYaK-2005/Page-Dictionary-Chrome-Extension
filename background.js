chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (e) {
    console.error("Failed to inject content.js:", e);
  }
});
chrome.commands.onCommand.addListener(function(command) {
  if (command === "toggle-dictionary-mode") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        files: ["content.js"]
      });
    });
  }
});

