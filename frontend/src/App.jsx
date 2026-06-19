import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  if (isAdminPath) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col">
        <AppRoutes />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-6 font-sans">
      <div className="w-full h-screen sm:h-[840px] sm:w-[410px] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 bg-surface flex flex-col overflow-hidden sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative">
        <AppRoutes />
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
