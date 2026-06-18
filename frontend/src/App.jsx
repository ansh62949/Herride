import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Wifi, Battery, Signal } from 'lucide-react';

function AppContent() {
  const [time, setTime] = useState('');
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // Update simulated smartphone status clock
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isAdminPath) {
    return (
      <div className="w-full min-h-screen bg-surface flex flex-col">
        <AppRoutes />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center p-0 md:p-6 select-none font-sans overflow-hidden relative">
      
      {/* Blurred Map Grid background vector decoration */}
      <svg className="absolute inset-0 w-full h-full text-slate-900 opacity-20 pointer-events-none filter blur-xs" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="bg-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="none" />
        <rect width="100%" height="100%" fill="url(#bg-grid)" />
        <circle cx="50%" cy="50%" r="300" fill="#6D28D9" opacity="0.1" className="filter blur-3xl animate-pulse" />
      </svg>

      {/* SMARTPHONE BEZEL DEVICE MOCKUP */}
      <div className="w-full h-screen md:h-[844px] md:w-[390px] bg-white md:rounded-[48px] md:shadow-2xl md:border-[10px] md:border-slate-900 flex flex-col relative overflow-hidden shrink-0 md:ring-[1px] md:ring-white/10 z-10">
        
        {/* Notch / Speaker grill on top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-slate-900 rounded-b-2xl z-50 hidden md:flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full" />
        </div>

        {/* Dynamic Mobile Status Bar */}
        <div className="h-10 bg-white/95 border-b border-slate-50 flex items-center justify-between px-6 shrink-0 z-40 text-[11px] font-bold text-slate-800">
          <span>{time}</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Signal className="w-3.5 h-3.5 fill-current" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">100%</span>
              <Battery className="w-4 h-4 fill-current text-success-dark" />
            </div>
          </div>
        </div>

        {/* App Content Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-surface">
          <AppRoutes />
        </div>

        {/* Virtual Home Bar Indicator */}
        <div className="h-6 bg-white/95 flex items-center justify-center shrink-0 z-40">
          <div className="w-28 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>

    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
