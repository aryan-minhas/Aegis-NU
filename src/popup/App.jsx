import React, { useEffect, useState } from 'react';

export default function App() {
  const [theme, setTheme] = useState('Classic');

  // Load theme from storage on mount
  useEffect(() => {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['aegis_theme'], (result) => {
        if (result.aegis_theme) {
          setTheme(result.aegis_theme);
        }
      });
    }
  }, []);

  // Handle theme change and save to storage
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ aegis_theme: newTheme }, () => {
        console.log(`Aegis-NU Theme updated to ${newTheme}`);
      });
    }
  };

  // Quick Action Handler
  const executeAction = async (actionName) => {
    if (!chrome || !chrome.tabs) {
        console.warn('Chrome API not available (local dev environment). Action:', actionName);
        return;
    }

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) return;

      // Ensure we only inject if it's a FAST NUCES page (or allow on any page for testing)
      if (!activeTab.url.includes('nu.edu.pk')) {
          console.warn('Aegis-NU: Not on a flexstudent.nu.edu.pk page.');
          // We can still try to execute or show an alert
      }

      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: actionName === 'gpa' ? calculateGPAScript : fixMarksScript,
      });
    } catch (error) {
      console.error(`Aegis-NU Error executing ${actionName} script:`, error);
    }
  };

  // Injected Scripts
  const calculateGPAScript = () => {
    console.log('Aegis-NU: Executing GPA Calculator script in active tab.');
    alert('Aegis-NU: GPA Calculator injected successfully!');
    // Future logic goes here
  };

  const fixMarksScript = () => {
    console.log('Aegis-NU: Executing Fix Marks script in active tab.');
    alert('Aegis-NU: Fix Marks script injected successfully!');
    // Future logic goes here
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${
      theme === 'Midnight' ? 'bg-slate-900 text-slate-100' :
      theme === 'Nordic' ? 'bg-[#ECEFF4] text-[#2E3440]' : 
      'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Branding Header */}
      <header className={`p-4 shadow-sm flex items-center justify-center ${
        theme === 'Midnight' ? 'bg-slate-800 border-b border-slate-700' :
        theme === 'Nordic' ? 'bg-[#D8DEE9] border-b border-[#D8DEE9]' :
        'bg-white border-b border-slate-200'
      }`}>
        <h1 className="text-2xl font-bold tracking-tight text-blue-600">Aegis-NU</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Theme Engine */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-70">
            Theme Engine
          </h2>
          <div className="flex bg-opacity-20 bg-slate-200 p-1 rounded-lg">
            {['Classic', 'Midnight', 'Nordic'].map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  theme === t
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-70">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => executeAction('gpa')}
              className="flex flex-col items-center justify-center p-4 rounded-xl shadow-sm border border-slate-200/50 hover:border-blue-300 hover:shadow-md transition-all bg-white/50 backdrop-blur-sm"
            >
              <span className="text-2xl mb-2">🧮</span>
              <span className="text-sm font-medium">GPA Calculator</span>
            </button>
            
            <button
              onClick={() => executeAction('fix')}
              className="flex flex-col items-center justify-center p-4 rounded-xl shadow-sm border border-slate-200/50 hover:border-blue-300 hover:shadow-md transition-all bg-white/50 backdrop-blur-sm"
            >
              <span className="text-2xl mb-2">🛠️</span>
              <span className="text-sm font-medium">Fix Marks</span>
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="p-3 text-center text-xs opacity-50">
        Aegis-NU v1.0.0
      </footer>
    </div>
  );
}
