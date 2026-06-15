import React, { useEffect, useState } from 'react';

export default function App() {
  const [theme, setTheme] = useState('Classic');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Load theme from storage on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
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
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ aegis_theme: newTheme });
    }
  };

  const triggerToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Quick Action Handler
  const executeAction = async (action) => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      console.warn('Chrome API not available.');
      triggerToast('Dev Mode: Action Simulated');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const actionMap = {
        'gpa': { msg: 'triggerGPA', file: 'src/gpa/index.js' },
        'marks': { msg: 'triggerMarks', file: 'src/marks/index.js' },
        'feedback': { msg: 'triggerFeedback', file: 'src/feedback/index.js' }
      };

      const target = actionMap[action];
      if (!target) return;

      // 1. Try sending message first
      try {
        await chrome.tabs.sendMessage(tab.id, { action: target.msg });
        triggerToast('Action Triggered!');
      } catch (err) {
        // 2. If message fails (script not loaded), try injecting
        console.log('Aegis-NU: Content script not found, attempting injection...');
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [target.file]
        });
        triggerToast('Script Injected & Triggered!');
      }
    } catch (error) {
      console.error('Aegis-NU Error:', error);
      triggerToast('Error: Is this a NU page?');
    }
  };

  return (
    <div className={`flex flex-col w-[350px] min-h-[450px] overflow-hidden transition-colors duration-300 ${
      theme === 'Midnight' ? 'bg-slate-900 text-slate-100' :
      theme === 'Nordic' ? 'bg-[#ECEFF4] text-[#2E3440]' : 
      'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Branding Header */}
      <header className={`p-5 shadow-md flex flex-col items-center justify-center relative overflow-hidden ${
        theme === 'Midnight' ? 'bg-slate-800 border-b border-slate-700' :
        theme === 'Nordic' ? 'bg-[#D8DEE9] border-b border-[#D8DEE9]' :
        'bg-white border-b border-slate-200'
      }`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-600"></div>
        <h1 className="text-3xl font-black tracking-tighter text-blue-600 italic">AEGIS-NU</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 mt-1">Student Intelligence Suite</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Theme Engine */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-current opacity-20"></span>
            Theme Engine
          </h2>
          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl backdrop-blur-md">
            {['Classic', 'Midnight', 'Nordic'].map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                  theme === t
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'hover:bg-slate-300/50 opacity-60 hover:opacity-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-current opacity-20"></span>
            Intelligence Modules
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => executeAction('gpa')}
              className="group flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border border-slate-200/50 hover:border-blue-400 hover:shadow-blue-500/10 hover:shadow-xl transition-all duration-300 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📉</span>
              <span className="text-xs font-bold uppercase">GPA Calc</span>
            </button>
            
            <button
              onClick={() => executeAction('marks')}
              className="group flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border border-slate-200/50 hover:border-blue-400 hover:shadow-blue-500/10 hover:shadow-xl transition-all duration-300 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🎯</span>
              <span className="text-xs font-bold uppercase">Target Grade</span>
            </button>

            <button
              onClick={() => executeAction('feedback')}
              className="group col-span-2 flex items-center justify-center gap-3 p-4 rounded-2xl shadow-sm border border-slate-200/50 hover:border-blue-400 hover:shadow-blue-500/10 hover:shadow-xl transition-all duration-300 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm"
            >
              <span className="text-2xl group-hover:rotate-12 transition-transform">✨</span>
              <span className="text-xs font-bold uppercase">Autofill Course Feedback</span>
            </button>
          </div>
        </section>

      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 border-2 border-white/20">
            <span>🚀</span> {toastMessage}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`p-4 text-center border-t ${
        theme === 'Midnight' ? 'border-slate-800 bg-slate-900/50' :
        theme === 'Nordic' ? 'border-[#D8DEE9] bg-[#E5E9F0]/50' :
        'border-slate-100 bg-slate-50/50'
      }`}>
        <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Aegis-NU v1.0.0 &bull; Built for Excellence</p>
      </footer>
    </div>
  );
}
