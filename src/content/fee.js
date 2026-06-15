// Aegis-NU Fee Default Prevention Script
console.log('Aegis-NU: Fee Management Module Loaded.');

if (window.location.href.includes('Challan') || window.location.href.includes('ConsolidatedFeeReport')) {
    setTimeout(initFeeModule, 1500);
}

function initFeeModule() {
    const tables = document.querySelectorAll('table');
    let latestChallan = null;

    // Iterate through tables to find the one containing Challan data
    tables.forEach(table => {
        const headers = Array.from(table.querySelectorAll('th, td')).map(el => el.innerText.trim().toUpperCase());
        const hasDate = headers.some(h => h.includes('DUE DATE') || h.includes('VALID UPTO') || h.includes('DATE'));
        const hasStatus = headers.some(h => h.includes('STATUS') || h.includes('PAID'));

        if (hasDate && hasStatus) {
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            
            // Assume the most recent challan is the first or last data row depending on sorting
            // We'll parse all rows and find the most recent unpaid one, or the absolute latest one
            rows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length < 3) return;

                let dueDateStr = '';
                let statusStr = '';

                // Extract texts
                cells.forEach(cell => {
                    const text = cell.innerText.trim().toUpperCase();
                    if (text === 'PAID' || text === 'UNPAID' || text === 'PENDING') {
                        statusStr = text;
                    }
                    // Very basic date regex: DD-MMM-YYYY or DD/MM/YYYY
                    if (/(\d{1,2}[-\s/][A-Z]{3}[-\s/]\d{2,4})|(\d{1,2}[-\s/]\d{1,2}[-\s/]\d{2,4})/i.test(text)) {
                        dueDateStr = text;
                    }
                });

                if (dueDateStr && statusStr) {
                    const parsedDate = new Date(dueDateStr);
                    if (!isNaN(parsedDate)) {
                        if (!latestChallan || parsedDate > latestChallan.date) {
                            latestChallan = { date: parsedDate, status: statusStr, rawDate: dueDateStr };
                        }
                    }
                }
            });
        }
    });

    if (latestChallan && latestChallan.status !== 'PAID') {
        const today = new Date();
        // Reset times for accurate day calculation
        today.setHours(0, 0, 0, 0);
        const due = new Date(latestChallan.date);
        due.setHours(0, 0, 0, 0);

        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
            injectWarningBanner(diffDays, latestChallan.rawDate);
        }
    }
}

function injectWarningBanner(daysRemaining, dateString) {
    // Check if banner already exists
    if (document.getElementById('aegis-fee-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'aegis-fee-banner';
    
    let config = {
        bg: 'bg-yellow-50',
        border: 'border-yellow-400',
        text: 'text-yellow-800',
        icon: '⚠️',
        message: ''
    };

    if (daysRemaining < 0) {
        config = {
            bg: 'bg-red-50',
            border: 'border-red-500',
            text: 'text-red-700',
            icon: '🚨',
            message: `URGENT: Fee deadline passed ${Math.abs(daysRemaining)} days ago (${dateString}). Late fees may apply.`
        };
    } else if (daysRemaining === 0) {
        config = {
            bg: 'bg-red-50',
            border: 'border-red-500',
            text: 'text-red-700',
            icon: '⏰',
            message: `URGENT: Fee deadline is TODAY (${dateString}). Please pay immediately.`
        };
    } else {
        config.message = `NOTICE: Fee deadline in ${daysRemaining} days (${dateString}).`;
    }

    banner.className = `${config.bg} ${config.border} ${config.text} border-l-4 p-4 mb-4 shadow-md flex items-center gap-3 font-sans sticky top-0 z-50`;
    
    // Inline styles as fallback
    banner.style.cssText = `
        position: sticky;
        top: 0;
        z-index: 9999;
        padding: 16px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border-left: 4px solid ${daysRemaining <= 0 ? '#ef4444' : '#facc15'};
        background-color: ${daysRemaining <= 0 ? '#fef2f2' : '#fefce8'};
        color: ${daysRemaining <= 0 ? '#b91c1c' : '#854d0e'};
    `;

    banner.innerHTML = `
        <span style="font-size: 1.5rem;">${config.icon}</span>
        <div style="font-weight: 600; font-size: 1rem;">${config.message}</div>
    `;

    // Inject at the very top of the main container or body
    const mainContainer = document.querySelector('.page-content') || document.body;
    mainContainer.insertBefore(banner, mainContainer.firstChild);
}