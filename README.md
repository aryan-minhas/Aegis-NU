# Aegis-NU 🛡️

**Aegis-NU** is a modern, high-performance browser extension designed to revolutionize the student experience for FAST-NUCES students. Built with **React**, **Vite**, and **Tailwind CSS**, it brings a suite of intelligent automation tools directly into the FlexStudent portal.

## ✨ Features

- 🏎️ **Silent Fetcher:** Blazing fast data retrieval for attendance, marks, and profiles.
- 📅 **Visual Schedule Builder:** Transform your tentative study plan into a beautiful, interactive weekly calendar.
- 📊 **Radar Charts:** Visualize your PLO (Program Learning Objectives) performance with interactive spider charts.
- 🎯 **Target Grade Calculator:** Automatically solve for your absolute marks and calculate what you need in the final exam to hit your target grade.
- 📉 **Live GPA Calculator:** Experiment with potential grades on your transcript page to see live SGPA and CGPA updates.
- 🚦 **Safe-to-Skip Attendance:** Real-time calculation of how many lectures you can safely skip while staying above the 80% threshold.
- 💰 **Fee Alerts & Challan Tools:** Instant overview of pending dues and one-click challan access.
- ✨ **Autofill Course Feedback:** Save time with randomized, positive feedback generation for end-of-semester evaluations.

## 🛠️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Visualization:** Chart.js
- **Manifest:** Version 3 (Latest Chrome Standards)

## 🚀 Installation Instructions

### For Users (Loading Unpacked)
1. **Download the Repository:** Clone this repo or download the ZIP and extract it.
2. **Build the Project:**
   ```bash
   npm install
   npm run build
   ```
3. **Open Chrome Extensions:** Navigate to `chrome://extensions/` in your browser.
4. **Enable Developer Mode:** Toggle the switch in the top-right corner.
5. **Load Unpacked:** Click "Load unpacked" and select the `dist` folder generated in the project directory.

### For Developers
- **Dev Mode:** `npm run dev` (for popup development with HMR).
- **Production Build:** `npm run build` (generates the `dist` folder).
- **Release Package:** `npm run build:zip` (creates a ready-to-ship `.zip` file).

## 🎨 Themes
Aegis-NU comes with a built-in **Theme Engine** accessible via the popup:
- **Classic:** Clean, professional white/blue aesthetic.
- **Midnight:** Deep slate/indigo dark mode for late-night study sessions.
- **Nordic:** A soft, frost-inspired theme for a calming experience.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ for the FAST-NUCES community.
