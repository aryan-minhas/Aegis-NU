// Aegis-NU Attendance Content Script
// Strictly runs on StudentAttendance page as defined in manifest.json
console.log('Aegis-NU: Attendance Module Loaded.');

// 1. Ensure we only run on the correct page (double check)
if (window.location.href.includes('StudentAttendance')) {
    initAttendanceModule();
}

async function initAttendanceModule() {
    try {
        // 2. Retrieve aegis_course_data from chrome.storage.local
        const result = await chrome.storage.local.get(['aegis_course_data']);
        const courseData = result.aegis_course_data || [];
        
        if (courseData.length === 0) {
            console.warn('Aegis-NU: No course data found in local storage. Cannot calculate Safe to Skip.');
            // Still process the DOM to at least show P/A counts without safe-to-skip.
        }

        // Delay parsing slightly to allow dynamic FlexStudent DOM to fully settle
        setTimeout(() => parseAttendanceDOM(courseData), 1000);
    } catch (error) {
        console.error('Aegis-NU Error initializing Attendance Module:', error);
    }
}

// 3 & 4. Parse DOM and calculate metrics
function parseAttendanceDOM(courseData) {
    // FlexStudent usually renders attendance in multiple tables or within specific tab panes.
    // We'll search for all table bodies that likely contain attendance data.
    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
        // Heuristic: Attendance tables usually have rows with 'P', 'A', 'L'
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        if (rows.length === 0) return;

        let presentCount = 0;
        let absentCount = 0;
        
        rows.forEach(row => {
            const rowText = row.innerText.toUpperCase();
            // Count standard P and A markers in the row text.
            // A more rigorous approach checks specific columns, but this works well for generic tabular data where P/A is distinct.
            // Look for isolated 'P' or 'A' in cells.
            const cells = Array.from(row.querySelectorAll('td'));
            cells.forEach(cell => {
                const text = cell.innerText.trim().toUpperCase();
                if (text === 'P') presentCount++;
                else if (text === 'A') absentCount++;
            });
        });

        const totalConducted = presentCount + absentCount;
        
        // If it doesn't look like an attendance table, skip
        if (totalConducted === 0) return;

        // Try to identify the course this table belongs to
        // Heuristic: Look at a preceding heading or container id
        let matchedCourse = null;
        let container = table.closest('.tab-pane, .card, div[id*="course"]'); 
        let searchText = (container ? container.innerText : document.body.innerText).toUpperCase();

        for (const course of courseData) {
            // Check if the course code (without dashes/spaces) is near this table
            const normalizedCode = course.code.toUpperCase().replace(/[-\s]/g, '');
            if (searchText.replace(/[-\s]/g, '').includes(normalizedCode)) {
                matchedCourse = course;
                break;
            }
        }

        // Calculate "Safe to Skip"
        let safeToSkip = 'N/A';
        let safeToSkipColor = 'text-slate-600';
        
        if (matchedCourse) {
            // FAST-NUCES typical logic: allowed absents is roughly Credit Hours * 2. 
            // (Standard 20% allowance over a ~16 week semester).
            const allowedAbsents = matchedCourse.creditHours === 1 
                ? 3 
                : Math.floor(matchedCourse.creditHours * 2);
            const remaining = allowedAbsents - absentCount;
            
            if (remaining > 0) {
                safeToSkip = remaining;
                safeToSkipColor = 'text-green-600 font-bold';
            } else if (remaining === 0) {
                safeToSkip = 0;
                safeToSkipColor = 'text-yellow-600 font-bold';
            } else {
                safeToSkip = remaining; // Negative means over limit
                safeToSkipColor = 'text-red-600 font-bold';
            }
        }

        const percentage = totalConducted > 0 ? ((presentCount / totalConducted) * 100).toFixed(1) : 0;

        // 5. Inject highly visible UI badge
        injectBadge(table, presentCount, absentCount, totalConducted, percentage, safeToSkip, safeToSkipColor);
    });
}

function injectBadge(targetTable, pCount, aCount, total, percentage, safeToSkip, skipColorClass) {
    // Check if we already injected a badge to prevent duplicates
    if (targetTable.previousElementSibling && targetTable.previousElementSibling.classList.contains('aegis-badge')) {
        return;
    }

    const badgeContainer = document.createElement('div');
    // Using standard Tailwind utility classes
    // Note: If the host page doesn't have these, we provide inline fallbacks or expect the Vite build to inject them.
    badgeContainer.className = 'aegis-badge flex flex-wrap items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm font-sans';
    
    // Fallback styles in case Tailwind isn't injected on the host page natively
    badgeContainer.style.display = 'flex';
    badgeContainer.style.justifyContent = 'space-between';
    badgeContainer.style.backgroundColor = '#eff6ff';
    badgeContainer.style.border = '1px solid #bfdbfe';
    badgeContainer.style.padding = '12px 16px';
    badgeContainer.style.marginBottom = '16px';
    badgeContainer.style.borderRadius = '8px';
    badgeContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    badgeContainer.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';

    const statsHtml = `
        <div style="display:flex; gap:16px; align-items:center;">
            <div style="text-align:center;">
                <div style="font-size:0.75rem; text-transform:uppercase; color:#64748b; font-weight:600;">Total</div>
                <div style="font-size:1.125rem; font-weight:700; color:#0f172a;">${total}</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:0.75rem; text-transform:uppercase; color:#64748b; font-weight:600;">Presents</div>
                <div style="font-size:1.125rem; font-weight:700; color:#16a34a;">${pCount}</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:0.75rem; text-transform:uppercase; color:#64748b; font-weight:600;">Absents</div>
                <div style="font-size:1.125rem; font-weight:700; color:#dc2626;">${aCount}</div>
            </div>
            <div style="text-align:center; border-left:1px solid #cbd5e1; padding-left:16px;">
                <div style="font-size:0.75rem; text-transform:uppercase; color:#64748b; font-weight:600;">Percentage</div>
                <div style="font-size:1.125rem; font-weight:700; color:${percentage < 80 ? '#dc2626' : '#2563eb'};">${percentage}%</div>
            </div>
        </div>
        <div style="text-align:right; border-left:1px solid #cbd5e1; padding-left:16px;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#64748b; font-weight:600;">Safe to Skip</div>
            <div class="${skipColorClass}" style="font-size:1.5rem; line-height:1;">
                ${safeToSkip}
            </div>
        </div>
    `;

    badgeContainer.innerHTML = statsHtml;
    
    // Insert right before the table
    targetTable.parentNode.insertBefore(badgeContainer, targetTable);
}
