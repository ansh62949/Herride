import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import { 
  Shield, 
  Menu, 
  X, 
  MapPin, 
  History, 
  AlertTriangle, 
  Settings as SettingsIcon, 
  User, 
  LogOut, 
  Radio,
  ChevronRight,
  ShieldCheck,
  Users
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Shell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, 
    setRole, 
    activeSosAlert, 
    safetyCheckin, 
    respondSafetyCheckin, 
    currentTrip,
    driverOnline,
    toggleDriverOnline,
    logout
  } = useHerRideStore();

  const [drawerOpen, setDrawerOpen] = useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      navigate('/auth?flow=login');
    }
  }, [navigate]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setDrawerOpen(false);
    if (newRole === 'RIDER') {
      navigate('/home');
    } else if (newRole === 'DRIVER') {
      navigate('/driver');
    } else if (newRole === 'ADMIN') {
      navigate('/admin');
    }
  };

  const handleNav = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/auth?flow=login');
  };

  if (user && (user.role === 'ADMIN' || location.pathname.startsWith('/admin'))) {
    if (user.email !== 'admin@herride.com') {
      return (
        <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 font-sans select-none">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-display font-extrabold mb-2 text-center text-red-500 uppercase tracking-wider">Access Denied</h1>
          <p className="text-xs text-slate-400 text-center max-w-xs mb-6 font-semibold leading-relaxed">
            This system terminal is restricted. Only authorized system administrators are permitted access.
          </p>
          <button 
            onClick={() => window.location.href = '/home'}
            className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl hover:bg-slate-800 transition"
          >
            Return to Rider Interface
          </button>
        </div>
      );
    }
    return (
      <div className="flex-grow flex h-screen overflow-hidden bg-slate-50 font-sans">
        {/* Persistent Desktop Sidebar */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-slate-800">
          <div className="p-6 space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5 pb-5 border-b border-slate-800">
              <div className="w-8 h-8 bg-accent text-white rounded-xl flex items-center justify-center font-display font-bold text-base shadow-lg shadow-accent/25">
                H
              </div>
              <div>
                <span className="font-display font-extrabold text-sm text-white block">HerRide Control</span>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block mt-0.5">Admin Telemetry</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col space-y-1 text-xs font-bold">
              <button 
                onClick={() => navigate('/admin')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition ${
                  location.pathname === '/admin' ? 'bg-accent text-white shadow' : 'text-slate-400'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Overview Dashboard</span>
              </button>
              <button 
                onClick={() => navigate('/admin/riders')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition ${
                  location.pathname === '/admin/riders' ? 'bg-accent text-white shadow' : 'text-slate-400'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Active Passengers</span>
              </button>
              <button 
                onClick={() => navigate('/admin/drivers')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition ${
                  location.pathname === '/admin/drivers' ? 'bg-accent text-white shadow' : 'text-slate-400'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Verification Queue</span>
              </button>
              <button 
                onClick={() => navigate('/admin/alerts')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition ${
                  location.pathname === '/admin/alerts' ? 'bg-accent text-white shadow' : 'text-slate-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Active SOS Dispatch</span>
              </button>
              <button 
                onClick={() => navigate('/admin/reports')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition ${
                  location.pathname === '/admin/reports' ? 'bg-accent text-white shadow' : 'text-slate-400'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Incident Safety Log</span>
              </button>
              <button 
                onClick={() => navigate('/admin/rides')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition ${
                  location.pathname === '/admin/rides' ? 'bg-accent text-white shadow' : 'text-slate-400'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Rides Telemetry</span>
              </button>
            </nav>

            {/* Switch role box */}
            <div className="pt-5 border-t border-slate-800">
              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Dev Role Switcher</span>
              <div className={`grid ${user?.email === 'admin@herride.com' ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-slate-950/50 border border-slate-800 p-1 rounded-xl text-[9px] font-extrabold text-center`}>
                <button onClick={() => handleRoleChange('RIDER')} className="py-1 rounded-lg text-slate-400 hover:text-white">Rider</button>
                <button onClick={() => handleRoleChange('DRIVER')} className="py-1 rounded-lg text-slate-400 hover:text-white">Driver</button>
                {user?.email === 'admin@herride.com' && (
                  <button onClick={() => handleRoleChange('ADMIN')} className="py-1 rounded-lg bg-accent text-white shadow">Admin</button>
                )}
              </div>
            </div>
          </div>

          {/* Log Out */}
          <div className="p-6 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full py-2.5 bg-slate-950/40 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-900/30 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Content pane */}
        <div className="flex-grow flex flex-col h-screen overflow-y-auto bg-slate-50 relative">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col relative h-full overflow-hidden bg-surface">
      
      {/* Global SOS Alert Screen Overlay */}
      <AnimatePresence>
        {activeSosAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-red-600/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2)_0%,transparent_70%)] animate-pulse" />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-20 h-20 rounded-full bg-white/20 border-2 border-white flex items-center justify-center mb-6"
            >
              <Shield className="w-10 h-10 text-white fill-current" />
            </motion.div>
            <h1 className="text-xl font-display font-bold mb-2 text-center">EMERGENCY SOS ACTIVE</h1>
            <p className="text-[10px] text-red-100 text-center max-w-xs mb-6 font-medium leading-relaxed">
              HerRide Emergency Dispatch has been notified. Live telemetry is being shared.
            </p>
            
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 w-full max-w-xs mb-6 text-[10px] font-semibold">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span>Rider:</span>
                <span>{user?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span>Phone:</span>
                <span>{user?.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Location:</span>
                <span>28.6139, 77.2090</span>
              </div>
            </div>

            <button 
              onClick={() => useHerRideStore.getState().resolveSos(activeSosAlert.id)}
              className="px-6 py-2.5 bg-white text-red-600 font-bold rounded-xl text-xs hover:bg-red-50 transition"
            >
              Cancel SOS Alarm
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Safety Check-in Dialog */}
      <AnimatePresence>
        {safetyCheckin && safetyCheckin.show && (
          <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 max-w-[280px] w-full text-center relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-display font-bold mb-1">Safety Check-in</h3>
              <p className="text-[10px] text-brandText-muted leading-relaxed mb-4 font-semibold">
                Are you safe and comfortable in your ride?
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => respondSafetyCheckin(true)}
                  className="py-2 bg-slate-100 text-brandText text-xs font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Safe
                </button>
                <button
                  onClick={() => respondSafetyCheckin(false)}
                  className="py-2 bg-danger text-white text-xs font-bold rounded-xl hover:bg-danger-dark transition flex items-center justify-center gap-1"
                >
                  Help
                </button>
              </div>
              
              <div className="text-[9px] text-slate-400 font-semibold">
                SOS trigger in <span className="text-danger font-bold">{safetyCheckin.countdown}s</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header (Figma styled Mobile Navigation Bar) */}
      <header className="h-12 bg-white border-b border-brandBorder/60 px-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <button 
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 hover:bg-slate-50 rounded-xl transition text-slate-600"
          title="Open Drawer Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center font-display font-bold text-sm">
            H
          </div>
          <span className="font-display font-bold text-sm text-primary">HerRide</span>
        </div>

        {/* Quick Online indicator for drivers / profile badge */}
        <div className="flex items-center gap-2">
          {user?.role === 'DRIVER' ? (
            <span className={`w-2 h-2 rounded-full ${driverOnline ? 'bg-success animate-pulse' : 'bg-slate-300'}`} />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-primary-light text-primary-dark border border-primary/20 text-[8px] font-bold px-1.5 py-0.5 uppercase">
              R
            </span>
          )}
        </div>
      </header>

      {/* Main Drawer Menu (Figma Screen 44 Drawer Layout) */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-40 cursor-pointer"
            />

            {/* Sidebar core */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute top-0 bottom-0 left-0 w-[280px] bg-white z-50 flex flex-col justify-between shadow-2xl"
            >
              <div className="p-5 space-y-6">
                
                {/* Close Drawer Button */}
                <div className="flex justify-end">
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Profile Info */}
                <div className="flex items-center gap-3.5 pb-5 border-b border-brandBorder/50">
                  <div className="w-12 h-12 bg-primary-light text-primary rounded-2xl flex items-center justify-center font-display font-bold text-xl border border-primary/10">
                    {user?.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-800">{user?.name}</h3>
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] text-brandText-light font-bold">Verified {user?.role}</span>
                  </div>
                </div>

                {/* Sidebar Navigation Options */}
                <nav className="flex flex-col space-y-1 text-xs font-bold text-slate-600">
                  {user?.role === 'RIDER' && (
                    <>
                      <button 
                        onClick={() => handleNav('/home')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-primary transition ${
                          location.pathname === '/home' ? 'bg-primary-light/20 text-primary' : ''
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>Book a Ride</span>
                      </button>

                      <button 
                        onClick={() => handleNav('/history')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-primary transition ${
                          location.pathname === '/history' ? 'bg-primary-light/20 text-primary' : ''
                        }`}
                      >
                        <History className="w-4 h-4 text-primary" />
                        <span>Ride History</span>
                      </button>

                      <button 
                        onClick={() => handleNav('/complain')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-primary transition ${
                          location.pathname === '/complain' ? 'bg-primary-light/20 text-primary' : ''
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-primary" />
                        <span>Complain / Incident</span>
                      </button>

                      <button 
                        onClick={() => handleNav('/settings')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-primary transition ${
                          location.pathname === '/settings' ? 'bg-primary-light/20 text-primary' : ''
                        }`}
                      >
                        <SettingsIcon className="w-4 h-4 text-primary" />
                        <span>Settings Suite</span>
                      </button>

                      <button 
                        onClick={() => handleNav('/profile')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-primary transition ${
                          location.pathname === '/profile' ? 'bg-primary-light/20 text-primary' : ''
                        }`}
                      >
                        <User className="w-4 h-4 text-primary" />
                        <span>Safety Profile</span>
                      </button>
                    </>
                  )}

                  {user?.role === 'DRIVER' && (
                    <>
                      <button 
                        onClick={() => handleNav('/driver')}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-secondary transition"
                      >
                        <Radio className="w-4 h-4 text-secondary" />
                        <span>Driver Dashboard</span>
                      </button>
                      
                      <button 
                        onClick={() => handleNav('/driver/verification')}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-secondary transition"
                      >
                        <Shield className="w-4 h-4 text-secondary" />
                        <span>Documents Center</span>
                      </button>

                      <button 
                        onClick={() => handleNav('/driver/safety')}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-secondary transition"
                      >
                        <AlertTriangle className="w-4 h-4 text-secondary" />
                        <span>Driver Safety</span>
                      </button>
                    </>
                  )}

                  {user?.role === 'ADMIN' && (
                    <>
                      <button 
                        onClick={() => handleNav('/admin')}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-accent transition"
                      >
                        <SettingsIcon className="w-4 h-4 text-accent" />
                        <span>Overview</span>
                      </button>
                      <button 
                        onClick={() => handleNav('/admin/riders')}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-accent transition"
                      >
                        <Users className="w-4 h-4 text-accent" />
                        <span>Active Passengers</span>
                      </button>
                      <button 
                        onClick={() => handleNav('/admin/drivers')}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-accent transition"
                      >
                        <Shield className="w-4 h-4 text-accent" />
                        <span>Verification Queue</span>
                      </button>
                      <button 
                        onClick={() => handleNav('/admin/alerts')}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-accent transition"
                      >
                        <AlertTriangle className="w-4 h-4 text-accent" />
                        <span>Active SOS</span>
                      </button>
                    </>
                  )}
                </nav>

                {/* Collapsible Switch Roles (Collapsable Dev Hub inside Drawer) */}
                <div className="pt-4 border-t border-brandBorder/40">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Simulation Role Switcher</span>
                  <div className={`grid ${user?.email === 'admin@herride.com' ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-slate-50 border border-brandBorder rounded-xl p-1 text-[9px] font-bold text-center`}>
                    <button onClick={() => handleRoleChange('RIDER')} className={`py-1 rounded-lg ${user?.role === 'RIDER' ? 'bg-primary text-white' : 'text-slate-500'}`}>Rider</button>
                    <button onClick={() => handleRoleChange('DRIVER')} className={`py-1 rounded-lg ${user?.role === 'DRIVER' ? 'bg-secondary text-white' : 'text-slate-500'}`}>Driver</button>
                    {user?.email === 'admin@herride.com' && (
                      <button onClick={() => handleRoleChange('ADMIN')} className={`py-1 rounded-lg ${user?.role === 'ADMIN' ? 'bg-accent text-white' : 'text-slate-500'}`}>Admin</button>
                    )}
                  </div>
                </div>

              </div>

              {/* Log Out button */}
              <div className="p-5 border-t border-brandBorder/50">
                <button 
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-brandBorder hover:border-red-100 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Inner Screen Scroll Canvas */}
      <div className="flex-grow flex flex-col overflow-y-auto relative">
        {children}
      </div>

    </div>
  );
}

