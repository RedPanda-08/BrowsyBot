console.log("Content script loaded...");

// Get the current page details
const pageData = {
    url: window.location.href,
    title: document.title,
    note: "",  // You can allow users to add notes manually
    tag: "general"
};

// Send data to Express.js server
fetch("http://localhost:3000/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pageData)
})
.then(response => response.json())
.then(data => console.log("Page Saved:", data))
.catch(error => console.error("Error saving page:", error));

// Modified to remove timestamp tracking
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const visitData = {
            url: tab.url,
            title: tab.title
        };
    }
});