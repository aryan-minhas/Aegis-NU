// Aegis-NU GPA Calculator Content Script
console.log('Aegis-NU: GPA Module Loaded.');

const GRADE_POINTS = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.67,
    'B+': 3.33, 'B': 3.0, 'B-': 2.67,
    'C+': 2.33, 'C': 2.0, 'C-': 1.67,
    'D+': 1.33, 'D': 1.0, 'F': 0.0,
    'I': null, 'W': null // Incomplete/Withdrawn don't affect GPA
};

if (window.location.href.includes('Transcript')) {
    setTimeout(initGPAModule, 1000);
}

// Message Listener for manual trigger
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'triggerGPA') {
        initGPAModule();
        sendResponse({ status: 'success' });
    }
});

function initGPAModule() {
    // Prevent duplicate injection
    if (document.querySelector('.aegis-live-gpa')) return;

    // Target the tables inside the transcript view. 
    // FlexStudent typically lays out semesters in .col-md-6 blocks
    const semesterBlocks = document.querySelectorAll('.col-md-6');
    if (semesterBlocks.length === 0) return;

    // We specifically want to target the last semester block for interactive calculation
    const lastSemesterBlock = semesterBlocks[semesterBlocks.length - 1];
    const table = lastSemesterBlock.querySelector('table');
    if (!table) return;

    // Keep track of the original state to calculate CGPA
    // Find where SGPA and CGPA are displayed at the bottom of the table
    // FlexStudent puts them in the last few rows or a summary section
    let sgpaElement = null;
    let cgpaElement = null;
    let originalTotalCreditHours = 0;
    let originalTotalPoints = 0;

    // Simple heuristic to find existing CGPA to base off of
    const allText = document.body.innerText;
    const cgpaMatch = allText.match(/CGPA[\s:]*([\d.]+)/i);
    const sgpaMatch = lastSemesterBlock.innerText.match(/SGPA[\s:]*([\d.]+)/i);

    let currentCGPA = cgpaMatch ? parseFloat(cgpaMatch[1]) : 0;
    let currentSGPA = sgpaMatch ? parseFloat(sgpaMatch[1]) : 0;
    
    // Attempt to extract total credit hours from the page to make CGPA math accurate
    // This is a rough estimation if the exact totals aren't easily scrapable
    const crHrMatch = allText.match(/Total Earned Cr\. Hrs[\s:]*([\d.]+)/i);
    let totalEarnedCrHrs = crHrMatch ? parseFloat(crHrMatch[1]) : 0;

    // If we can't find it, we'll just do a rough relative calculation
    if (totalEarnedCrHrs === 0) totalEarnedCrHrs = 100; // arbitrary fallback

    // Create a container to show our live calculations
    const liveStatsContainer = document.createElement('div');
    liveStatsContainer.className = 'aegis-live-gpa flex gap-4 p-3 mt-2 rounded border border-blue-200 bg-blue-50';
    liveStatsContainer.innerHTML = `
        <div class="flex-1 text-center">
            <div class="text-xs text-slate-500 uppercase font-bold">Live SGPA</div>
            <div class="live-sgpa text-xl font-bold text-blue-700">${currentSGPA.toFixed(2)}</div>
        </div>
        <div class="flex-1 text-center border-l border-blue-200">
            <div class="text-xs text-slate-500 uppercase font-bold">Live CGPA</div>
            <div class="live-cgpa text-xl font-bold text-blue-700">${currentCGPA.toFixed(2)}</div>
        </div>
    `;
    table.parentNode.insertBefore(liveStatsContainer, table.nextSibling);

    const liveSgpaEl = liveStatsContainer.querySelector('.live-sgpa');
    const liveCgpaEl = liveStatsContainer.querySelector('.live-cgpa');

    // Parse the rows
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const courses = [];

    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return; // Need at least Code, Name, CrHr, Pts, Grade

        // Assuming standard FlexStudent layout: 
        // 0: Code, 1: Name, 2: CrHr, 3: Pts, 4: Grade
        const crHrText = cells[2].innerText.trim();
        const gradeCell = cells[4];
        const originalGrade = gradeCell.innerText.trim().toUpperCase();
        
        const crHrs = parseFloat(crHrText);
        
        if (isNaN(crHrs)) return;

        const courseData = {
            row: row,
            crHrs: crHrs,
            originalGrade: originalGrade,
            currentGrade: originalGrade
        };
        courses.push(courseData);

        // Replace grade text with a dropdown
        const select = document.createElement('select');
        select.className = 'border border-slate-300 rounded p-1 text-sm bg-white cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all';
        
        Object.keys(GRADE_POINTS).forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.text = grade;
            if (grade === originalGrade) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Listen for changes
        select.addEventListener('change', (e) => {
            courseData.currentGrade = e.target.value;
            // Update the row visual styling slightly to indicate it's modified
            row.classList.add('bg-yellow-50');
            recalculateGPA();
        });

        gradeCell.innerHTML = '';
        gradeCell.appendChild(select);
    });

    function recalculateGPA() {
        let newSemesterPts = 0;
        let semesterCrHrs = 0;

        let originalSemesterPts = 0;

        courses.forEach(course => {
            const currentPoints = GRADE_POINTS[course.currentGrade];
            const originalPoints = GRADE_POINTS[course.originalGrade];

            if (currentPoints !== null) {
                newSemesterPts += (currentPoints * course.crHrs);
                originalSemesterPts += (originalPoints * course.crHrs);
                semesterCrHrs += course.crHrs;
            }
        });

        // Calculate new SGPA
        const newSgpa = semesterCrHrs > 0 ? (newSemesterPts / semesterCrHrs) : 0;
        liveSgpaEl.innerText = newSgpa.toFixed(2);

        // Calculate new relative CGPA (This is an approximation based on difference)
        const ptsDifference = newSemesterPts - originalSemesterPts;
        
        // Base points = CGPA * Total CrHrs. New points = Base points + difference.
        const estimatedBasePoints = currentCGPA * totalEarnedCrHrs;
        const newEstimatedCgpa = (estimatedBasePoints + ptsDifference) / totalEarnedCrHrs;
        
        liveCgpaEl.innerText = newEstimatedCgpa.toFixed(2);

        // Color coding
        liveSgpaEl.className = \`live-sgpa text-xl font-bold \${newSgpa > currentSGPA ? 'text-green-600' : newSgpa < currentSGPA ? 'text-red-600' : 'text-blue-700'}\`;
        liveCgpaEl.className = \`live-cgpa text-xl font-bold \${newEstimatedCgpa > currentCGPA ? 'text-green-600' : newEstimatedCgpa < currentCGPA ? 'text-red-600' : 'text-blue-700'}\`;
    }
}
