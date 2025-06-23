// background.js (service worker)


chrome.runtime.onInstalled.addListener(function () {
  console.log("Time Tracking Extension Installed");
});

chrome.action.onClicked.addListener(() => {
  const baseUrl = chrome.runtime.getURL('index.html');
chrome.tabs.create({ url: `${baseUrl}#/login` });
});




// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "LOGIN") {
    // Store the JWT token in chrome storage when the user logs in
    chrome.storage.local.set({ jwtToken: message.token }, () => {
      console.log("JWT token saved.");
      sendResponse({ status: "logged in" });
    });
    return true; // Indicating that sendResponse will be called asynchronously
  }

  if (message.type === "LOGOUT") {
    // Clear the JWT token from chrome storage when the user logs out
    chrome.storage.local.remove("jwtToken", () => {
      console.log("JWT token removed.");
      sendResponse({ status: "logged out" });
    });
    return true;
  }

  if (message.type === "CHECK_LOGIN_STATUS") {
    // Check if the JWT token exists in chrome storage
    chrome.storage.local.get("jwtToken", (data) => {
      if (data.jwtToken) {
        sendResponse({ status: "logged in", token: data.jwtToken });
      } else {
        sendResponse({ status: "not logged in" });
      }
    });
    return true;
  }
});
