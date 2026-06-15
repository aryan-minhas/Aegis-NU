// Aegis-NU Academic Calendar Exporter
console.log("Aegis-NU: Profile/Calendar Module Loaded.");

if (
  window.location.href.includes("StudentProfile") ||
  window.location.href.includes("Home")
) {
  setTimeout(initProfileModule, 1500);
}

function initProfileModule() {
  // Look for the Academic Calendar section
  const headings = Array.from(
    document.querySelectorAll("h1, h2, h3, h4, h5, .caption-subject"),
  );
  let calendarHeader = null;

  for (let h of headings) {
    if (h.innerText.toUpperCase().includes("ACADEMIC CALENDAR")) {
      calendarHeader = h;
      break;
    }
  }

  if (!calendarHeader) return;

  // Find the container for the calendar (usually the closest portlet or card)
  const container =
    calendarHeader.closest(".portlet, .card, .dashboard-stat") ||
    calendarHeader.parentNode;

  // Inject download button
  const btn = document.createElement("button");
  btn.innerText = "📅 Download .ics Calendar";
  btn.className =
    "aegis-ics-btn bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-md shadow-sm transition-colors mt-2 mb-4";

  // Inline fallback
  btn.style.cssText =
    "background-color: #2563eb; color: #fff; font-size: 0.875rem; font-weight: 600; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; margin-bottom: 16px; font-family: system-ui; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);";

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    generateAndDownloadICS(container);
  });

  // Insert right after the header
  calendarHeader.parentNode.insertBefore(btn, calendarHeader.nextSibling);
}

function generateAndDownloadICS(container) {
  // 4. Parse dates
  // Assuming the calendar is rendered as a list or table within the container
  const items = Array.from(container.querySelectorAll("li, tr"));
  const events = [];

  items.forEach((item) => {
    const text = item.innerText.trim();
    if (!text) return;

    // Try to parse event name and date(s)
    const parts = text.split(":");
    if (parts.length >= 2) {
      const eventName = parts[0].trim();
      const dateStr = parts.slice(1).join(":").trim(); // Rejoin in case of extra colons

      // Extract dates using regex
      const dateRegex = /(\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{2,4})/g;
      const matches = dateStr.match(dateRegex);

      if (matches && matches.length > 0) {
        const startDateStr = matches[0];
        const endDateStr = matches.length > 1 ? matches[1] : matches[0];

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (!isNaN(startDate) && !isNaN(endDate)) {
          // ICS requires end dates for all-day events to be the NEXT day
          endDate.setDate(endDate.getDate() + 1);

          events.push({
            name: eventName,
            start: startDate,
            end: endDate,
          });
        }
      }
    }
  });

  if (events.length === 0) {
    alert("Aegis-NU: Could not parse any dates from the Academic Calendar.");
    return;
  }

  // Generate ICS string
  let icsContent =
    "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Aegis-NU//Academic Calendar//EN\nCALSCALE:GREGORIAN\n";

  events.forEach((evt) => {
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `SUMMARY:${evt.name}\n`;
    icsContent += `DTSTART;VALUE=DATE:${formatDateICS(evt.start)}\n`;
    icsContent += `DTEND;VALUE=DATE:${formatDateICS(evt.end)}\n`;
    icsContent += "DESCRIPTION:Imported via Aegis-NU Chrome Extension\n";
    icsContent += `UID:${formatDateICS(evt.start)}-${Math.random().toString(36).substring(2, 11)}@aegis-nu.edu.pk\n`;
    icsContent += "END:VEVENT\n";
  });

  icsContent += "END:VCALENDAR";

  // 5. Trigger download
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Aegis_Academic_Calendar.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDateICS(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}
