// src/content/schedule.js

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

let sandboxSchedule = [];

function initScheduleBuilder() {
  if (document.getElementById("aegis-schedule-builder")) return;

  // 1. Inject Timetable UI
  const container = document.createElement("div");
  container.id = "aegis-schedule-builder";
  container.className =
    "my-6 mx-4 p-6 bg-white rounded-xl shadow-lg border border-gray-200 font-sans";
  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold text-blue-800">🗓️ Weekly Timetable Sandbox</h2>
      <div id="aegis-conflict-warning" class="hidden px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg border border-red-300">
        ⚠️ Conflict Detected! Overlapping courses highlighted in red.
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse min-w-max">
        <thead>
          <tr>
            <th class="border-b-2 border-gray-300 p-3 bg-gray-50 text-gray-700 font-semibold">Day / Time</th>
            ${TIME_SLOTS.map((time) => `<th class="border-b-2 border-gray-300 p-3 bg-gray-50 text-gray-700 font-semibold text-center">${time}</th>`).join("")}
          </tr>
        </thead>
        <tbody id="aegis-timetable-body">
          ${DAYS.map(
            (day) => `
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="border-b border-gray-200 p-3 font-medium text-gray-800 bg-gray-50">${day}</td>
              ${TIME_SLOTS.map((_, index) => `<td class="border-b border-gray-200 p-2 text-center relative" data-day="${day}" data-slot="${index}"></td>`).join("")}
            </tr>
          `,
          ).join("")}
        </tbody>
      </table>
    </div>
  `;

  const targetNode =
    document.querySelector(".page-content") ||
    document.querySelector("#page-wrapper") ||
    document.body;
  targetNode.insertBefore(container, targetNode.firstChild);

  // 2. Parse Courses and Add Buttons
  const tables = document.querySelectorAll("table");
  tables.forEach((table) => {
    const headers = Array.from(table.querySelectorAll("th")).map((th) =>
      th.textContent.trim().toLowerCase(),
    );

    // Check if this looks like a course table
    if (headers.some((h) => h.includes("course") || h.includes("title"))) {
      // Add 'Sandbox' column header if not exists
      const trHeader = table.querySelector("tr");
      if (trHeader && !trHeader.querySelector(".aegis-th")) {
        const th = document.createElement("th");
        th.className = "aegis-th p-2 text-center text-blue-600 font-bold";
        th.textContent = "Sandbox";
        trHeader.appendChild(th);
      }

      const rows = table.querySelectorAll("tr");
      rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) return; // Skip header

        const cells = row.querySelectorAll("td");
        if (cells.length > 2 && !row.querySelector(".aegis-add-btn")) {
          const courseName = cells[1]?.textContent.trim() || "Unknown Course";
          const courseCode = cells[0]?.textContent.trim() || "XXX-000";

          const td = document.createElement("td");
          td.className = "text-center p-2";

          const addBtn = document.createElement("button");
          addBtn.className =
            "aegis-add-btn px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow transition-colors text-sm";
          addBtn.innerHTML = "➕ Add to Sandbox";

          addBtn.addEventListener("click", (e) => {
            e.preventDefault();
            // Assign a pseudo-random day and time for demonstration if not parsed
            const randomDay = DAYS[Math.floor(Math.random() * DAYS.length)];
            const randomSlot = Math.floor(
              Math.random() * (TIME_SLOTS.length - 2),
            ); // 2-3 hour duration
            const duration = Math.random() > 0.5 ? 2 : 3;

            addCourseToSandbox({
              code: courseCode,
              name: courseName,
              day: randomDay,
              startSlot: randomSlot,
              duration: duration,
              id: Date.now().toString(),
            });
          });

          td.appendChild(addBtn);
          row.appendChild(td);
        }
      });
    }
  });
}

function addCourseToSandbox(course) {
  sandboxSchedule.push(course);
  renderTimetable();
}

function renderTimetable() {
  // Clear all cells
  document
    .querySelectorAll("#aegis-timetable-body td[data-day]")
    .forEach((td) => {
      td.innerHTML = "";
      td.className = "border-b border-gray-200 p-2 text-center relative"; // Reset classes
    });

  let hasConflict = false;
  const slotMap = new Map();

  // Map courses to slots to detect conflicts
  sandboxSchedule.forEach((course) => {
    for (let i = 0; i < course.duration; i++) {
      const slotKey = `${course.day}-${course.startSlot + i}`;
      if (!slotMap.has(slotKey)) {
        slotMap.set(slotKey, []);
      }
      slotMap.get(slotKey).push(course);
      if (slotMap.get(slotKey).length > 1) {
        hasConflict = true;
      }
    }
  });

  // Render blocks
  sandboxSchedule.forEach((course) => {
    const firstCell = document.querySelector(
      `td[data-day="${course.day}"][data-slot="${course.startSlot}"]`,
    );
    if (firstCell) {
      // Check if any slot for this course is conflicted
      let courseConflicted = false;
      for (let i = 0; i < course.duration; i++) {
        if (slotMap.get(`${course.day}-${course.startSlot + i}`).length > 1) {
          courseConflicted = true;
          break;
        }
      }

      const block = document.createElement("div");
      block.className = `absolute top-1 left-1 right-1 h-14 rounded-md shadow p-1 flex flex-col justify-center items-center text-xs font-semibold overflow-hidden transition-all duration-300 z-10 cursor-pointer hover:scale-105 ${
        courseConflicted
          ? "bg-red-500 text-white border-2 border-red-700 animate-pulse"
          : "bg-indigo-100 text-indigo-800 border border-indigo-300 hover:bg-indigo-200"
      }`;

      block.style.width = `calc(${course.duration * 100}% - 0.5rem)`;

      block.innerHTML = `
        <span class="block truncate w-full" title="${course.code}">${course.code}</span>
        <span class="block text-[10px] font-normal truncate w-full" title="${course.name}">${course.name}</span>
        <button class="absolute top-0 right-0 p-1 text-gray-500 hover:text-red-500 font-bold opacity-0 hover:opacity-100 transition-opacity" data-id="${course.id}">×</button>
      `;

      // Handle delete
      block.querySelector("button").addEventListener("click", (e) => {
        e.stopPropagation();
        sandboxSchedule = sandboxSchedule.filter((c) => c.id !== course.id);
        renderTimetable();
      });

      firstCell.appendChild(block);
    }
  });

  // Toggle warning
  const warningLabel = document.getElementById("aegis-conflict-warning");
  if (warningLabel) {
    if (hasConflict) {
      warningLabel.classList.remove("hidden");
    } else {
      warningLabel.classList.add("hidden");
    }
  }
}

// Run the initialization when the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScheduleBuilder);
} else {
  initScheduleBuilder();
}
