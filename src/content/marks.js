// Aegis-NU Marks & Target Grade Content Script
console.log("Aegis-NU: Marks Module Loaded.");

if (window.location.href.includes("StudentMarks")) {
  setTimeout(initMarksModule, 1500); // Marks load dynamically, need a longer delay
}

// Message Listener for manual trigger
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "triggerMarks") {
    initMarksModule();
    sendResponse({ status: "success" });
  }
});

function initMarksModule() {
  const courseTabs = document.querySelectorAll(".tab-pane");

  courseTabs.forEach((tab) => {
    // Prevent duplicate widgets
    if (tab.querySelector(".aegis-target-widget")) return;

    // 1. Auto-Solve Grand Total
    const calculationRows = tab.querySelectorAll(".calculationrow");
    if (calculationRows.length === 0) return;

    let totalWeightage = 0;
    let totalObtained = 0;
    let finalExamWeightage = 0; // Assume standard Final Exam logic

    calculationRows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 5) return;

      // FlexStudent Marks table structure (varies slightly, but generally):
      // Name | Total | Obtained | Average | Min | Max | Weightage
      // We'll look for numeric values in the last few columns
      const rowText = row.innerText.toUpperCase();

      // Heuristic to find Obtained and Weightage
      // Usually, Weightage is the last column, Obtained is somewhere in the middle
      const obtainedCell = cells[2];
      const weightageCell = cells[cells.length - 1];

      const obtained = parseFloat(obtainedCell.innerText);
      const weightage = parseFloat(weightageCell.innerText);

      if (!isNaN(obtained) && !isNaN(weightage)) {
        // Approximate ratio. If a quiz is 10 marks and weightage is 2.5%,
        // obtained of 8 means (8/10)*2.5 = 2.0 weighted marks.
        // We'll assume the 'Obtained' column in calculationrow is ALREADY the weighted absolute if it's a summary row,
        // OR we need to calculate it. Let's assume FlexStudent's 'Obtained' in .calculationrow is absolute.

        // For this widget, we'll trust the visible numbers
        totalWeightage += weightage;
        totalObtained += obtained;

        if (rowText.includes("FINAL") || rowText.includes("FINALS")) {
          finalExamWeightage = weightage;
        }
      }
    });

    // 2. Inject Target Grade Calculator Widget
    injectTargetWidget(tab, totalObtained, totalWeightage, finalExamWeightage);
  });
}

function injectTargetWidget(
  container,
  currentObtained,
  currentWeightage,
  finalExamWeight,
) {
  // Standard absolute grading thresholds (approximate)
  const THRESHOLDS = {
    "A+": 90,
    A: 86,
    "A-": 82,
    "B+": 78,
    B: 74,
    "B-": 70,
    "C+": 66,
    C: 62,
    "C-": 58,
    "D+": 54,
    D: 50,
  };

  // Remaining weightage (assuming total is 100)
  const remainingWeightage = 100 - currentWeightage;

  const widget = document.createElement("div");
  widget.className =
    "aegis-target-widget bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 font-sans";

  // Inline fallback styles
  widget.style.display = "flex";
  widget.style.justifyContent = "space-between";
  widget.style.backgroundColor = "#f8fafc";
  widget.style.border = "1px solid #e2e8f0";
  widget.style.padding = "16px";
  widget.style.marginBottom = "16px";
  widget.style.borderRadius = "8px";

  const leftSide = document.createElement("div");
  leftSide.innerHTML = `
        <div style="font-size:0.875rem; color:#64748b; font-weight:600; text-transform:uppercase;">Current Absolute</div>
        <div style="font-size:1.5rem; font-weight:700; color:#0f172a;">${currentObtained.toFixed(2)} <span style="font-size:1rem; color:#94a3b8;">/ ${currentWeightage.toFixed(2)}</span></div>
    `;

  const rightSide = document.createElement("div");
  rightSide.className = "flex items-center gap-3";
  rightSide.style.display = "flex";
  rightSide.style.gap = "12px";
  rightSide.style.alignItems = "center";

  const select = document.createElement("select");
  select.className =
    "border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none";
  select.style.padding = "8px";
  select.style.borderRadius = "4px";
  select.style.border = "1px solid #cbd5e1";

  Object.keys(THRESHOLDS).forEach((grade) => {
    const option = document.createElement("option");
    option.value = grade;
    option.text = `Target ${grade}`;
    select.appendChild(option);
  });

  const resultSpan = document.createElement("div");
  resultSpan.className = "text-sm font-medium text-slate-700";
  resultSpan.style.fontSize = "0.875rem";

  // Calculate required logic
  const calculateRequired = () => {
    const targetGrade = select.value;
    const targetMarks = THRESHOLDS[targetGrade];

    const requiredAbsolute = targetMarks - currentObtained;

    if (requiredAbsolute <= 0) {
      resultSpan.innerHTML = `<span style="color:#16a34a;">Already achieved! 🎉</span>`;
    } else if (requiredAbsolute > remainingWeightage) {
      resultSpan.innerHTML = `<span style="color:#dc2626;">Requires ${requiredAbsolute.toFixed(2)} (Impossible, max remaining is ${remainingWeightage.toFixed(2)})</span>`;
    } else {
      // Calculate what percentage that means on the remaining tasks
      const requiredPercentage = (requiredAbsolute / remainingWeightage) * 100;
      resultSpan.innerHTML = `Need <strong style="color:#2563eb;">${requiredAbsolute.toFixed(2)}</strong> absolute marks (${requiredPercentage.toFixed(1)}% of remaining)`;
    }
  };

  select.addEventListener("change", calculateRequired);

  rightSide.appendChild(select);
  rightSide.appendChild(resultSpan);

  widget.appendChild(leftSide);
  widget.appendChild(rightSide);

  // Initial calculation
  calculateRequired();

  // Insert at the top of the tab
  container.insertBefore(widget, container.firstChild);
}
