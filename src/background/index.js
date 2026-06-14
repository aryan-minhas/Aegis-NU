// Background Service Worker
console.log('Aegis-NU Background Service Worker initialized.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Aegis-NU extension successfully installed.');
  // Future initialization logic goes here (e.g., setting up default storage state)
});
