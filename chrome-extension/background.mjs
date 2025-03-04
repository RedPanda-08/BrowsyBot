// Background.js with improved error handling

const SERVER_URL = "http://localhost:3000";
const lastSavedUrl = new Set();

// Function to check if server is reachable
async function isServerReachable() {
  try {
    const response = await fetch(`${SERVER_URL}/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    return response.ok;
  } catch (error) {
    console.error("Server connection check failed:", error);
    return false;
  }
}

// Improved save history function with retry logic
async function saveHistory(tab) {
  // First check if server is reachable
  if (!(await isServerReachable())) {
    console.error("Server is not reachable. Will retry later.");
    showErrorNotification();
    return;
  }

  const pageData = {
    url: tab.url,
    title: tab.title || "Untitled",
    note: "Auto-saved",
    tag: "auto"
  };

  try {
    console.log("Sending data to server:", pageData);
    
    const response = await fetch(`${SERVER_URL}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pageData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("History saved successfully:", data);
      showSavedNotification();
    } else {
      console.error("Server returned error:", data);
      showErrorNotification();
    }
  } catch (error) {
    console.error("Error saving history:", error);
    showErrorNotification();
  }
}

function showSavedNotification() {
  chrome.action.setBadgeText({ text: "✓" });
  chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 2000);
}

function showErrorNotification() {
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#F44336" });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 3000);
}

// Improved tab tracking with error handling
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && 
      tab.url && 
      tab.url.startsWith("http") && 
      !tab.url.startsWith("chrome://") && 
      !tab.url.startsWith("chrome-extension://")) {
    
    if (!lastSavedUrl.has(tab.url)) {
      lastSavedUrl.add(tab.url);
      
      if (lastSavedUrl.size > 100) {
        lastSavedUrl.clear();
      }
      
      saveHistory(tab);
    }
  }
});

// Listen for install event to check server connection
chrome.runtime.onInstalled.addListener(async () => {
  const serverAvailable = await isServerReachable();
  if (!serverAvailable) {
    console.warn("Warning: Could not connect to history server. Make sure it's running at " + SERVER_URL);
  } else {
    console.log("Successfully connected to history server at " + SERVER_URL);
  }
});