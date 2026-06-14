// Background Service Worker for Aegis-NU
console.log('Aegis-NU Background Service Worker initialized.');

// A flag to debounce rapid successive page loads
let isFetchingTranscript = false;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Aegis-NU extension successfully installed.');
});

// 1. Event Listener: Detect when user loads a page on flexstudent.nu.edu.pk
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed when the page is fully loaded and it's the target domain
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('flexstudent.nu.edu.pk')) {
    console.log('Aegis-NU: FlexStudent portal loaded. Initiating silent fetch...');
    fetchTranscriptData();
  }
});

// 2. Silent Fetch & 5. Error Handling
async function fetchTranscriptData() {
  if (isFetchingTranscript) return;
  isFetchingTranscript = true;

  try {
    // The browser automatically attaches the user's active session cookies
    const response = await fetch('https://flexstudent.nu.edu.pk/Student/Transcript');
    
    // Check if the fetch failed at the network/server level
    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
    }
    
    // If we are redirected to a login page, the session has expired or user is logged out
    if (response.url.toLowerCase().includes('login')) {
      console.warn('Aegis-NU: User is not logged in. Transcript fetch aborted.');
      isFetchingTranscript = false;
      return;
    }

    const htmlString = await response.text();
    
    // 3. Data Parsing
    const courseData = parseTranscriptHTML(htmlString);
    
    // 4. State Storage
    if (courseData && courseData.length > 0) {
      await chrome.storage.local.set({ aegis_course_data: courseData });
      console.log('Aegis-NU: Successfully saved course data to local storage.', courseData);
    } else {
      console.warn('Aegis-NU: Could not extract course data. The HTML structure might have changed.');
    }

  } catch (error) {
    console.error('Aegis-NU: Error during background transcript fetch:', error);
  } finally {
    // Reset flag after a delay to debounce rapid successive page loads
    setTimeout(() => {
      isFetchingTranscript = false;
    }, 5000); 
  }
}

/**
 * Parses the raw HTML string of the transcript page to extract course details.
 * Since DOMParser is not natively available in Manifest V3 Service Workers, 
 * we use a robust regex and string-parsing heuristic.
 * 
 * @param {string} html The raw HTML string fetched from the transcript page.
 * @returns {Array<{code: string, name: string, creditHours: number}>} Array of course objects.
 */
function parseTranscriptHTML(html) {
  const courses = [];
  
  // Extract all table rows (<tr>...</tr>)
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    
    // Extract all table data cells (<td>...</td>) in this row
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        // Strip inner HTML tags and trim whitespace to get plain text
        const cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
        cells.push(cellText);
    }
    
    // Attempt to identify standard course row patterns.
    // Course codes at FAST-NUCES typically look like "CS-101", "MT104", "EE 220".
    if (cells.length >= 3) {
        const codePattern = /^[A-Z]{2,3}\s*-?\s*\d{3,4}$/i;
        
        let codeIndex = -1;
        // Search the row cells to find which column holds the course code
        for (let i = 0; i < cells.length; i++) {
            if (codePattern.test(cells[i])) {
                codeIndex = i;
                break;
            }
        }
        
        // If a valid course code is found and there are enough columns following it
        if (codeIndex !== -1 && cells.length > codeIndex + 2) {
            const courseCode = cells[codeIndex];
            const courseName = cells[codeIndex + 1]; // Name usually follows Code
            const creditHoursStr = cells[codeIndex + 2]; // CrHrs usually follows Name
            
            // Basic validation to ensure we extracted legitimate data
            if (courseCode && courseName && !isNaN(parseFloat(creditHoursStr))) {
                courses.push({
                    code: courseCode,
                    name: courseName,
                    creditHours: parseFloat(creditHoursStr)
                });
            }
        }
    }
  }
  
  // Deduplicate courses in case they appear multiple times (e.g., repeated semesters, retakes)
  const uniqueCourses = [];
  const seenCodes = new Set();
  
  for (const course of courses) {
      // Normalize code to uppercase and remove spaces/dashes for strict deduplication
      const normalizedCode = course.code.toUpperCase().replace(/[-\s]/g, '');
      if (!seenCodes.has(normalizedCode)) {
          seenCodes.add(normalizedCode);
          uniqueCourses.push(course);
      }
  }
  
  return uniqueCourses;
}
