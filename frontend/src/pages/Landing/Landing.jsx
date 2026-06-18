import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Navigation, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "Trusted Commutes",
      desc: "Travel with peace of mind. Every HerRide trip is driven by verified female drivers who pass background checks.",
      badge: "Female Drivers Only",
      icon: (
        <div className="w-48 h-48 bg-primary-light/40 rounded-full flex items-center justify-center relative">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-24 h-24 bg-primary text-white rounded-3xl flex items-center justify-center shadow-lg border border-primary-dark"
          >
            <Shield className="w-12 h-12" />
          </motion.div>
          <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-accent animate-ping" />
        </div>
      )
    },
    {
      title: "Instant SOS Alerts",
      desc: "Stay connected. Your trusted contacts receive live location coordinates and emergency dispatch alerts automatically.",
      badge: "Trusted Contacts Sync",
      icon: (
        <div className="w-48 h-48 bg-secondary-light/40 rounded-full flex items-center justify-center relative">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-24 h-24 bg-secondary text-white rounded-3xl flex items-center justify-center shadow-lg border border-secondary-dark"
          >
            <Sparkles className="w-12 h-12 text-accent" />
          </motion.div>
          <div className="absolute bottom-4 left-6 w-3 h-3 rounded-full bg-success animate-pulse" />
        </div>
      )
    },
    {
      title: "Live GPS Shielding",
      desc: "Safe tracking active. Our emergency command center monitors your route and dispatches help in real-time.",
      badge: "24/7 Dispatch Control",
      icon: (
        <div className="w-48 h-48 bg-accent-light/40 rounded-full flex items-center justify-center relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 15 }}
            className="w-24 h-24 bg-accent text-white rounded-3xl flex items-center justify-center shadow-lg border border-accent-dark"
          >
            <Navigation className="w-12 h-12 text-white" />
          </motion.div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (slide < 2) {
      setSlide(slide + 1);
    } else {
      // Proceed to Location Permission screen
      navigate('/auth?flow=location');
    }
  };

  const progressPercent = ((slide + 1) / 3) * 100;

  return (
    <div className="flex-1 bg-white flex flex-col justify-between p-6">
      
      {/* Onboarding Header */}
      <div className="flex items-center justify-between py-2 border-b border-brandBorder/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center font-display font-extrabold text-sm">
            H
          </div>
          <span className="font-display font-bold text-sm text-primary">HerRide</span>
        </div>
        <button 
          onClick={() => navigate('/auth?flow=login')} 
          className="text-xs font-bold text-slate-400 hover:text-primary transition"
        >
          Skip
        </button>
      </div>

      {/* Slide Visuals */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center space-y-6 max-w-xs"
          >
            {/* Vector Badge */}
            <span className="bg-slate-100 text-slate-600 border border-slate-200/60 text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
              {slides[slide].badge}
            </span>

            {/* Illustration */}
            <div className="py-2">
              {slides[slide].icon}
            </div>

            {/* Title & Description */}
            <div className="space-y-2.5">
              <h2 className="text-xl font-display font-bold text-slate-800">{slides[slide].title}</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{slides[slide].desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Circular Indicators & Next Trigger */}
      <div className="flex flex-col items-center py-6 space-y-4">
        {/* Simple Dots */}
        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                slide === idx ? 'w-5 bg-primary' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Circular Next Button */}
        <div className="relative w-16 h-16 flex items-center justify-center cursor-pointer" onClick={handleNext}>
          {/* Circular progress bar SVG */}
          <svg className="absolute inset-0 -rotate-90 w-full h-full text-slate-100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" />
            <motion.circle 
              cx="50" 
              cy="50" 
              r="44" 
              stroke="#6D28D9" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray="276"
              animate={{ strokeDashoffset: 276 - (276 * progressPercent) / 100 }}
              transition={{ duration: 0.3 }}
            />
          </svg>

          {/* Button core */}
          <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
            {slide === 2 ? (
              <span className="text-xs font-bold font-display uppercase tracking-wider">Go</span>
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
