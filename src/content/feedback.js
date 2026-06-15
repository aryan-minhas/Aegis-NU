// Aegis-NU Course Feedback Autofill Script
console.log('Aegis-NU: Feedback Module Loaded.');

if (window.location.href.includes('CourseFeedback')) {
    setTimeout(initFeedbackModule, 1000);
}

// Message Listener for manual trigger
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'triggerFeedback') {
        initFeedbackModule();
        sendResponse({ status: 'success' });
    }
});

function initFeedbackModule() {
    // Prevent duplicate injection
    if (document.querySelector('.aegis-feedback-widget')) return;

    // 2. Create floating widget
    const widget = document.createElement('div');
    widget.className = 'aegis-feedback-widget';
    widget.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:9999; background-color:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:16px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); font-family:system-ui, -apple-system, sans-serif; display:flex; flex-direction:column; gap:12px; align-items:center;';

    const title = document.createElement('div');
    title.innerText = 'Aegis-NU Automation';
    title.style.cssText = 'font-size:0.875rem; font-weight:700; color:#0f172a; text-transform:uppercase; letter-spacing:0.05em;';

    const btn = document.createElement('button');
    btn.innerText = '✨ Autofill Positive Feedback';
    btn.style.cssText = 'background-color:#2563eb; color:#ffffff; font-weight:600; font-size:0.875rem; padding:10px 16px; border:none; border-radius:8px; cursor:pointer; transition:background-color 0.2s; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05);';
    
    btn.onmouseover = () => btn.style.backgroundColor = '#1d4ed8';
    btn.onmouseout = () => btn.style.backgroundColor = '#2563eb';

    btn.addEventListener('click', () => {
        autofillFeedback();
    });

    widget.appendChild(title);
    widget.appendChild(btn);
    document.body.appendChild(widget);
}

function autofillFeedback() {
    // 4. Target all radio button groups
    // FlexStudent often uses specific classes or just standard table rows with radios
    // A robust way is to group radio buttons by their 'name' attribute
    const allRadios = document.querySelectorAll('input[type="radio"]');
    
    if (allRadios.length === 0) {
        alert('Aegis-NU: No radio buttons found on this page.');
        return;
    }

    const radioGroups = {};
    allRadios.forEach(radio => {
        const name = radio.name;
        if (!name) return;
        if (!radioGroups[name]) {
            radioGroups[name] = [];
        }
        radioGroups[name].push(radio);
    });

    let filledCount = 0;

    // 5. Randomly select highest or second-highest positive option
    // Assuming standard likert scale left-to-right (1 to 5) or right-to-left
    // In many forms, the best option is either first or last in the DOM order for that group.
    // We'll assume the best option is usually index 0 or index (length - 1).
    // Often "Strongly Agree" is index 0. We'll pick randomly between index 0 and 1.
    
    Object.keys(radioGroups).forEach(groupName => {
        const group = radioGroups[groupName];
        
        // Skip if not enough options to choose from
        if (group.length < 2) return;

        // Determine if left is positive or right is positive
        // We can inspect the text next to the radio button, but safely we can just use 0 or 1
        // assuming standard FAST-NUCES layout where 1st is Strongly Agree, 2nd is Agree
        
        // Randomly pick 0 or 1
        const targetIndex = Math.random() < 0.7 ? 0 : 1; // 70% chance of highest, 30% second highest
        
        if (group[targetIndex]) {
            group[targetIndex].click(); // Simulate real click for event listeners
            group[targetIndex].checked = true;
            filledCount++;
        }
    });

    // Also look for textareas to fill with a generic positive comment (optional bonus)
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(ta => {
        if (!ta.value) {
            const comments = [
                "Great course, learned a lot.",
                "Good teaching methodology.",
                "Satisfied with the overall experience.",
                "The course content was well structured.",
                "No issues, everything was smooth."
            ];
            ta.value = comments[Math.floor(Math.random() * comments.length)];
            ta.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    alert(\`Aegis-NU: Successfully autofilled \${filledCount} questions with randomized positive feedback!\`);
}
