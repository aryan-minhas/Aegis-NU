// Background Service Worker for Aegis-NU
console.log("Aegis-NU Background Service Worker initialized.");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Aegis-NU extension successfully installed.");
});

// We have disabled the silent background transcript fetcher.
// The FAST-NUCES FlexStudent server uses strict anti-forgery tokens.
// Concurrent background fetch() requests invalidate the user's active session,
// resulting in a 500 Internal Server Error and instantly logging the user out.
