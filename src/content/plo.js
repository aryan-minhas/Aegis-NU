import Chart from "chart.js/auto";

// Aegis-NU PLO Radar Chart Content Script
console.log("Aegis-NU: PLO Module Loaded.");

if (window.location.href.includes("StudentPloRpt")) {
  setTimeout(initPloModule, 1000);
}

function initPloModule() {
  // 1. Find the table. Often in .portlet-body or similar
  const tables = document.querySelectorAll("table");
  let targetTable = null;

  for (let table of tables) {
    if (
      table.innerText.includes("PLO") ||
      table.innerText.includes("COG") ||
      table.innerText.includes("PSY")
    ) {
      targetTable = table;
      break;
    }
  }

  if (!targetTable) {
    console.warn("Aegis-NU: PLO table not found.");
    return;
  }

  const headers = Array.from(
    targetTable.querySelectorAll(
      "thead th, tbody tr:first-child td, tbody tr:first-child th",
    ),
  ).map((th) => th.innerText.trim().toUpperCase());

  // Fallback if headers are hard to parse
  const data = {
    COG: [],
    PSY: [],
    AFF: [],
    PLO1: [],
    PLO2: [],
    PLO3: [],
    PLO4: [],
    PLO5: [],
    PLO6: [],
    PLO7: [],
    PLO8: [],
    PLO9: [],
    PLO10: [],
  };

  const rows = Array.from(targetTable.querySelectorAll("tbody tr"));
  // skip header rows if any
  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length < 5) return; // Not a data row

    cells.forEach((cell, index) => {
      const val = parseFloat(cell.innerText);
      if (isNaN(val)) return;

      // Try to match index with header
      const header = headers[index] || "";
      if (header.includes("COG")) data.COG.push(val);
      else if (header.includes("PSY")) data.PSY.push(val);
      else if (header.includes("AFF")) data.AFF.push(val);
      else {
        for (let i = 1; i <= 10; i++) {
          if (header.includes(`PLO${i}`) || header === i.toString()) {
            data[`PLO${i}`].push(val);
            break;
          }
        }
      }
    });
  });

  // 3. Calculate averages
  const averages = {};
  Object.keys(data).forEach((key) => {
    const arr = data[key];
    averages[key] =
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  });

  // 4. Inject canvas
  const container = document.createElement("div");
  container.className =
    "aegis-plo-chart bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm flex flex-col items-center justify-center";
  container.style.cssText =
    "background-color:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:24px; margin-bottom:24px; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05); display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; max-width:800px; margin-left:auto; margin-right:auto;";

  const title = document.createElement("h2");
  title.innerText = "Aegis-NU PLO & Domain Attainment Radar";
  title.style.cssText =
    "font-family:system-ui, -apple-system, sans-serif; font-size:1.25rem; font-weight:700; color:#0f172a; margin-bottom:16px;";

  const canvasContainer = document.createElement("div");
  canvasContainer.style.cssText =
    "position:relative; height:40vh; width:100%; max-height:400px;";

  const canvas = document.createElement("canvas");
  canvasContainer.appendChild(canvas);
  container.appendChild(title);
  container.appendChild(canvasContainer);

  targetTable.parentNode.insertBefore(container, targetTable);

  // 5. Render Radar Chart
  const ctx = canvas.getContext("2d");

  // Prepare data for Chart.js
  const labels = [
    "COG",
    "PSY",
    "AFF",
    "PLO1",
    "PLO2",
    "PLO3",
    "PLO4",
    "PLO5",
    "PLO6",
    "PLO7",
    "PLO8",
    "PLO9",
    "PLO10",
  ];
  const chartData = labels.map((label) => averages[label] || 0);

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Average Attainment (%)",
          data: chartData,
          backgroundColor: "rgba(14, 165, 233, 0.2)", // Tailwind sky-500
          borderColor: "rgba(14, 165, 233, 1)",
          pointBackgroundColor: "rgba(2, 132, 199, 1)", // Tailwind sky-600
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(2, 132, 199, 1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: {
            color: "rgba(203, 213, 225, 0.5)", // slate-300
          },
          grid: {
            color: "rgba(203, 213, 225, 0.5)",
          },
          pointLabels: {
            color: "#475569", // slate-600
            font: {
              family: "system-ui, -apple-system, sans-serif",
              size: 12,
              weight: "600",
            },
          },
          ticks: {
            backdropColor: "transparent",
            color: "#94a3b8", // slate-400
            z: 10,
          },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: {
              family: "system-ui, -apple-system, sans-serif",
            },
            color: "#334155",
          },
        },
      },
    },
  });
}
