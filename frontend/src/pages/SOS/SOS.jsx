import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Shield, AlertTriangle, ShieldCheck, PhoneCall, Radio, ArrowLeft, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SOS() {
  const navigate = useNavigate();
  const { triggerSos, activeSosAlert } = useHerRideStore();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const holdIntervalRef = useRef(null);

  const startHolding = () => {
    setHolding(true);
    setProgress(0);
    
    // Increment progress every 30ms (so 3000ms = 100 steps)
    holdIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current);
          triggerSos();
          return 100;
        }
        return prev + 1;
      });
    }, 30);
  };

  const stopHolding = () => {
    setHolding(false);
    setProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  return (
    <div className="flex-1 bg-slate-900 text-white p-6 flex flex-col justify-between max-w-md mx-auto w-full min-h-[calc(100vh-68px)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 py-4">
        <button 
          onClick={() => navigate('/home')}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-display font-extrabold text-white">Emergency Center</h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secure Telemetry Active</span>
        </div>
      </div>

      {/* Main Hold-to-SOS Core */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 my-8">
        <div className="text-center max-w-xs">
          <h1 className="text-2xl font-bold font-display text-red-500 mb-2">PRESS & HOLD SOS</h1>
          <p className="text-xs text-slate-300 font-medium">Hold the red button for 3 full seconds to trigger the HerRide emergency protocol.</p>
        </div>

        {/* SOS Action Button */}
        <div className="relative w-64 h-64 flex items-center justify-center select-none">
          {/* Radial animated waves when idle */}
          {!holding && (
            <>
              <div className="absolute inset-0 bg-red-600/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-8 bg-red-600/15 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            </>
          )}

          {/* SVG Progress Circle Border */}
          <svg className="absolute inset-0 -rotate-90 w-full h-full text-slate-800" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" />
            <motion.circle 
              cx="50" 
              cy="50" 
              r="44" 
              stroke="#EF4444" 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray="276"
              strokeDashoffset={276 - (276 * progress) / 100}
              transition={{ ease: 'linear' }}
            />
          </svg>

          {/* Red button core */}
          <motion.div
            onMouseDown={startHolding}
            onMouseUp={stopHolding}
            onMouseLeave={stopHolding}
            onTouchStart={startHolding}
            onTouchEnd={stopHolding}
            animate={holding ? { scale: 0.95 } : { scale: 1 }}
            className="w-48 h-48 bg-gradient-to-tr from-red-600 to-red-500 rounded-full flex flex-col items-center justify-center shadow-2xl shadow-red-500/30 border-4 border-red-400/20 cursor-pointer active:from-red-700 active:to-red-600 z-10 select-none touch-none"
          >
            <AlertTriangle className="w-16 h-16 text-white mb-2" />
            <span className="text-sm font-extrabold tracking-widest text-red-100 uppercase">
              {holding ? `HOLDING (${Math.ceil((100 - progress) / 33)}s)` : 'HOLD SOS'}
            </span>
          </motion.div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-1">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>GPS Protection Status: Active</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Location: 28.6139° N, 77.2090° E (New Delhi, India)
          </div>
        </div>
      </div>

      {/* Helplines and Trusted Contacts Section */}
      <div className="space-y-4 overflow-y-auto max-h-[260px] pr-1 pb-4 scrollbar-thin">
        
        {/* Helplines */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Indian Women Helpline</h3>
          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
            <a 
              href="tel:1091" 
              className="py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-red-200 flex items-center justify-center gap-1.5 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-400" />
              <span>Call Helpline (1091)</span>
            </a>
            <a 
              href="tel:112" 
              className="py-2.5 bg-slate-700/40 hover:bg-slate-700/60 border border-slate-650 rounded-xl text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Emergency (112)</span>
            </a>
          </div>
        </div>

        {/* Live Location Sharing Status */}
        <div className="bg-slate-800/40 border border-slate-850 rounded-2xl p-3 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold text-slate-200 block">Telemetry Transmission</span>
            <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
              Live coordinate packets are broadcasting to the command room. Trusted contacts will receive updates via automated SMS logs.
            </p>
          </div>
        </div>

        {/* Trusted Contacts Registry List */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">SMS Alert Contacts</h3>
          {useHerRideStore.getState().trustedContacts.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic">No trusted contacts linked. Register contacts in contacts registry.</p>
          ) : (
            <div className="space-y-2">
              {useHerRideStore.getState().trustedContacts.map((contact) => (
                <div key={contact.id} className="flex justify-between items-center text-[10px] bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-200">{contact.name} ({contact.relationship})</span>
                    <span className="text-slate-500 block font-mono text-[9px]">{contact.phone}</span>
                  </div>
                  <span className="text-[9px] bg-primary-light/10 text-primary-dark border border-primary/20 px-2 py-0.5 rounded-full font-bold">SMS Sync</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
