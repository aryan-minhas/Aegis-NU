// Content Script injected into target pages
console.log("Aegis-NU Content Script loaded on FlexStudent portal.");

// Listen for initial theme load
chrome.storage.local.get(["aegis_theme"], (result) => {
  applyGlobalTheme(result.aegis_theme || "Classic");
});

// Listen for real-time theme changes from the popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.aegis_theme) {
    applyGlobalTheme(changes.aegis_theme.newValue);
  }
});

function applyGlobalTheme(theme) {
  if (theme === "Midnight") {
    // Force a dark mode via CSS filters
    document.documentElement.style.filter = "invert(90%) hue-rotate(180deg)";
    document.body.style.backgroundColor = "#111";

    // Prevent images (like your profile picture) from looking like x-rays
    const images = document.querySelectorAll("img");
    images.forEach(
      (img) => (img.style.filter = "invert(100%) hue-rotate(180deg)"),
    );
  } else if (theme === "Nordic") {
    document.documentElement.style.filter =
      "sepia(20%) hue-rotate(190deg) saturate(80%)";
    document.body.style.backgroundColor = "#ECEFF4";
  } else {
    // Classic (Default)
    document.documentElement.style.filter = "none";
    document.body.style.backgroundColor = "";
    const images = document.querySelectorAll("img");
    images.forEach((img) => (img.style.filter = "none"));
  }
}
