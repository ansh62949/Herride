import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

function AppContent() {
  return (
    <div className="w-full min-h-screen bg-surface flex flex-col">
      <AppRoutes />
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
